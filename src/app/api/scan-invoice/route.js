import { NextResponse } from 'next/server';
import vision from '@google-cloud/vision';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse'); // Destructurado para evitar constructor TypeErrors

// ─── Cliente de Google Cloud Vision con las mismas credenciales de Firebase Admin ───
function getVisionClient() {
    const projectId    = process.env.FIREBASE_PROJECT_ID?.trim().replace(/^["']|["']$/g, '');
    const clientEmail  = process.env.FIREBASE_CLIENT_EMAIL?.trim().replace(/^["']|["']$/g, '');
    const privateKey   = (process.env.FIREBASE_PRIVATE_KEY || '').trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');

    // En producción (GCP / Firebase App Hosting), si no hay env variables explícitas,
    // dejamos que use automáticamente la Cuenta de Servicio del entorno de Cloud Run (ADC)
    if (clientEmail && privateKey) {
        return new vision.ImageAnnotatorClient({
            credentials: { client_email: clientEmail, private_key: privateKey },
            projectId,
        });
    }

    return new vision.ImageAnnotatorClient();
}

// ─── Renderizador de PDF en imagen usando pdfjs-dist y canvas local ───
async function getPdfjsDocument(buffer) {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    // Para Next.js, importar el worker en proceso es mucho más seguro y portable
    // que depender de resoluciones de rutas relativas con file:///
    const pdfjsWorker = await import('pdfjs-dist/legacy/build/pdf.worker.mjs');
    pdfjs.GlobalWorkerOptions.workerPort = pdfjsWorker;
    return pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
}

async function renderPdfPageToImage(buffer) {
    const { createCanvas } = await import('@napi-rs/canvas');
    const pdf = await getPdfjsDocument(buffer);
    const page = await pdf.getPage(1); // Escaneamos la primera página (donde están todos los totales y datos)
    const viewport = page.getViewport({ scale: 2.0 }); // Escala 2.0 para alta definición en OCR
    const w = Math.ceil(viewport.width);
    const h = Math.ceil(viewport.height);

    const canvas = createCanvas(w, h);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, w, h);
    
    await page.render({ canvasContext: ctx, viewport }).promise;
    return canvas.toBuffer('image/png');
}

// Endpoint OCR inteligente para escanear facturas/comprobantes (PDF o imagen).
// 1) Si es PDF nativo con texto legible, usa pdf-parse (instantáneo y gratis).
// 2) Si es PDF escaneado (imagen) o con encoding raro, lo convierte a imagen y hace OCR de Google Vision.
// 3) Si es imagen, hace OCR de Google Vision directo.
export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get('file');

        if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 });

        const buffer = Buffer.from(await file.arrayBuffer());
        const type   = file.type || '';
        const name   = file.name || '';

        const client = getVisionClient();
        let extractedText = '';
        let textSource = '';

        if (type === 'application/pdf' || name.toLowerCase().endsWith('.pdf')) {
            // 1. Intentamos extracción rápida de texto nativo
            try {
                const parser = new PDFParse({ data: buffer });
                const pdfData = await parser.getText();
                extractedText = pdfData?.text || '';
                textSource = 'pdf-parse';
            } catch (parseErr) {
                console.warn('pdf-parse falló, se intentará renderizar:', parseErr);
            }

            // 2. Si no hay texto, o el texto es sospechosamente corto, o no tiene los datos clave,
            // renderizamos la primera página a imagen y hacemos el OCR robusto de Google Vision.
            const isTextGarbage = !extractedText || extractedText.trim().length < 50;
            const tempAmount = isTextGarbage ? null : extractTotalAmount(extractedText);
            const tempRuc    = isTextGarbage ? null : extractRUC(extractedText);

            if (isTextGarbage || !tempAmount || !tempRuc) {
                try {
                    console.log('PDF escaneado o ilegible detectado. Convirtiendo a imagen para OCR con Google Vision...');
                    const pageImageBuffer = await renderPdfPageToImage(buffer);
                    
                    const [result] = await client.documentTextDetection({
                        image: { content: pageImageBuffer.toString('base64') },
                        imageContext: { languageHints: ['es', 'en'] },
                    });
                    extractedText = result.fullTextAnnotation?.text || '';
                    textSource = 'google-vision-pdf';
                } catch (ocrErr) {
                    console.error('OCR de PDF renderizado falló:', ocrErr);
                }
            }
        } else if (type.startsWith('image/') || /\.(png|jpe?g|webp|tiff?|bmp)$/i.test(name)) {
            // Para imágenes directo a Google Vision
            const [result] = await client.documentTextDetection({
                image: { content: buffer.toString('base64') },
                imageContext: { languageHints: ['es', 'en'] },
            });
            extractedText = result.fullTextAnnotation?.text || '';
            textSource = 'google-vision-image';
        } else {
            return NextResponse.json({ error: `Tipo de archivo no soportado: ${type || name}` }, { status: 400 });
        }

        if (!extractedText || extractedText.trim().length === 0) {
            return NextResponse.json({
                error: 'No se pudo extraer texto del documento.',
                text: '',
            }, { status: 200 });
        }

        // ── Extraer datos estructurados ──────────────────────────────────
        const amount      = extractTotalAmount(extractedText);
        const ruc         = extractRUC(extractedText);
        const serie       = extractSerieNumero(extractedText, name);
        const fecha       = extractFecha(extractedText);
        const razonSocial = extractRazonSocial(extractedText, ruc);

        return NextResponse.json({
            amount,
            ruc,
            serie:  serie?.serie  || null,
            numero: serie?.numero || null,
            fecha,
            razonSocial,
            text: extractedText.slice(0, 3000),
            textSource,
        });

    } catch (err) {
        console.error('[scan-invoice] Error:', err);
        return NextResponse.json({ error: err?.message || 'Error desconocido' }, { status: 500 });
    }
}

// ─── Extracción del MONTO TOTAL ──────────────────────────────────────────
function extractTotalAmount(text) {
    const upper = text.toUpperCase().replace(/\s+/g, ' ');

    // Buscamos todas las coincidencias de patrones de TOTAL real
    const regexes = [
        // 1. TOTAL A PAGAR o IMPORTE TOTAL (las etiquetas más específicas)
        /(?:IMPORTE\s+TOTAL|TOTAL\s+A\s+PAGAR|TOTAL\s+NETO)\s*[:\-–\s]*\s*(?:S\s*\/?[.\s]*|PEN\s*|\$\s*)?([\d,]+\.\d{2})\b/gi,
        // 2. TOTAL a secas (evitando SUB TOTAL, P. TOTAL y PRECIO TOTAL)
        /(?<!SUB\s*|P\.\s*)(?<!PRECIO\s*)TOTAL\s*[:\-–\s]*\s*(?:S\s*\/?[.\s]*|PEN\s*|\$\s*)?([\d,]+\.\d{2})\b/gi,
        // 3. IMPORTE a secas
        /IMPORTE\s*[:\-–\s]*\s*(?:S\s*\/?[.\s]*|PEN\s*|\$\s*)?([\d,]+\.\d{2})\b/gi,
    ];

    for (const regex of regexes) {
        let match;
        regex.lastIndex = 0;
        const matches = [];
        while ((match = regex.exec(upper)) !== null) {
            const val = parseFloat(match[1].replace(/,/g, ''));
            if (val > 0 && val < 1000000) {
                matches.push(val);
            }
        }
        if (matches.length > 0) {
            // Devolvemos el último encontrado en el documento, que corresponde al total final del pie de página
            return matches[matches.length - 1];
        }
    }

    // Fallback inteligente: si no se detectan etiquetas, buscamos el último valor monetario del documento con S/
    const moneyRegex = /(?:S\s*\/?[.\s]*|PEN\s*|\$\s*)([\d,]+\.\d{2})\b/gi;
    let m;
    const moneyValues = [];
    while ((m = moneyRegex.exec(upper)) !== null) {
        const val = parseFloat(m[1].replace(/,/g, ''));
        if (val > 0 && val < 1000000) {
            moneyValues.push(val);
        }
    }
    if (moneyValues.length > 0) {
        return moneyValues[moneyValues.length - 1]; // El último monto con S/ suele ser el total final
    }

    return null;
}

// ─── Extracción del RUC del emisor ───────────────────────────────────────
function extractRUC(text) {
    const upper = text.toUpperCase();
    // RUC explícito con etiqueta
    const m = upper.match(/R\.?U\.?C\.?\s*[:N°#]?\s*([12]\d{10})\b/);
    if (m?.[1]) return m[1];
    // Cualquier número de 11 dígitos que empiece por 10, 15, 17, 20
    const m2 = upper.match(/\b(10|15|17|20)\d{9}\b/);
    return m2?.[0] || null;
}

// ─── Extracción de Serie + Número del comprobante ────────────────────────
function extractSerieNumero(text, filename = '') {
    // Del nombre del archivo (PDF electrónico SUNAT)
    const fnMatch = filename.match(/(\d{8,11})-(\d{2})-([EFB]\d{2,3})-(\d+)/i);
    if (fnMatch) return { serie: fnMatch[3].toUpperCase(), numero: fnMatch[4] };

    const upper = text.toUpperCase();
    // F001-35710, E001-123, B001-456
    const m = upper.match(/\b([EFB]\d{2,3})\s*[-–]\s*(\d{1,10})\b/);
    if (m) return { serie: m[1], numero: m[2].replace(/^0+/, '') || m[2] };
    return null;
}

// ─── Extracción de fecha de emisión ──────────────────────────────────────
function extractFecha(text) {
    const upper = text.toUpperCase();
    // "F. Emision: 11/05/2026" o similar
    const m = upper.match(/(?:F\.?\s*EMISI[ÓO]N|FECHA[^:]*)[:\s]+(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
    if (m) {
        const dd = m[1].padStart(2, '0');
        const mm = m[2].padStart(2, '0');
        let yy = m[3].length === 2 ? (parseInt(m[3]) > 50 ? '19' : '20') + m[3] : m[3];
        const d = new Date(`${yy}-${mm}-${dd}`);
        if (!isNaN(d) && d.getFullYear() >= 2020 && d.getFullYear() <= 2035) return `${yy}-${mm}-${dd}`;
    }
    // Cualquier DD/MM/YYYY
    const m2 = upper.match(/\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\b/);
    if (m2) {
        const dd = m2[1].padStart(2, '0'), mm = m2[2].padStart(2, '0'), yy = m2[3];
        const d = new Date(`${yy}-${mm}-${dd}`);
        if (!isNaN(d) && d.getFullYear() >= 2020 && d.getFullYear() <= 2035) return `${yy}-${mm}-${dd}`;
    }
    return null;
}

// ─── Extracción de razón social del emisor ────────────────────────────────
function extractRazonSocial(text, ruc) {
    if (!ruc) return null;
    const idx = text.toUpperCase().indexOf(ruc);
    if (idx === -1) return null;
    const before = text.slice(Math.max(0, idx - 300), idx);
    const lines  = before.split('\n').map(l => l.trim()).filter(Boolean);
    for (let i = lines.length - 1; i >= 0; i--) {
        if (/S\.?\s*A\.?\s*C?|E\.?\s*I\.?\s*R\.?\s*L|S\.?\s*R\.?\s*L|EMPRESA|E\.I\.R\.L/i.test(lines[i])) {
            return lines[i].replace(/\s+/g, ' ').slice(0, 120);
        }
    }
    return lines[lines.length - 1]?.slice(0, 120) || null;
}
