import Imap from 'imap-simple';
import { simpleParser } from 'mailparser';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');
import { firestore, storage, admin } from '../lib/firebase-admin.js';

// ── Persistencia en Firestore (compatible con entornos sin sistema de archivos) ──
const STATE_COL  = 'scanner_state';
const CACHE_DOC  = 'cache';
const LOGS_DOC   = 'logs';

export const poLogs         = [];
const processedUids         = new Set();
const processedSentUids     = new Set();

async function loadFromFirestore() {
  try {
    const [cacheSnap, logsSnap] = await Promise.all([
      firestore.collection(STATE_COL).doc(CACHE_DOC).get(),
      firestore.collection(STATE_COL).doc(LOGS_DOC).get(),
    ]);
    if (cacheSnap.exists) {
      const d = cacheSnap.data();
      (d.inboxUids || []).forEach(u => processedUids.add(u));
      (d.sentUids  || []).forEach(u => processedSentUids.add(u));
    }
    if (logsSnap.exists) {
      const entries = logsSnap.data().entries || [];
      poLogs.push(...entries);
    }
    console.log(`[Lector] Firestore: ${processedUids.size} inbox | ${processedSentUids.size} sent | ${poLogs.length} logs`);
  } catch (e) {
    console.warn('[Lector] Error cargando estado desde Firestore:', e.message);
  }
}

async function saveCache() {
  try {
    await firestore.collection(STATE_COL).doc(CACHE_DOC).set({
      inboxUids: [...processedUids],
      sentUids:  [...processedSentUids],
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('[Lector] Error guardando caché:', e.message);
  }
}

async function saveLogs() {
  try {
    await firestore.collection(STATE_COL).doc(LOGS_DOC).set({
      entries:   poLogs,
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('[Lector] Error guardando logs:', e.message);
  }
}
let isScanning = false;

export let scanStatus = {
  phase: 'idle',
  current: 0,
  total: 0,
  currentFile: null,
  message: 'Esperando primer escaneo...',
  nextScanAt: null,
};

function emitStatus(io, update) {
  scanStatus = { ...scanStatus, ...update };
  if (io) io.emit('scan_status', scanStatus);
}

function hasPdfInStruct(struct) {
  if (!struct) return false;
  if (Array.isArray(struct)) return struct.some(hasPdfInStruct);
  const type    = (struct.type    || '').toLowerCase();
  const subtype = (struct.subtype || '').toLowerCase();
  const name    = (struct.disposition?.params?.filename || struct.params?.name || '').toLowerCase();
  if ((type === 'application' && subtype === 'pdf') || name.endsWith('.pdf')) return true;
  if (struct.childNodes) return hasPdfInStruct(struct.childNodes);
  return false;
}

export async function startEmailListener(io) {
  const emailUser            = process.env.EMAIL_USER?.replace(/^["']|["']$/g, '');
  const emailPassUnformatted = process.env.EMAIL_APP_PASSWORD?.replace(/^["']|["']$/g, '');
  const emailPass            = emailPassUnformatted?.replace(/\s/g, '');

  if (!emailUser || !emailPass) {
    console.warn('⚠️ Sin credenciales en .env. El lector no iniciará.');
    return;
  }

  const config = {
    imap: {
      user: emailUser,
      password: emailPass,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      authTimeout: 15000,
      connTimeout: 60000,
      tlsOptions: { rejectUnauthorized: false },
    }
  };

  const SCAN_INTERVAL_MS = 180000;

  const scheduleNext = () => {
    const nextScanAt = Date.now() + SCAN_INTERVAL_MS;
    emitStatus(io, {
      phase: 'idle', current: 0, total: 0, currentFile: null,
      message: 'Escaneo completado. Próximo ciclo en 3 minutos.',
      nextScanAt,
    });
  };

  // Ciclo maestro: inbox (OCs) → sent (facturas + cotizaciones enviadas)
  const runScanCycle = async () => {
    if (isScanning) {
      console.log('[Lector] Ciclo anterior en curso, saltando.');
      return;
    }
    isScanning = true;
    try {
      await scanInbox();
      await scanSent();
    } finally {
      isScanning = false;
      scheduleNext();
    }
  };

  // ── SCAN INBOX: detecta OCs recibidas ──────────────────────────────────────
  const scanInbox = async () => {

    try {
      // ── FASE 1: Conexión IMAP — descargar todo y cerrar lo antes posible ──
      emitStatus(io, {
        phase: 'connecting', current: 0, total: 0, currentFile: null,
        message: 'Conectando a Gmail vía IMAP...', nextScanAt: null,
      });

      const connection = await Imap.connect(config);
      await connection.openBox('INBOX');

      emitStatus(io, { phase: 'scanning', message: 'Leyendo estructura de la bandeja...' });

      const allMessages = await connection.search(['ALL'], {
        bodies: ['HEADER.FIELDS (FROM SUBJECT DATE)'],
        struct: true,
        markSeen: false,
      });

      const unprocessed = allMessages.filter(m => !processedUids.has(m.attributes.uid));
      unprocessed.forEach(m => processedUids.add(m.attributes.uid));
      if (unprocessed.length > 0) saveCache();
      const withPdf = unprocessed.filter(m => hasPdfInStruct(m.attributes.struct));

      console.log(`[Lector] ${unprocessed.length} correos nuevos | ${withPdf.length} con posibles PDFs`);

      // Cola de buffers PDF: [{uid, filename, buffer}]
      const pdfQueue = [];

      if (withPdf.length > 0) {
        // Descargar y extraer adjuntos de uno en uno para mantener la conexión activa
        for (let i = 0; i < withPdf.length; i++) {
          const uid = withPdf[i].attributes.uid;

          emitStatus(io, {
            phase: 'scanning',
            message: `Descargando correo ${i + 1} de ${withPdf.length} (PDFs encontrados hasta ahora: ${pdfQueue.length})...`,
          });

          try {
            const results = await connection.search(
              [['UID', String(uid)]],
              { bodies: [''], markSeen: false }
            );
            const item = results?.[0];
            const part = item?.parts?.find(p => p.which === '');
            if (!part?.body) continue;

            const email = await simpleParser('Imap-Id: ' + uid + '\r\n' + part.body);
            for (const att of (email.attachments || [])) {
              const name  = att.filename || '';
              const isPdf = att.contentType === 'application/pdf' || name.toLowerCase().endsWith('.pdf');
              const isOC  = /\boc\b/i.test(name) || /[_\s\-]oc[_\s\-]/i.test(name) || name.toLowerCase().startsWith('oc');
              if (isPdf && isOC && att.content) {
                pdfQueue.push({ uid, filename: name || 'OC.pdf', buffer: att.content });
                console.log(`[Lector] OC encontrada: "${name}" (correo ${i + 1}/${withPdf.length})`);
              } else if (isPdf && !isOC) {
                console.log(`[Lector] PDF ignorado (no es OC): "${name}"`);
              }
            }
          } catch (dlErr) {
            console.error(`[Lector] Error descargando correo UID ${uid}:`, dlErr.message);
          }
        }
      }

      // Cerrar la conexión IMAP antes de procesar PDFs
      try { connection.end(); } catch (_) {}

      console.log(`[Lector] ${pdfQueue.length} PDFs extraídos de ${withPdf.length} correos. Cerrando IMAP...`);

      // ── FASE 2: Procesar PDFs — sin conexión IMAP abierta ──
      if (pdfQueue.length === 0) return;

      emitStatus(io, {
        phase: 'processing',
        total: pdfQueue.length,
        current: 0,
        message: `Analizando ${pdfQueue.length} PDFs...`,
      });

      let processed = 0;
      for (const { uid, filename, buffer } of pdfQueue) {
        processed++;
        emitStatus(io, {
          current: processed,
          currentFile: filename,
          message: `Analizando PDF ${processed}/${pdfQueue.length}: ${filename}`,
        });

        const logEntry = {
          id: `${uid}-${filename}`,
          date: new Date().toISOString(),
          filename,
          foundCode: null,
          status: 'No Coincide',
          docId: null,
        };

        try {
          const parser  = new PDFParse({ data: buffer });
          const pdfData = await parser.getText();
          const match   = pdfData.text.match(/(COT-\d{4}-\d{4,})/i);

          if (match?.[1]) {
            // ── Coincidencia por código COT ──
            const quotationId = match[1].trim();
            logEntry.foundCode = quotationId;
            console.log(`✅ Código detectado: ${quotationId} en "${filename}"`);

            const result = await updateQuotationStatus(quotationId, buffer, filename, io);
            logEntry.status = result.success
              ? 'Asignado (código)'
              : result.reason === 'Not Found' ? 'No Existe' : 'Fallo DB';
            if (result.success) {
              logEntry.docId    = result.docId;
              logEntry.ocPdfUrl = result.ocPdfUrl || null;
            }
          } else {
            // ── Fallback: coincidencia por monto ──
            console.log(`⚠️ Sin código COT en "${filename}", intentando por monto...`);
            const amounts = extractAmounts(pdfData.text);
            const amountMatch = await findQuotationByAmount(amounts);

            if (amountMatch) {
              logEntry.foundCode = `${amountMatch.code} (S/ ${amountMatch.matchedAmount.toFixed(2)} ${amountMatch.matchLabel || ''})`;
              console.log(`✅ Coincidencia por monto: ${amountMatch.code} = S/ ${amountMatch.matchedAmount.toFixed(2)} (${amountMatch.matchLabel})`);

              const result = await updateQuotationStatus(amountMatch.code, buffer, filename, io);
              logEntry.status = result.success
                ? 'Asignado (monto)'
                : result.reason === 'Not Found' ? 'No Existe' : 'Fallo DB';
              if (result.success) {
                logEntry.docId    = result.docId;
                logEntry.ocPdfUrl = result.ocPdfUrl || null;
              }
            } else {
              console.log(`❌ Sin coincidencia por código ni monto en: "${filename}"`);
            }
          }
        } catch (pdfErr) {
          console.error(`Error leyendo PDF "${filename}":`, pdfErr.message);
          logEntry.status = 'Error Lectura';
        }

        poLogs.unshift(logEntry);
        if (poLogs.length > 200) poLogs.pop();
        saveLogs();
        if (io) io.emit('po_scanner_log_added', logEntry);
      }

    } catch (error) {
      console.error('[Lector/Inbox] Error:', error.message);
      emitStatus(io, { phase: 'error', currentFile: null, message: `Error inbox: ${error.message}` });
    }
  };

  // ── SCAN SENT: detecta facturas emitidas y cotizaciones enviadas ───────────
  const scanSent = async () => {
    try {
      emitStatus(io, {
        phase: 'scanning', current: 0, total: 0, currentFile: null,
        message: 'Revisando carpeta de enviados...', nextScanAt: null,
      });

      const connection = await Imap.connect(config);

      // Gmail sent folder — intenta nombre estándar, fallback a localizado
      let sentBox = '[Gmail]/Sent Mail';
      try {
        await connection.openBox(sentBox);
      } catch {
        sentBox = '[Gmail]/Enviados';
        await connection.openBox(sentBox);
      }

      const allMessages = await connection.search(['ALL'], {
        bodies: ['HEADER.FIELDS (FROM SUBJECT DATE)'],
        struct: true,
        markSeen: false,
      });

      const unprocessed = allMessages.filter(m => !processedSentUids.has(m.attributes.uid));
      unprocessed.forEach(m => processedSentUids.add(m.attributes.uid));
      if (unprocessed.length > 0) saveCache();
      const withPdf = unprocessed.filter(m => hasPdfInStruct(m.attributes.struct));

      console.log(`[Lector/Sent] ${unprocessed.length} enviados nuevos | ${withPdf.length} con PDFs`);

      // Cola separada por tipo
      const invoiceQueue = [];  // facturas: PDF-DOC-E001-*
      const sentCotQueue = [];  // cotizaciones enviadas: COT-*

      for (let i = 0; i < withPdf.length; i++) {
        const uid = withPdf[i].attributes.uid;
        emitStatus(io, {
          phase: 'scanning',
          message: `Enviados: revisando correo ${i + 1}/${withPdf.length}...`,
        });
        try {
          const results = await connection.search(
            [['UID', String(uid)]],
            { bodies: [''], markSeen: false }
          );
          const item = results?.[0];
          const part = item?.parts?.find(p => p.which === '');
          if (!part?.body) continue;

          const email = await simpleParser('Imap-Id: ' + uid + '\r\n' + part.body);
          for (const att of (email.attachments || [])) {
            const name  = att.filename || '';
            const isPdf = att.contentType === 'application/pdf' || name.toLowerCase().endsWith('.pdf');
            if (!isPdf || !att.content) continue;

            const isInvoice = /^PDF-DOC-E\d{3}-\d+/i.test(name);
            const isCot     = /COT-\d{4}-\d{4,}/i.test(name);

            if (isInvoice) {
              invoiceQueue.push({ uid, filename: name, buffer: att.content });
              console.log(`[Lector/Sent] Factura encontrada: "${name}"`);
            } else if (isCot) {
              sentCotQueue.push({ uid, filename: name, buffer: att.content });
              console.log(`[Lector/Sent] Cotización enviada: "${name}"`);
            }
          }
        } catch (dlErr) {
          console.error(`[Lector/Sent] Error descargando UID ${uid}:`, dlErr.message);
        }
      }

      try { connection.end(); } catch (_) {}

      const totalPdfs = invoiceQueue.length + sentCotQueue.length;
      if (totalPdfs === 0) return;

      emitStatus(io, {
        phase: 'processing',
        total: totalPdfs,
        current: 0,
        message: `Procesando ${invoiceQueue.length} facturas y ${sentCotQueue.length} cotizaciones enviadas...`,
      });

      let processed = 0;

      // ── Procesar facturas ──
      for (const { uid, filename, buffer } of invoiceQueue) {
        processed++;
        emitStatus(io, { current: processed, currentFile: filename, message: `Factura: ${filename}` });

        const logEntry = {
          id: `sent-${uid}-${filename}`,
          date: new Date().toISOString(),
          filename,
          foundCode: null,
          status: 'No Coincide',
          docId: null,
          source: 'factura',
        };

        try {
          const parser  = new PDFParse({ data: buffer });
          const pdfData = await parser.getText();
          const amounts = extractAmounts(pdfData.text);
          const match   = await findInvoiceMatch(amounts);

          if (match) {
            logEntry.foundCode = `${match.code} (S/ ${match.matchedAmount.toFixed(2)})`;
            console.log(`✅ Factura → ${match.code} por S/ ${match.matchedAmount.toFixed(2)}`);
            const result = await markInvoiceCompleted(match.docId, buffer, filename, io);
            logEntry.status = result.success ? 'Factura - Completado' : 'Fallo DB';
            if (result.success) logEntry.docId = match.docId;
          } else {
            console.log(`❌ Sin coincidencia de monto para factura: "${filename}"`);
          }
        } catch (e) {
          console.error(`[Lector/Sent] Error leyendo factura "${filename}":`, e.message);
          logEntry.status = 'Error Lectura';
        }

        poLogs.unshift(logEntry);
        if (poLogs.length > 200) poLogs.pop();
        saveLogs();
        if (io) io.emit('po_scanner_log_added', logEntry);
      }

      // ── Procesar cotizaciones enviadas ──
      for (const { uid, filename, buffer } of sentCotQueue) {
        processed++;
        emitStatus(io, { current: processed, currentFile: filename, message: `Cotización enviada: ${filename}` });

        const logEntry = {
          id: `sent-${uid}-${filename}`,
          date: new Date().toISOString(),
          filename,
          foundCode: null,
          status: 'No Coincide',
          docId: null,
          source: 'enviada',
        };

        try {
          // Extraer código COT del nombre del archivo
          const cotMatch = filename.match(/(COT-\d{4}-\d{4,})/i);
          if (cotMatch?.[1]) {
            const cotCode = cotMatch[1].toUpperCase();
            logEntry.foundCode = cotCode;
            const result = await markQuotationSent(cotCode, io);
            logEntry.status = result.success
              ? 'Enviada'
              : result.reason === 'Not Found' ? 'No Existe' : 'Ya enviada';
            if (result.success) logEntry.docId = result.docId;
            console.log(`✅ Cotización enviada: ${cotCode} → ${logEntry.status}`);
          } else {
            // Intentar extraer COT del contenido del PDF
            const parser  = new PDFParse({ data: buffer });
            const pdfData = await parser.getText();
            const pdfCot  = pdfData.text.match(/(COT-\d{4}-\d{4,})/i);
            if (pdfCot?.[1]) {
              const cotCode = pdfCot[1].toUpperCase();
              logEntry.foundCode = cotCode;
              const result = await markQuotationSent(cotCode, io);
              logEntry.status = result.success ? 'Enviada' : 'No Existe';
              if (result.success) logEntry.docId = result.docId;
            }
          }
        } catch (e) {
          console.error(`[Lector/Sent] Error procesando cotización enviada "${filename}":`, e.message);
          logEntry.status = 'Error Lectura';
        }

        poLogs.unshift(logEntry);
        if (poLogs.length > 200) poLogs.pop();
        saveLogs();
        if (io) io.emit('po_scanner_log_added', logEntry);
      }

    } catch (error) {
      console.error('[Lector/Sent] Error:', error.message);
    }
  };

  console.log(`Iniciando servicio IMAP escuchando en: ${emailUser}`);
  await loadFromFirestore();
  runScanCycle();
  setInterval(runScanCycle, SCAN_INTERVAL_MS);

  if (io) {
    io.on('connection', (socket) => {
      socket.on('request_po_logs', () => {
        socket.emit('po_logs_list', poLogs);
        socket.emit('scan_status', scanStatus);
      });

      socket.on('force_rescan', async () => {
        if (isScanning) {
          socket.emit('scan_status', { ...scanStatus, message: 'Ya hay un escaneo en curso, espera que termine.' });
          return;
        }
        console.log('[Lector] Re-escaneo forzado: limpiando cachés...');
        processedUids.clear();
        processedSentUids.clear();
        await saveCache();
        runScanCycle();
      });

      socket.on('reset_and_rescan', async () => {
        if (isScanning) {
          socket.emit('scan_status', { ...scanStatus, message: 'Ya hay un escaneo en curso, espera que termine.' });
          return;
        }
        try {
          emitStatus(io, { phase: 'connecting', message: 'Revirtiendo estados incorrectos...', nextScanAt: null });

          // Revertir aprobada Y completado — ambos fueron asignados por el scanner
          const [snapAprobada, snapCompletado] = await Promise.all([
            firestore.collection('quotations').where('quotationStatus', '==', 'aprobada').get(),
            firestore.collection('quotations').where('quotationStatus', '==', 'completado').get(),
          ]);

          const batch = firestore.batch();
          const resetIds = [];

          for (const doc of [...snapAprobada.docs, ...snapCompletado.docs]) {
            batch.update(doc.ref, {
              quotationStatus: 'pendiente',
              isSent: admin.firestore.FieldValue.delete(),
              ocPdfUrl: admin.firestore.FieldValue.delete(),
              invoicePdfUrl: admin.firestore.FieldValue.delete(),
              updatedAt: new Date().toISOString(),
            });
            resetIds.push(doc.id);
          }
          await batch.commit();

          console.log(`[Lector] ${resetIds.length} cotizaciones revertidas a "pendiente".`);

          resetIds.forEach(id => {
            io.emit('quotation_updated', {
              id, quotationStatus: 'pendiente',
              isSent: null, ocPdfUrl: null, invoicePdfUrl: null,
            });
          });

          // Limpiar logs y caché
          poLogs.length = 0;
          processedUids.clear();
          processedSentUids.clear();
          await Promise.all([saveLogs(), saveCache()]);
          io.emit('po_logs_list', poLogs);

          emitStatus(io, { message: `${resetIds.length} estados revertidos. Iniciando re-escaneo...` });

          runScanCycle();
        } catch (err) {
          console.error('[Lector] Error en reset_and_rescan:', err.message);
          emitStatus(io, { phase: 'error', message: `Error al revertir: ${err.message}` });
        }
      });
    });
  }
}


// Busca una cotización con quotationStatus === 'aprobada' cuyo totalConIGV
// coincida con el monto máximo de la factura (dentro de S/1.00)
async function findInvoiceMatch({ labeled, general }) {
  if (!firestore || (labeled.length === 0 && general.length === 0)) return null;
  const maxLabeled = labeled.length > 0 ? Math.max(...labeled) : null;
  const maxGeneral = general.length > 0 ? Math.max(...general) : null;
  const amountToMatch = maxLabeled ?? maxGeneral;
  if (!amountToMatch) return null;

  try {
    const snapshot = await firestore.collection('quotations')
      .where('quotationStatus', '==', 'aprobada')
      .get();

    const TOLERANCE = 1.00;
    const candidates = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      // Requiere código Y que el scanner haya subido una OC (ocPdfUrl presente).
      // Sin ocPdfUrl la OC fue marcada manualmente vía dropdown — no es válida
      // para auto-completar con factura, ya que el sistema no la verificó.
      if (!data.code || !data.ocPdfUrl) continue;

      let subtotal = 0;
      if (data.items && data.items.length > 0) {
        subtotal = data.items.reduce((s, item) =>
          s + (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0), 0);
      } else {
        subtotal = data.total || 0;
      }
      subtotal = Math.round(subtotal * 100) / 100;
      const totalConIGV = Math.round(subtotal * 1.18 * 100) / 100;

      // Las facturas siempre muestran el importe CON IGV
      const diff = Math.abs(amountToMatch - totalConIGV);
      if (diff <= TOLERANCE) {
        candidates.push({ code: data.code, docId: doc.id, matchedAmount: amountToMatch, diff });
      }
    }

    if (candidates.length === 0) return null;
    candidates.sort((a, b) => a.diff - b.diff);
    if (candidates.length > 1 && candidates[0].diff === candidates[1].diff) {
      console.log(`⚠️ Coincidencia de factura ambigua: ${candidates.map(c => c.code).join(', ')}`);
      return null;
    }
    return candidates[0];
  } catch (err) {
    console.error('[Lector/Sent] Error buscando factura por monto:', err.message);
    return null;
  }
}

// Marca una cotización como completada y sube el PDF de la factura
async function markInvoiceCompleted(docId, pdfBuffer, pdfFilename, io) {
  if (!firestore) return { success: false };
  try {
    const ocPdfUrl = await uploadOcPdf(pdfBuffer, pdfFilename, `facturas/${docId}`);
    const updateData = {
      quotationStatus: 'completado',
      isSent: true,
      invoicePdfUrl: ocPdfUrl || null,
      updatedAt: new Date().toISOString(),
    };
    await firestore.collection('quotations').doc(docId).update(updateData);
    if (io) io.emit('quotation_updated', { id: docId, ...updateData });
    return { success: true, docId };
  } catch (err) {
    console.error('[Lector/Sent] Error marcando factura completada:', err.message);
    return { success: false };
  }
}

// Marca una cotización como enviada (isSent = true) buscando por código COT
async function markQuotationSent(cotCode, io) {
  if (!firestore) return { success: false };
  try {
    const snapshot = await firestore.collection('quotations')
      .where('code', '==', cotCode).get();

    if (snapshot.empty) return { success: false, reason: 'Not Found' };

    const doc  = snapshot.docs[0];
    const data = doc.data();

    if (data.isSent) return { success: false, reason: 'Already Sent', docId: doc.id };

    await firestore.collection('quotations').doc(doc.id).update({
      isSent: true,
      updatedAt: new Date().toISOString(),
    });
    if (io) io.emit('quotation_updated', { id: doc.id, isSent: true });
    return { success: true, docId: doc.id };
  } catch (err) {
    console.error('[Lector/Sent] Error marcando cotización enviada:', err.message);
    return { success: false };
  }
}

function extractAmounts(text) {
  // Normalizar primero: colapsar espacios múltiples para que "1, 650.00" no se fragmente
  const normalized = text.replace(/(\d),\s+(\d)/g, '$1,$2');

  // Alta confianza: número explícitamente etiquetado como total/monto final
  // Negative lookbehind (?<![,\d]) evita capturar fragmentos de números con miles
  // p.ej. en "1,650.00" no debe extraer "650.00" por separado
  const labeled = new Set();
  const labeledPatterns = [
    /S\/\.?\s*(?<![,\d])([\d]{1,3}(?:,\d{3})*\.\d{2})(?!\d)/gi,
    /PEN\s*(?<![,\d])([\d]{1,3}(?:,\d{3})*\.\d{2})(?!\d)/gi,
    /TOTAL[^:\n]{0,20}[:\s]+(?<![,\d])([\d]{1,3}(?:,\d{3})*\.\d{2})(?!\d)/gi,
    /IMPORTE[^:\n]{0,20}[:\s]+(?<![,\d])([\d]{1,3}(?:,\d{3})*\.\d{2})(?!\d)/gi,
    /VALOR[^:\n]{0,20}[:\s]+(?<![,\d])([\d]{1,3}(?:,\d{3})*\.\d{2})(?!\d)/gi,
    /(?<![,\d])([\d]{1,3}(?:,\d{3})+\.\d{2})(?!\d)/g,
  ];
  for (const re of labeledPatterns) {
    let m;
    while ((m = re.exec(normalized)) !== null) {
      const n = parseFloat(m[1].replace(/,/g, ''));
      if (n > 10 && n < 10_000_000) labeled.add(Math.round(n * 100) / 100);
    }
  }

  // General: cualquier decimal con al menos 2 dígitos enteros.
  // (?<![,\d]) impide capturar fragmentos: en "1,650.00" no captura "650.00"
  // porque "650" está precedido por ","
  const general = new Set();
  const generalRe = /(?<![,\d])(\d{2,}(?:,\d{3})*\.\d{2})(?!\d)/g;
  let m;
  while ((m = generalRe.exec(normalized)) !== null) {
    const n = parseFloat(m[1].replace(/,/g, ''));
    if (n > 10 && n < 10_000_000) general.add(Math.round(n * 100) / 100);
  }

  return { labeled: [...labeled], general: [...general] };
}

async function findQuotationByAmount({ labeled, general }) {
  if (!firestore || (labeled.length === 0 && general.length === 0)) return null;

  // Para montos generales (tabla) solo usamos el MÁXIMO — el total siempre es
  // el número más grande del documento. Subtotales de línea quedan excluidos.
  const maxGeneral = general.length > 0 ? Math.max(...general) : null;

  try {
    const snapshot = await firestore.collection('quotations').get();

    // Solo tolerancia absoluta: sin porcentaje.
    // Las OC son documentos formales — los montos deben coincidir al centavo
    // (diferencia máxima S/1.00 para absorber redondeos de IGV por línea).
    // Eliminar tolerancia porcentual evita falsos positivos como S/841 ≈ S/849.
    const TOLERANCE_LABELED = 1.00;  // labeled (S/, TOTAL, etc.): hasta S/1.00
    const TOLERANCE_GENERAL = 0.50;  // general (máximo del doc): hasta S/0.50

    const candidates = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (!data.code || data.quotationStatus === 'aprobada') continue;

      // subtotal = suma de items (SIN IGV) — igual a lo que guarda el PUT en `total`
      // totalConIGV = subtotal × 1.18 — lo que muestra el dashboard
      let subtotal = 0;
      if (data.items && data.items.length > 0) {
        subtotal = data.items.reduce((s, item) =>
          s + (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0), 0);
      } else {
        subtotal = data.total || 0;
      }
      subtotal = Math.round(subtotal * 100) / 100;
      const totalConIGV = Math.round(subtotal * 1.18 * 100) / 100;

      if (subtotal <= 0) continue;

      // El total de una OC es siempre el número más grande del documento.
      // Usar cualquier monto menor (subtotal de línea, base imponible, fragmento)
      // causa falsos positivos. Tomamos solo el máximo en ambos casos.
      const maxLabeled = labeled.length > 0 ? Math.max(...labeled) : null;
      const amountsToTry = maxLabeled !== null
        ? [{ amount: maxLabeled, tolAbs: TOLERANCE_LABELED }]
        : (maxGeneral !== null ? [{ amount: maxGeneral, tolAbs: TOLERANCE_GENERAL }] : []);

      for (const { amount, tolAbs } of amountsToTry) {
        const diffConIGV = Math.abs(amount - totalConIGV);
        const diffSinIGV = Math.abs(amount - subtotal);
        const diff       = Math.min(diffConIGV, diffSinIGV);

        if (diff <= tolAbs) {
          const matchLabel = diffConIGV <= diffSinIGV ? 'con IGV' : 'sin IGV';
          candidates.push({ code: data.code, docId: doc.id, subtotal, totalConIGV, matchedAmount: amount, diff, matchLabel });
        }
      }
    }

    if (candidates.length === 0) return null;

    // Ordenar por mejor coincidencia (menor diferencia)
    candidates.sort((a, b) => a.diff - b.diff);

    // Si hay varias con la misma diferencia, es ambiguo — no asignar
    if (candidates.length > 1 && candidates[0].diff === candidates[1].diff) {
      console.log(`⚠️ Coincidencia ambigua por monto: ${candidates.map(c => c.code).join(', ')}`);
      return null;
    }

    return candidates[0];
  } catch (err) {
    console.error('[Lector] Error buscando por monto:', err.message);
    return null;
  }
}

async function uploadOcPdf(buffer, filename, docId) {
  if (!storage) return null;
  try {
    const bucket   = storage.bucket();
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `oc-pdfs/${docId}/${safeName}`;
    const file     = bucket.file(filePath);
    await file.save(buffer, { metadata: { contentType: 'application/pdf' } });
    await file.makePublic();
    const url = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    console.log(`[Storage] OC subida: ${url}`);
    return url;
  } catch (err) {
    console.error('[Storage] Error subiendo OC PDF:', err.message);
    return null;
  }
}

async function updateQuotationStatus(quotationId, pdfBuffer, pdfFilename, io) {
  if (!firestore) {
    console.error('Firebase Admin no está inicializado.');
    return { success: false };
  }

  try {
    const quotesRef = firestore.collection('quotations');
    const snapshot  = await quotesRef.where('code', '==', quotationId).get();

    if (snapshot.empty) {
      console.log(`Cotización "${quotationId}" no existe en Firestore.`);
      return { success: false, reason: 'Not Found' };
    }

    const docId            = snapshot.docs[0].id;
    const currentStatus    = snapshot.docs[0].data().quotationStatus;

    // Subir el PDF de la OC a Firebase Storage
    const ocPdfUrl = await uploadOcPdf(pdfBuffer, pdfFilename, docId);

    if (currentStatus !== 'aprobada') {
      const updateData = {
        quotationStatus: 'aprobada',
        updatedAt: new Date().toISOString(),
      };
      if (ocPdfUrl) updateData.ocPdfUrl = ocPdfUrl;

      await quotesRef.doc(docId).update(updateData);

      if (io) {
        io.emit('quotation_updated', {
          id: docId,
          quotationStatus: 'aprobada',
          ocPdfUrl: ocPdfUrl || undefined,
          updatedAt: new Date().toISOString(),
        });
      }
    } else if (ocPdfUrl) {
      // Ya era aprobada pero subimos igual el PDF
      await quotesRef.doc(docId).update({ ocPdfUrl, updatedAt: new Date().toISOString() });
      if (io) io.emit('quotation_updated', { id: docId, ocPdfUrl, updatedAt: new Date().toISOString() });
    }

    return { success: true, docId, ocPdfUrl };
  } catch (error) {
    console.error('Error actualizando Firestore:', error.message);
    return { success: false, error: error.message };
  }
}
