import Imap from 'imap-simple';
import { simpleParser } from 'mailparser';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');
import { firestore, storage, admin } from './firebase-admin.js';

// ── Persistencia en Firestore (compatible con entornos sin sistema de archivos) ──
const STATE_COL  = 'scanner_state';
const CACHE_DOC  = 'cache';
const LOGS_DOC   = 'logs';
const LEADS_COL  = 'quote_leads';

// ── Detección de solicitudes de cotización ────────────────────────────────
const QUOTE_KEYWORDS = [
  /solicitud\s+de\s+cotizaci[oó]n/i,
  /solicitud\s+de\s+presupuesto/i,
  /solicitud\s+de\s+precio/i,
  /solicitar\s+cotizaci[oó]n/i,
  /cotizaci[oó]n\s+de\b/i,
  /pedir\s+cotizaci[oó]n/i,
  /quisiera\s+cotizar/i,
  /me\s+pueden\s+cotizar/i,
  /pueden\s+cotizarme/i,
  /solicito\s+cotizaci[oó]n/i,
  /necesito\s+cotizaci[oó]n/i,
  /requiero\s+cotizaci[oó]n/i,
  /\brequest\s+for\s+quot(e|ation)\b/i,
  /\brfq\b/i,
  /presupuesto\s+para\b/i,
  /\bproforma\b/i,
  /invitaci[oó]n\s+(de\s+)?(compra|licitaci[oó]n|concurso)/i,
];

function isLikelyQuoteRequest(subject) {
  return QUOTE_KEYWORDS.some(re => re.test(subject));
}

async function saveQuoteLead(uid, subject, fromRaw, dateRaw, io) {
  if (!firestore) return;
  try {
    const docId = `inbox-${uid}`;
    const ref   = firestore.collection('tenants').doc('6').collection('cgo_quote_leads').doc(docId);
    const snap  = await ref.get();
    if (snap.exists) return; // ya guardado en ciclo anterior

    const lead = {
      emailUid:   String(uid),
      subject:    subject || '(sin asunto)',
      from:       fromRaw || '',
      receivedAt: dateRaw || new Date().toISOString(),
      status:     'pending',
      createdAt:  new Date().toISOString(),
    };
    await ref.set(lead);
    console.log(`[Lector] 📩 Solicitud de cotización detectada: "${subject}" de ${fromRaw}`);
    if (io) io.emit('quote_lead_detected', { id: docId, ...lead });
  } catch (e) {
    console.warn('[Lector] Error guardando lead:', e.message);
  }
}

export const poLogs         = [];
const processedUids         = new Set();
const processedSentUids     = new Set();
const quoteLeadCheckedUids  = new Set();

async function loadFromFirestore() {
  if (!firestore) return;
  try {
    const [cacheSnap, logsSnap] = await Promise.all([
      firestore.collection(STATE_COL).doc(CACHE_DOC).get(),
      firestore.collection(STATE_COL).doc(LOGS_DOC).get(),
    ]);
    if (cacheSnap.exists) {
      const d = cacheSnap.data();
      
      // Limpiar memoria caché local antes de sincronizar con DB
      // Esto es crucial porque Cloud Functions re-usa el estado global en RAM
      processedUids.clear();
      processedSentUids.clear();
      quoteLeadCheckedUids.clear();

      (d.inboxUids       || []).forEach(u => processedUids.add(u));
      (d.sentUids        || []).forEach(u => processedSentUids.add(u));
      (d.quoteLeadUids   || []).forEach(u => quoteLeadCheckedUids.add(u));
    }
    if (logsSnap.exists) {
      poLogs.length = 0; // Vaciar array global
      const entries = logsSnap.data().entries || [];
      const seen = new Set();
      for (const entry of entries) {
        if (entry.id && !seen.has(entry.id)) {
          seen.add(entry.id);
          poLogs.push(entry);
        }
      }
    }
    console.log(`[Lector] Firestore (Sincronizado): ${processedUids.size} inbox | ${processedSentUids.size} sent | ${poLogs.length} logs`);
  } catch (e) {
    console.warn('[Lector] Error cargando estado desde Firestore:', e.message);
  }
}

async function saveCache() {
  if (!firestore) return;
  try {
    await firestore.collection(STATE_COL).doc(CACHE_DOC).set({
      inboxUids:     [...processedUids],
      sentUids:      [...processedSentUids],
      quoteLeadUids: [...quoteLeadCheckedUids],
      updatedAt:     new Date().toISOString(),
    });
  } catch (e) {
    console.warn('[Lector] Error guardando caché:', e.message);
  }
}

function addLog(entry, io) {
  const idx = poLogs.findIndex(l => l.id === entry.id);
  if (idx !== -1) poLogs.splice(idx, 1);
  poLogs.unshift(entry);
  if (poLogs.length > 200) poLogs.pop();
  saveLogs();
  if (io) io.emit('po_scanner_log_added', entry);
}

async function saveLogs() {
  if (!firestore) return;
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
  if (typeof firestore !== 'undefined' && firestore) {
    firestore.collection('scanner_state').doc('status').set({
      ...scanStatus,
      updatedAt: new Date().toISOString()
    }).catch(e => console.warn('[Lector] Error guardando status:', e.message));
  }
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
      scheduleNext(); // Esto actualiza la UI a estado "idle" y muestra la cuenta regresiva
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

      // ── Fase 2b: detectar solicitudes de cotización por asunto ──────────
      // Corre sobre TODOS los correos (incluye ya leídos / ciclos anteriores)
      // usando un set independiente de processedUids para no interferir con OC.
      const uncheckedForLeads = allMessages.filter(m => !quoteLeadCheckedUids.has(m.attributes.uid));
      uncheckedForLeads.forEach(m => quoteLeadCheckedUids.add(m.attributes.uid));
      if (uncheckedForLeads.length > 0) saveCache();

      // Construir set de UIDs respondidos para filtrar leads
      const answeredUids = new Set(
        allMessages
          .filter(m => (m.attributes.flags || []).includes('\\Answered'))
          .map(m => String(m.attributes.uid))
      );

      // Auto-descartar leads pendientes cuyo correo ya fue respondido
      if (answeredUids.size > 0) {
        try {
          const pendingSnap = await firestore.collection('tenants').doc('6').collection('cgo_quote_leads')
            .where('status', '==', 'pending').get();
          for (const doc of pendingSnap.docs) {
            if (answeredUids.has(String(doc.data().emailUid))) {
              await doc.ref.update({ status: 'dismissed', dismissedReason: 'replied', updatedAt: new Date().toISOString() });
              console.log(`[Lector] Lead auto-descartado (correo respondido): ${doc.id}`);
              if (io) io.emit('quote_lead_dismissed', { id: doc.id });
            }
          }
        } catch (e) {
          console.warn('[Lector] Error auto-descartando leads respondidos:', e.message);
        }
      }

      console.log(`[Lector] Revisando ${uncheckedForLeads.length} correos para detección de leads de cotización`);
      for (const m of uncheckedForLeads) {
        // Saltar si el correo ya fue respondido
        if (answeredUids.has(String(m.attributes.uid))) continue;
        const headerPart = m.parts?.find(p => String(p.which || '').includes('HEADER'));
        const subject = (headerPart?.body?.subject?.[0] || '').trim();
        if (isLikelyQuoteRequest(subject)) {
          const fromRaw = (headerPart?.body?.from?.[0] || '').trim();
          const dateRaw = (headerPart?.body?.date?.[0] || '').trim();
          await saveQuoteLead(m.attributes.uid, subject, fromRaw, dateRaw, io);
        }
      }

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
          const match   = pdfData.text.match(/(COT-\d{4}-\d+)/i);

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

        addLog(logEntry, io);
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

      // Detectar carpeta de enviados — listar buzones disponibles y buscar coincidencia
      let sentBox = null;
      try {
        const boxes = await connection.getBoxes();
        const gmail = boxes['[Gmail]'] || boxes['[Google Mail]'];
        const gmailPrefix = boxes['[Gmail]'] ? '[Gmail]' : '[Google Mail]';
        if (gmail?.children) {
          const children = Object.keys(gmail.children);
          console.log(`[Lector/Sent] Buzones Gmail disponibles: ${children.map(c => `${gmailPrefix}/${c}`).join(', ')}`);
          const sentChild = children.find(c =>
            /sent|enviados|enviad/i.test(c)
          );
          if (sentChild) sentBox = `${gmailPrefix}/${sentChild}`;
        }
        // Fallback: intenta nombres directos si no encontró en árbol
        if (!sentBox) {
          const topKeys = Object.keys(boxes);
          console.log(`[Lector/Sent] Buzones raíz: ${topKeys.join(', ')}`);
        }
      } catch (listErr) {
        console.warn('[Lector/Sent] No pudo listar buzones:', listErr.message);
      }

      // Si no encontró por detección, intenta candidatos comunes
      const sentCandidates = sentBox
        ? [sentBox]
        : ['[Gmail]/Sent Mail', '[Gmail]/Enviados', '[Google Mail]/Sent Mail', '[Google Mail]/Enviados', 'Sent', 'Sent Items'];

      let opened = false;
      for (const candidate of sentCandidates) {
        try {
          await connection.openBox(candidate);
          sentBox = candidate;
          opened = true;
          console.log(`[Lector/Sent] Carpeta enviados abierta: "${candidate}"`);
          break;
        } catch {
          console.log(`[Lector/Sent] No encontrada: "${candidate}"`);
        }
      }

      if (!opened) {
        console.error('[Lector/Sent] No se pudo abrir ninguna carpeta de enviados.');
        try { connection.end(); } catch (_) {}
        return;
      }

      const allMessages = await connection.search(['ALL'], {
        bodies: ['HEADER.FIELDS (FROM SUBJECT DATE)'],
        struct: true,
        markSeen: false,
      });

      const unprocessed = allMessages.filter(m => !processedSentUids.has(m.attributes.uid));
      console.log(`[Lector/Sent] Total en carpeta: ${allMessages.length} | Ya procesados: ${allMessages.length - unprocessed.length} | Nuevos: ${unprocessed.length}`);
      unprocessed.forEach(m => processedSentUids.add(m.attributes.uid));
      if (unprocessed.length > 0) saveCache();
      const withPdf = unprocessed.filter(m => hasPdfInStruct(m.attributes.struct));
      const sinPdf  = unprocessed.filter(m => !hasPdfInStruct(m.attributes.struct));

      console.log(`[Lector/Sent] ${unprocessed.length} enviados nuevos | ${withPdf.length} con PDFs | ${sinPdf.length} sin PDFs detectados`);
      if (sinPdf.length > 0 && sinPdf.length <= 5) {
        for (const m of sinPdf) {
          console.log(`[Lector/Sent] Sin PDF struct — UID ${m.attributes.uid}: ${JSON.stringify(m.attributes.struct)?.slice(0, 200)}`);
        }
      }

      // Cola separada por tipo
      const invoiceQueue    = [];  // facturas: PDF-DOC-E001-* o contenido con FACTURA
      const sentCotQueue    = [];  // cotizaciones enviadas: COT-*
      const unknownPdfQueue = [];  // PDFs sin patrón de nombre conocido → clasificar por contenido

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
          const allAtts = email.attachments || [];
          console.log(`[Lector/Sent] UID ${uid}: ${allAtts.length} adjuntos encontrados por mailparser`);
          for (const att of allAtts) {
            const name  = att.filename || '';
            const isPdf = att.contentType === 'application/pdf' || name.toLowerCase().endsWith('.pdf');
            console.log(`[Lector/Sent]   adjunto: "${name}" | contentType: ${att.contentType} | size: ${att.content?.length ?? 0} | isPdf: ${isPdf}`);
            if (!isPdf || !att.content) continue;

            // Formato 1: PDF-DOC-E001-XXXXXXXXX
            // Formato 2: {RUC}-01-{serie}-{num} — factura electrónica SUNAT tipo 01
            //   Permite variaciones: RUC de 8-11 dígitos, serie con 1-2 letras, num variable
            const nameClean = name.replace(/[‐-―−]/g, '-'); // normalizar guiones unicode
            const isInvoice = /^PDF-DOC-E\d{3}-\d+/i.test(nameClean)
                           || /^\d{8,11}-01-[A-Z]{1,2}\d{1,4}-\d+/i.test(nameClean);
            console.log(`[Lector/Sent]   isInvoice=${isInvoice} isCot=${/COT-\d{4}-\d+/i.test(nameClean)} para "${name}"`);
            const isCot     = /COT-\d{4}-\d+/i.test(name);

            if (isInvoice) {
              invoiceQueue.push({ uid, filename: name, buffer: att.content });
              console.log(`[Lector/Sent] Factura encontrada: "${name}"`);
            } else if (isCot) {
              sentCotQueue.push({ uid, filename: name, buffer: att.content });
              console.log(`[Lector/Sent] Cotización enviada: "${name}"`);
            } else {
              unknownPdfQueue.push({ uid, filename: name, buffer: att.content });
              console.log(`[Lector/Sent] PDF sin patrón de nombre, se leerá contenido: "${name}"`);
            }
          }
        } catch (dlErr) {
          console.error(`[Lector/Sent] Error descargando UID ${uid}:`, dlErr.message);
        }
      }

      try { connection.end(); } catch (_) {}

      // Clasificar PDFs de nombre desconocido leyendo su contenido
      if (unknownPdfQueue.length > 0) {
        console.log(`[Lector/Sent] Clasificando ${unknownPdfQueue.length} PDFs por contenido...`);
        for (const item of unknownPdfQueue) {
          try {
            const parser  = new PDFParse({ data: item.buffer });
            const pdfData = await parser.getText();
            const text    = pdfData.text || '';
            const cotMatch = text.match(/(COT-\d{4}-\d+)/i);
            if (/FACTURA/i.test(text)) {
              invoiceQueue.push(item);
              console.log(`[Lector/Sent] "${item.filename}" → FACTURA (por contenido)`);
            } else if (cotMatch) {
              sentCotQueue.push(item);
              console.log(`[Lector/Sent] "${item.filename}" → COT ${cotMatch[1]} (por contenido)`);
            } else {
              console.log(`[Lector/Sent] "${item.filename}" → no reconocido (sin FACTURA ni COT en contenido)`);
            }
          } catch (e) {
            console.warn(`[Lector/Sent] No pudo leer contenido de "${item.filename}":`, e.message);
          }
        }
      }

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

        // Subir PDF siempre para permitir re-procesar OCR desde la UI
        try {
          const tempUrl = await uploadOcPdf(buffer, filename, `temp/${logEntry.id}`);
          if (tempUrl) logEntry.tempPdfUrl = tempUrl;
        } catch (_) {}

        try {
          const parser  = new PDFParse({ data: buffer });
          const pdfData = await parser.getText();
          let text      = pdfData.text || '';
          let amounts   = extractAmounts(text);
          let hasAmounts = amounts.labeled.length > 0 || amounts.general.length > 0;

          if (!hasAmounts) {
            console.log(`[pdfjs] "${filename}" sin montos en pdf-parse, intentando pdfjs...`);
            text = await extractTextPdfjs(buffer);
            amounts = extractAmounts(text);
            hasAmounts = amounts.labeled.length > 0 || amounts.general.length > 0;
          }

          if (!hasAmounts) {
            console.log(`[OCR] "${filename}" sin montos en pdfjs, intentando OCR...`);
            emitStatus(io, { currentFile: filename, message: `OCR: ${filename}` });
            text      = await extractTextWithOCR(buffer);
            amounts   = extractAmounts(text);
            hasAmounts = amounts.labeled.length > 0 || amounts.general.length > 0;
          }

          if (!hasAmounts) {
            console.log(`⚠️ Factura "${filename}": sin montos legibles ni con OCR.`);
            logEntry.status = 'Sin monto legible';
          } else {
            const match = await findInvoiceMatch(amounts);
            if (match) {
              logEntry.foundCode = `${match.code} (S/ ${match.matchedAmount.toFixed(2)})`;
              console.log(`✅ Factura → ${match.code} por S/ ${match.matchedAmount.toFixed(2)}`);
              const result = await markInvoiceCompleted(match.docId, buffer, filename, io);
              logEntry.status = result.success ? 'Factura - Completado' : 'Fallo DB';
              if (result.success) logEntry.docId = match.docId;
            } else {
              console.log(`❌ Sin coincidencia de monto para factura: "${filename}"`);
            }
          }
        } catch (e) {
          console.error(`[Lector/Sent] Error leyendo factura "${filename}":`, e.message);
          logEntry.status = 'Error Lectura';
        }

        addLog(logEntry, io);
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
          const cotMatch = filename.match(/(COT-\d{4}-\d+)/i);
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
            const pdfCot  = pdfData.text.match(/(COT-\d{4}-\d+)/i);
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

        addLog(logEntry, io);
      }

    } catch (error) {
      console.error('[Lector/Sent] Error:', error.message);
    }
  };

  console.log(`Iniciando servicio IMAP (Cloud Function) para: ${emailUser}`);
  await loadFromFirestore();
  await runScanCycle();

  if (io) {
    io.on('connection', (socket) => {
      socket.on('request_po_logs', () => {
        socket.emit('po_logs_list', poLogs);
        socket.emit('scan_status', scanStatus);
      });

      socket.on('reassign_invoice', async ({ logId, oldDocId, newDocId }) => {
        if (!firestore || !oldDocId || !newDocId || oldDocId === newDocId) return;
        try {
          const [oldSnap, newSnap] = await Promise.all([
            firestore.collection('tenants').doc('6').collection('cgo_quotations').doc(oldDocId).get(),
            firestore.collection('tenants').doc('6').collection('cgo_quotations').doc(newDocId).get(),
          ]);
          if (!oldSnap.exists || !newSnap.exists) return;

          const invoicePdfUrl = oldSnap.data().invoicePdfUrl || null;
          const now = new Date().toISOString();

          const batch = firestore.batch();
          // Revertir cotización anterior a aprobada
          batch.update(oldSnap.ref, {
            quotationStatus: 'aprobada',
            invoicePdfUrl: admin.firestore.FieldValue.delete(),
            updatedAt: now,
          });
          // Asignar factura a la nueva cotización
          batch.update(newSnap.ref, {
            quotationStatus: 'completado',
            isSent: true,
            invoicePdfUrl: invoicePdfUrl || admin.firestore.FieldValue.delete(),
            updatedAt: now,
          });
          await batch.commit();

          io.emit('quotation_updated', { id: oldDocId, quotationStatus: 'aprobada', invoicePdfUrl: null, updatedAt: now });
          io.emit('quotation_updated', { id: newDocId, quotationStatus: 'completado', isSent: true, invoicePdfUrl, updatedAt: now });

          // Actualizar log en memoria
          const logIdx = poLogs.findIndex(l => l.id === logId);
          if (logIdx !== -1) {
            poLogs[logIdx] = { ...poLogs[logIdx], docId: newDocId, foundCode: newSnap.data().code || poLogs[logIdx].foundCode };
            saveLogs();
          }
          console.log(`[Lector] Factura reasignada: ${oldDocId} → ${newDocId}`);
        } catch (err) {
          console.error('[Lector] Error reasignando factura:', err.message);
        }
      });

      socket.on('force_rescan', async () => {
        if (isScanning) {
          socket.emit('scan_status', { ...scanStatus, message: 'Ya hay un escaneo en curso, espera que termine.' });
          return;
        }
        console.log('[Lector] Re-escaneo forzado: limpiando cachés...');
        processedUids.clear();
        processedSentUids.clear();
        quoteLeadCheckedUids.clear();
        await saveCache();
        runScanCycle();
      });

      // Re-escanea solo la carpeta de enviados sin tocar inbox ni revertir estados
      socket.on('rescan_sent', async () => {
        if (isScanning) {
          socket.emit('scan_status', { ...scanStatus, message: 'Ya hay un escaneo en curso, espera que termine.' });
          return;
        }
        console.log('[Lector] Re-escaneo de enviados: limpiando caché de enviados...');
        processedSentUids.clear();
        await saveCache();
        isScanning = true;
        try {
          await scanSent();
        } finally {
          isScanning = false;
          scheduleNext();
        }
      });

      // Re-procesa una factura específica por su logId usando el PDF ya subido a Storage
      socket.on('reprocess_invoice_ocr', async ({ logId }) => {
        const logEntry = poLogs.find(l => l.id === logId);
        if (!logEntry) return;
        console.log(`[OCR-Manual] Re-procesando "${logEntry.filename}"...`);
        emitStatus(io, { phase: 'processing', message: `Re-procesando: ${logEntry.filename}`, currentFile: logEntry.filename });
        try {
          let buffer;
          if (logEntry.tempPdfUrl) {
            const res = await fetch(logEntry.tempPdfUrl);
            buffer = Buffer.from(await res.arrayBuffer());
          } else {
            // Sin URL en Storage: re-obtener directamente desde IMAP usando el UID del logId
            const uidMatch = logEntry.id.match(/^sent-(\d+)-/);
            if (!uidMatch) throw new Error('No se pudo extraer UID del log');
            const uid = uidMatch[1];
            console.log(`[OCR-Manual] Descargando UID ${uid} desde IMAP...`);
            emitStatus(io, { message: `Descargando desde IMAP: ${logEntry.filename}` });
            buffer = await fetchSentPdfByUid(uid, logEntry.filename, config);
            // Subir a Storage para futuros re-procesos
            const url = await uploadOcPdf(buffer, logEntry.filename, `temp/${logEntry.id}`);
            if (url) logEntry.tempPdfUrl = url;
          }

          const debugLines = [];

          // ── Etapa 1: pdf-parse ──
          const parser  = new PDFParse({ data: buffer });
          const pdfData = await parser.getText();
          let text      = pdfData.text || '';
          let amounts   = extractAmounts(text);
          let hasAmounts = amounts.labeled.length > 0 || amounts.general.length > 0;
          const snippet1 = text.replace(/\s+/g, ' ').trim().slice(0, 400);
          debugLines.push(`[pdf-parse] ${text.length} chars | labeled: [${amounts.labeled.join(', ')}] | general: [${amounts.general.join(', ')}]`);
          debugLines.push(`  Texto: ${snippet1 || '(vacío)'}`);
          console.log(debugLines[0]);
          console.log(debugLines[1]);

          // ── Etapa 2: pdfjs ──
          if (!hasAmounts) {
            console.log(`[OCR-Manual/pdfjs] "${logEntry.filename}" intentando pdfjs...`);
            text = await extractTextPdfjs(buffer);
            amounts = extractAmounts(text);
            hasAmounts = amounts.labeled.length > 0 || amounts.general.length > 0;
            const snippet2 = text.replace(/\s+/g, ' ').trim().slice(0, 400);
            debugLines.push(`[pdfjs] ${text.length} chars | labeled: [${amounts.labeled.join(', ')}] | general: [${amounts.general.join(', ')}]`);
            debugLines.push(`  Texto: ${snippet2 || '(vacío)'}`);
            console.log(debugLines[debugLines.length - 2]);
            console.log(debugLines[debugLines.length - 1]);
          }

          // ── Etapa 3: OCR ──
          if (!hasAmounts) {
            console.log(`[OCR-Manual/ocr] "${logEntry.filename}" intentando OCR...`);
            emitStatus(io, { currentFile: logEntry.filename, message: `OCR manual: ${logEntry.filename}` });
            try {
              text = await extractTextWithOCR(buffer);
              amounts = extractAmounts(text);
              hasAmounts = amounts.labeled.length > 0 || amounts.general.length > 0;
              const snippet3 = text.replace(/\s+/g, ' ').trim().slice(0, 400);
              debugLines.push(`[OCR] ${text.length} chars | labeled: [${amounts.labeled.join(', ')}] | general: [${amounts.general.join(', ')}]`);
              debugLines.push(`  Texto: ${snippet3 || '(vacío)'}`);
            } catch (ocrErr) {
              debugLines.push(`[OCR] ❌ ERROR: ${ocrErr.message}`);
              console.error('[OCR-Manual] Error en OCR:', ocrErr.message);
            }
            console.log(debugLines[debugLines.length - 2]);
            console.log(debugLines[debugLines.length - 1]);
          }

          // Guardar resumen para mostrarlo en la UI
          logEntry.debugText = debugLines.join('\n');

          if (!hasAmounts) {
            logEntry.status = 'Sin monto legible';
            console.log(`[OCR-Manual] "${logEntry.filename}": sin montos en ninguna etapa.`);
          } else {
            const match = await findInvoiceMatch(amounts);
            if (match) {
              logEntry.foundCode = `${match.code} (S/ ${match.matchedAmount.toFixed(2)})`;
              console.log(`[OCR-Manual] ✅ Factura → ${match.code} por S/ ${match.matchedAmount.toFixed(2)}`);
              const result = await markInvoiceCompleted(match.docId, buffer, logEntry.filename, io);
              logEntry.status = result.success ? 'Factura - Completado' : 'Fallo DB';
              if (result.success) logEntry.docId = match.docId;
            } else {
              logEntry.status = 'No Coincide';
              logEntry.foundCode = `Montos: ${[...amounts.labeled, ...amounts.general].map(a => `S/${a}`).join(', ')}`;
              console.log(`[OCR-Manual] ❌ Sin coincidencia. Montos detectados: labeled=[${amounts.labeled.join(', ')}] general=[${amounts.general.join(', ')}]`);
            }
          }
        } catch (err) {
          console.error(`[OCR-Manual] Error re-procesando "${logEntry.filename}":`, err.message);
          logEntry.status = 'Error Lectura';
          logEntry.debugText = `Error: ${err.message}`;
        }
        addLog(logEntry, io);
        socket.emit('reprocess_ocr_result', {
          logId: logEntry.id,
          status: logEntry.status,
          foundCode: logEntry.foundCode,
          docId: logEntry.docId || null,
        });
        emitStatus(io, { phase: 'idle', message: 'Re-proceso completado', currentFile: null });
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
            firestore.collection('tenants').doc('6').collection('cgo_quotations').where('quotationStatus', '==', 'aprobada').get(),
            firestore.collection('tenants').doc('6').collection('cgo_quotations').where('quotationStatus', '==', 'completado').get(),
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
          quoteLeadCheckedUids.clear();
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
    const snapshot = await firestore.collection('tenants').doc('6').collection('cgo_quotations')
      .where('quotationStatus', '==', 'aprobada')
      .get();

    const TOLERANCE = 1.00;
    const candidates = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      // Requiere código. Una OC puede ser marcada manualmente sin subir PDF.
      if (!data.code) continue;

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
    await firestore.collection('tenants').doc('6').collection('cgo_quotations').doc(docId).update(updateData);
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
    const snapshot = await firestore.collection('tenants').doc('6').collection('cgo_quotations')
      .where('code', '==', cotCode).get();

    if (snapshot.empty) return { success: false, reason: 'Not Found' };

    const doc  = snapshot.docs[0];
    const data = doc.data();

    if (data.isSent) return { success: false, reason: 'Already Sent', docId: doc.id };

    await firestore.collection('tenants').doc('6').collection('cgo_quotations').doc(doc.id).update({
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
  // ── Normalización ──────────────────────────────────────────────────────────
  let normalized = text
    .replace(/(\d),\s+(\d)/g, '$1,$2')          // "1, 650" → "1,650"
    .replace(/(\d)\s+\.(\d{2})(?!\d)/g, '$1.$2') // "650 .18" → "650.18" (PDF fragmentado)
    .replace(/(\d)\.\s+(\d{2})(?!\d)/g, '$1.$2') // "650. 18" → "650.18"
    .replace(/S\s*\/\s*\.\s*/g, 'S/. ')           // "S / ." → "S/. "
    .replace(/S\s*\/(?!\.)/g, 'S/ ');             // "S/" → "S/ " (asegura espacio)

  // ── Alta confianza: etiquetas conocidas de facturas SUNAT ─────────────────
  const labeled = new Set();
  const labeledPatterns = [
    // S/ o S/. seguido del monto (formato SUNAT estándar)
    /S\s*[/.]\s*\.?\s*(?<![,\d])([\d]{1,3}(?:,\d{3})*\.\d{2})(?!\d)/gi,
    // PEN
    /PEN\s+(?<![,\d])([\d]{1,3}(?:,\d{3})*\.\d{2})(?!\d)/gi,
    // Importe Total (etiqueta específica SUNAT — siempre el total final)
    /Importe\s+Total[^:\n]{0,10}[:\s]+(?:S\s*[/.]\s*\.?\s*)?([\d]{1,3}(?:,\d{3})*\.\d{2})(?!\d)/gi,
    // TOTAL genérico
    /TOTAL[^:\n]{0,20}[:\s]+(?:S\s*[/.]\s*\.?\s*)?([\d]{1,3}(?:,\d{3})*\.\d{2})(?!\d)/gi,
    // IMPORTE — ahora acepta "S/ " entre el colon y el número
    /IMPORTE[^:\n]{0,20}[:\s]+(?:S\s*[/.]\s*\.?\s*)?([\d]{1,3}(?:,\d{3})*\.\d{2})(?!\d)/gi,
    // VALOR VENTA / VALOR TOTAL
    /VALOR[^:\n]{0,20}[:\s]+(?:S\s*[/.]\s*\.?\s*)?([\d]{1,3}(?:,\d{3})*\.\d{2})(?!\d)/gi,
    // Número después de ":" que va precedido por S/ (cualquier etiqueta con colon)
    /:[:\s]*S\s*[/.]\s*\.?\s*([\d]{1,3}(?:,\d{3})*\.\d{2})(?!\d)/gi,
    // Número con miles (siempre es un monto significativo)
    /(?<![,\d])([\d]{1,3}(?:,\d{3})+\.\d{2})(?!\d)/g,
  ];

  for (const re of labeledPatterns) {
    let m;
    while ((m = re.exec(normalized)) !== null) {
      const n = parseFloat(m[1].replace(/,/g, ''));
      if (n > 10 && n < 10_000_000) labeled.add(Math.round(n * 100) / 100);
    }
  }

  // ── General: cualquier decimal no precedido por coma/dígito ───────────────
  const general = new Set();
  const generalRe = /(?<![,\d\/])(\d{2,}(?:,\d{3})*\.\d{2})(?!\d)/g;
  let m;
  while ((m = generalRe.exec(normalized)) !== null) {
    const n = parseFloat(m[1].replace(/,/g, ''));
    if (n > 10 && n < 10_000_000) general.add(Math.round(n * 100) / 100);
  }

  console.log(`[extractAmounts] labeled: [${[...labeled].join(', ')}] | general: [${[...general].join(', ')}]`);
  return { labeled: [...labeled], general: [...general] };
}

async function findQuotationByAmount({ labeled, general }) {
  if (!firestore || (labeled.length === 0 && general.length === 0)) return null;

  // Para montos generales (tabla) solo usamos el MÁXIMO — el total siempre es
  // el número más grande del documento. Subtotales de línea quedan excluidos.
  const maxGeneral = general.length > 0 ? Math.max(...general) : null;

  try {
    const snapshot = await firestore.collection('tenants').doc('6').collection('cgo_quotations').get();

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

// Obtiene el buffer de un PDF adjunto desde la carpeta de enviados por UID + nombre de archivo
async function fetchSentPdfByUid(uid, filename, config) {
  let connection;
  try {
    connection = await Imap.connect(config);

    // Detectar carpeta de enviados
    const boxes = await connection.getBoxes().catch(() => ({}));
    const gmail = boxes['[Gmail]'] || boxes['[Google Mail]'];
    const gmailPrefix = boxes['[Gmail]'] ? '[Gmail]' : '[Google Mail]';
    let sentBox = null;
    if (gmail?.children) {
      const sentChild = Object.keys(gmail.children).find(c => /sent|enviados|enviad/i.test(c));
      if (sentChild) sentBox = `${gmailPrefix}/${sentChild}`;
    }
    const candidates = sentBox
      ? [sentBox]
      : ['[Gmail]/Sent Mail', '[Gmail]/Enviados', '[Google Mail]/Sent Mail', '[Google Mail]/Enviados', 'Sent'];

    let opened = false;
    for (const candidate of candidates) {
      try { await connection.openBox(candidate); opened = true; break; } catch (_) {}
    }
    if (!opened) throw new Error('No se pudo abrir carpeta de enviados');

    const results = await connection.search(
      [['UID', String(uid)]],
      { bodies: [''], markSeen: false }
    );
    const item = results?.[0];
    const part = item?.parts?.find(p => p.which === '');
    if (!part?.body) throw new Error(`UID ${uid} no encontrado`);

    const email = await simpleParser('Imap-Id: ' + uid + '\r\n' + part.body);
    const att   = (email.attachments || []).find(a => {
      const n = a.filename || '';
      return n === filename || n.replace(/[‐-―−]/g, '-') === filename.replace(/[‐-―−]/g, '-');
    });
    if (!att?.content) throw new Error(`Adjunto "${filename}" no encontrado en UID ${uid}`);
    return att.content;
  } finally {
    try { connection?.end(); } catch (_) {}
  }
}

// Carga pdfjs con worker local para evitar mismatch de versión al descargar desde CDN
async function getPdfjsDocument(buffer) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const workerPath = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = `file:///${workerPath.replace(/\\/g, '/')}`;
  
  const path = require('path');
  const standardFontDataUrl = path.join(require.resolve('pdfjs-dist/package.json'), '../standard_fonts/');
  
  return pdfjs.getDocument({ 
    data: new Uint8Array(buffer),
    standardFontDataUrl: standardFontDataUrl
  }).promise;
}

// Etapa 2: pdfjs-dist getTextContent — mejor soporte de encodings que pdf-parse
async function extractTextPdfjs(buffer) {
  try {
    const pdf = await getPdfjsDocument(buffer);
    let full = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page    = await pdf.getPage(i);
      const content = await page.getTextContent();
      full += content.items.map(it => it.str).join(' ') + '\n';
    }
    console.log(`[pdfjs] Texto (${full.length} chars): ${full.slice(0, 300).replace(/\n/g, ' ')}`);
    return full;
  } catch (err) {
    console.warn('[pdfjs] Error extrayendo texto:', err.message);
    return '';
  }
}

// Etapa 3: OCR con pdfjs-dist render + @napi-rs/canvas + tesseract.js
// Solo se activa si las etapas anteriores no encuentran montos.
async function extractTextWithOCR(buffer) {
  const log = [];

  log.push('[OCR] Importando @napi-rs/canvas...');
  let createCanvas;
  try {
    ({ createCanvas } = await import('@napi-rs/canvas'));
    log.push('[OCR] @napi-rs/canvas OK');
  } catch (e) {
    log.push(`[OCR] @napi-rs/canvas no disponible: ${e.message}`);
    throw new Error(`@napi-rs/canvas no instalado: ${e.message}`);
  }

  log.push('[OCR] Importando tesseract.js...');
  const { createWorker } = await import('tesseract.js');

  log.push('[OCR] Cargando PDF...');
  const pdf = await getPdfjsDocument(buffer);
  log.push(`[OCR] PDF OK — ${pdf.numPages} páginas`);
  console.log(log.join('\n'));

  log.push('[OCR] Inicializando worker Tesseract...');
  const workerPath = require.resolve('tesseract.js/src/worker-script/node/index.js');
  const corePath   = require.resolve('tesseract.js-core/tesseract-core-simd.wasm.js');
  const worker = await createWorker(['spa', 'eng'], 1, { workerPath, corePath });
  await worker.setParameters({ tessedit_pageseg_mode: '11' });

  const texts = [];
  for (let i = 1; i <= Math.min(pdf.numPages, 3); i++) {
    const page     = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.5 });
    const w = Math.ceil(viewport.width);
    const h = Math.ceil(viewport.height);
    console.log(`[OCR] Renderizando pág ${i}: ${w}×${h}px`);

    let canvas;
    try {
      canvas = createCanvas(w, h);
    } catch (e) {
      throw new Error(`createCanvas falló: ${e.message}`);
    }

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, w, h);
    try {
      await page.render({ canvasContext: ctx, viewport }).promise;
      console.log(`[OCR] Render pág ${i} OK`);
    } catch (e) {
      throw new Error(`page.render falló en pág ${i}: ${e.message}`);
    }

    let imgBuf;
    try {
      imgBuf = canvas.toBuffer('image/png');
      console.log(`[OCR] PNG generado: ${imgBuf.length} bytes`);
    } catch (e) {
      throw new Error(`toBuffer falló: ${e.message}`);
    }

    const { data: { text, confidence } } = await worker.recognize(imgBuf);
    console.log(`[OCR] Pág ${i} — confianza: ${Math.round(confidence)}% — texto: ${text.slice(0, 300).replace(/\n/g, ' ')}`);
    texts.push(text);
  }

  await worker.terminate();
  return texts.join('\n');
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
    const quotesRef = firestore.collection('tenants').doc('6').collection('cgo_quotations');
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
