import { NextResponse } from 'next/server';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

// Resuelve rutas dentro de node_modules de forma compatible con Turbopack
// (require.resolve devuelve un placeholder "[externals]/..." cuando el paquete
// está en serverExternalPackages, lo que rompe tesseract.js)
const nodeModule = (...segments) => path.join(process.cwd(), 'node_modules', ...segments);

// Endpoint OCR para escanear facturas/comprobantes (PDF o imagen).
// Estrategia robusta en 3 etapas (igual que emailListener):
//   1) pdf-parse — rápido para PDFs nativos con capa de texto
//   2) pdfjs-dist getTextContent — mejor para encodings problemáticos
//   3) Tesseract OCR — renderiza el PDF como imagen, último recurso
// Para imágenes va directo a OCR.
// Devuelve: { amount, ruc, serie, numero, fecha, text, stages, confidence }
export async function POST(req) {
    const stages = [];
    try {
        const data = await req.formData();
        const file = data.get('file');

        if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 });

        const buffer = Buffer.from(await file.arrayBuffer());
        const type = file.type || '';
        const name = file.name || '';

        let extractedText = '';
        let textSource = null;

        // ── PDFs: 3 etapas con fallback automático ────────────────────────
        if (type === 'application/pdf' || name.toLowerCase().endsWith('.pdf')) {
            // Etapa 1: pdf-parse
            try {
                const parser  = new PDFParse({ data: buffer });
                const pdfData = await parser.getText();
                extractedText = pdfData?.text || '';
                stages.push({ name: 'pdf-parse', chars: extractedText.length });
                if (extractedText.trim().length > 30) textSource = 'pdf-parse';
            } catch (e) {
                stages.push({ name: 'pdf-parse', error: e.message });
            }

            // Etapa 2: pdfjs-dist (si pdf-parse devolvió poco texto)
            if (!textSource) {
                try {
                    const pdfjsText = await extractTextPdfjs(buffer);
                    stages.push({ name: 'pdfjs-dist', chars: pdfjsText.length });
                    if (pdfjsText.trim().length > 30) {
                        extractedText = pdfjsText;
                        textSource = 'pdfjs-dist';
                    }
                } catch (e) {
                    stages.push({ name: 'pdfjs-dist', error: e.message });
                }
            }

            // Etapa 3: OCR del PDF renderizado como imagen
            if (!textSource) {
                try {
                    const ocrText = await extractTextWithOCRFromPdf(buffer);
                    stages.push({ name: 'tesseract-pdf', chars: ocrText.length });
                    if (ocrText.trim().length > 0) {
                        extractedText = ocrText;
                        textSource = 'tesseract-pdf';
                    }
                } catch (e) {
                    stages.push({ name: 'tesseract-pdf', error: e.message });
                }
            }
        } else if (type.startsWith('image/') || /\.(png|jpe?g|webp|tiff?|bmp)$/i.test(name)) {
            // ── Imágenes: directo a OCR ────────────────────────────────────
            try {
                const ocrText = await extractTextWithOCRFromImage(buffer);
                stages.push({ name: 'tesseract-image', chars: ocrText.length });
                extractedText = ocrText;
                textSource = 'tesseract-image';
            } catch (e) {
                stages.push({ name: 'tesseract-image', error: e.message });
                return NextResponse.json({
                    error: `OCR falló: ${e.message}`,
                    stages,
                }, { status: 500 });
            }
        } else {
            return NextResponse.json({
                error: `Tipo de archivo no soportado: ${type || name}`,
            }, { status: 400 });
        }

        if (!extractedText || extractedText.trim().length === 0) {
            return NextResponse.json({
                error: 'No se pudo extraer texto del documento. Puede que la imagen sea de muy baja calidad.',
                stages,
                text: '',
            }, { status: 200 });
        }

        // ── Extraer datos estructurados ────────────────────────────────────
        const amount  = extractTotalAmount(extractedText);
        const ruc     = extractRUC(extractedText);
        const serie   = extractSerieNumero(extractedText, name);
        const fecha   = extractFecha(extractedText);
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
            stages,
        });
    } catch (err) {
        console.error('[scan-invoice] Error:', err);
        return NextResponse.json({
            error: err?.message || 'Error desconocido',
            stages,
        }, { status: 500 });
    }
}

// ─── Extracción del MONTO TOTAL ─────────────────────────────────────────
function extractTotalAmount(text) {
    const normalized = text.toUpperCase().replace(/\s+/g, ' ');
    const amounts = extractAmounts(normalized);

    // Prioridad 1: montos etiquetados (TOTAL, IMPORTE TOTAL, S/, etc.)
    if (amounts.labeled.length > 0) return Math.max(...amounts.labeled);
    // Prioridad 2: máximo de los montos generales detectados
    if (amounts.general.length > 0) return Math.max(...amounts.general);
    return null;
}

// Extracción de todos los montos del documento (etiquetados y generales)
// Replicada del emailListener — patrones probados con facturas SUNAT.
function extractAmounts(text) {
    let normalized = text
        .replace(/(\d),\s+(\d)/g, '$1,$2')
        .replace(/(\d)\s+\.(\d{2})(?!\d)/g, '$1.$2')
        .replace(/(\d)\.\s+(\d{2})(?!\d)/g, '$1.$2')
        .replace(/S\s*\/\s*\.\s*/g, 'S/. ')
        .replace(/S\s*\/(?!\.)/g, 'S/ ');

    const labeled = new Set();
    const labeledPatterns = [
        /S\s*[/.]\s*\.?\s*(?<![,\d])([\d]{1,3}(?:,\d{3})*\.\d{2})(?!\d)/gi,
        /PEN\s+(?<![,\d])([\d]{1,3}(?:,\d{3})*\.\d{2})(?!\d)/gi,
        /IMPORTE\s+TOTAL[^:\n]{0,10}[:\s]+(?:S\s*[/.]\s*\.?\s*)?([\d]{1,3}(?:,\d{3})*\.\d{2})(?!\d)/gi,
        /TOTAL[^:\n]{0,20}[:\s]+(?:S\s*[/.]\s*\.?\s*)?([\d]{1,3}(?:,\d{3})*\.\d{2})(?!\d)/gi,
        /IMPORTE[^:\n]{0,20}[:\s]+(?:S\s*[/.]\s*\.?\s*)?([\d]{1,3}(?:,\d{3})*\.\d{2})(?!\d)/gi,
        /VALOR[^:\n]{0,20}[:\s]+(?:S\s*[/.]\s*\.?\s*)?([\d]{1,3}(?:,\d{3})*\.\d{2})(?!\d)/gi,
        /:[:\s]*S\s*[/.]\s*\.?\s*([\d]{1,3}(?:,\d{3})*\.\d{2})(?!\d)/gi,
        /(?<![,\d])([\d]{1,3}(?:,\d{3})+\.\d{2})(?!\d)/g,
    ];
    for (const re of labeledPatterns) {
        let m;
        while ((m = re.exec(normalized)) !== null) {
            const n = parseFloat(m[1].replace(/,/g, ''));
            if (n > 1 && n < 10_000_000) labeled.add(Math.round(n * 100) / 100);
        }
    }

    const general = new Set();
    const generalRe = /(?<![,\d\/])(\d{2,}(?:,\d{3})*\.\d{2})(?!\d)/g;
    let m;
    while ((m = generalRe.exec(normalized)) !== null) {
        const n = parseFloat(m[1].replace(/,/g, ''));
        if (n > 1 && n < 10_000_000) general.add(Math.round(n * 100) / 100);
    }

    return { labeled: [...labeled], general: [...general] };
}

// ─── Extracción del RUC del emisor ─────────────────────────────────────
function extractRUC(text) {
    const normalized = text.toUpperCase();
    // Patrón 1: "R.U.C.: 20XXXXXXXXX" o "RUC: 20XXXXXXXXX"
    const m = normalized.match(/R\.?U\.?C\.?\s*[:N°#]?\s*([12]\d{10})\b/);
    if (m?.[1]) return m[1];
    // Patrón 2: cualquier RUC válido (comienza en 10, 15, 17, 20)
    const m2 = normalized.match(/\b(10|15|17|20)\d{9}\b/);
    return m2?.[0] || null;
}

// ─── Extracción de Serie + Número del comprobante ──────────────────────
function extractSerieNumero(text, filename = '') {
    // Buscar primero en el filename (más confiable cuando es factura electrónica SUNAT)
    // Formato típico: {RUC}-01-F001-12345
    const fnMatch = filename.match(/(\d{8,11})-(\d{2})-([EFB]\d{2,3})-(\d+)/i);
    if (fnMatch) return { serie: fnMatch[3].toUpperCase(), numero: fnMatch[4] };

    const normalized = text.toUpperCase();
    // Patrón 1: F001-00000123, E001-123, B001-456 (factura/electrónica/boleta)
    const m = normalized.match(/\b([EFB]\d{2,3})\s*[-\s]\s*(\d{1,10})\b/);
    if (m) return { serie: m[1], numero: m[2].replace(/^0+/, '') || m[2] };
    return null;
}

// ─── Extracción de fecha de emisión ────────────────────────────────────
function extractFecha(text) {
    const normalized = text.toUpperCase();
    // Patrón 1: DD/MM/YYYY o DD-MM-YYYY
    const m = normalized.match(/(?:FECHA[^:]*[:\s]+|EMISI[ÓO]N[^:]*[:\s]+)?(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
    if (m) {
        const dd = m[1].padStart(2, '0');
        const mm = m[2].padStart(2, '0');
        let yy   = m[3];
        if (yy.length === 2) yy = (parseInt(yy) > 50 ? '19' : '20') + yy;
        // Validación básica de rango
        const d = new Date(`${yy}-${mm}-${dd}`);
        if (!isNaN(d.getTime()) && d.getFullYear() >= 2020 && d.getFullYear() <= 2035) {
            return `${yy}-${mm}-${dd}`;
        }
    }
    // Patrón 2: YYYY-MM-DD
    const m2 = normalized.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
    if (m2) return `${m2[1]}-${m2[2]}-${m2[3]}`;
    return null;
}

// ─── Extracción de razón social del emisor ─────────────────────────────
function extractRazonSocial(text, ruc) {
    if (!ruc) return null;
    // La razón social usualmente está cerca del RUC, dos a tres líneas antes
    const idx = text.toUpperCase().indexOf(ruc);
    if (idx === -1) return null;
    const before = text.slice(Math.max(0, idx - 200), idx);
    const lines  = before.split('\n').map(l => l.trim()).filter(Boolean);
    // Buscar línea con palabras clave de empresa (S.A.C., S.A., E.I.R.L., etc.)
    for (let i = lines.length - 1; i >= 0; i--) {
        if (/S\.?\s*A\.?\s*C?|E\.?\s*I\.?\s*R\.?\s*L|S\.?\s*R\.?\s*L|S\.?\s*A\.?\s*A|EMPRESA/i.test(lines[i])) {
            return lines[i].replace(/\s+/g, ' ').slice(0, 120);
        }
    }
    // Como fallback, la última línea no vacía antes del RUC
    return lines[lines.length - 1]?.slice(0, 120) || null;
}

// ─── pdfjs-dist: extracción de texto con mejor soporte de encodings ────
async function getPdfjsDocument(buffer) {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const workerPath = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = `file:///${workerPath.replace(/\\/g, '/')}`;
    return pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
}

async function extractTextPdfjs(buffer) {
    const pdf = await getPdfjsDocument(buffer);
    let full = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page    = await pdf.getPage(i);
        const content = await page.getTextContent();
        full += content.items.map(it => it.str).join(' ') + '\n';
    }
    return full;
}

// ─── Tesseract OCR para PDFs (renderizando como imagen) ────────────────
async function extractTextWithOCRFromPdf(buffer) {
    const { createCanvas } = await import('@napi-rs/canvas');
    const { createWorker } = await import('tesseract.js');

    const pdf = await getPdfjsDocument(buffer);
    const worker = await createTesseractWorker();

    const texts = [];
    const maxPages = Math.min(pdf.numPages, 3);
    for (let i = 1; i <= maxPages; i++) {
        const page     = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.5 });
        const w = Math.ceil(viewport.width);
        const h = Math.ceil(viewport.height);

        const canvas = createCanvas(w, h);
        const ctx    = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, w, h);
        await page.render({ canvasContext: ctx, viewport }).promise;

        const imgBuf = canvas.toBuffer('image/png');
        const { data: { text } } = await worker.recognize(imgBuf);
        texts.push(text);
    }
    await worker.terminate();
    return texts.join('\n');
}

// ─── Tesseract OCR para imágenes directas ──────────────────────────────
async function extractTextWithOCRFromImage(buffer) {
    const worker = await createTesseractWorker();
    const { data: { text } } = await worker.recognize(buffer);
    await worker.terminate();
    return text;
}

// Inicializa worker tesseract con paths locales (evita descargas del CDN
// que pueden fallar en entornos sin internet o con cortafuegos).
async function createTesseractWorker() {
    const { createWorker } = await import('tesseract.js');
    const workerPath = require.resolve('tesseract.js/src/worker-script/node/index.js');
    const corePath   = require.resolve('tesseract.js-core/tesseract-core-simd.wasm.js');
    const worker = await createWorker(['spa', 'eng'], 1, { workerPath, corePath });
    await worker.setParameters({ tessedit_pageseg_mode: '11' });
    return worker;
}
