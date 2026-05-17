import { NextResponse } from 'next/server';
import vision from '@google-cloud/vision';

// ─── Cliente de Google Cloud Vision con las mismas credenciales de Firebase Admin ───
function getVisionClient() {
    const projectId    = process.env.FIREBASE_PROJECT_ID?.trim().replace(/^["']|["']$/g, '');
    const clientEmail  = process.env.FIREBASE_CLIENT_EMAIL?.trim().replace(/^["']|["']$/g, '');
    const privateKey   = (process.env.FIREBASE_PRIVATE_KEY || '').trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');

    return new vision.ImageAnnotatorClient({
        credentials: { client_email: clientEmail, private_key: privateKey },
        projectId,
    });
}

// Endpoint OCR para escanear facturas/comprobantes (PDF o imagen).
// Usa Google Cloud Vision API — mucho más preciso que Tesseract para facturas en español.
// Devuelve: { amount, ruc, serie, numero, fecha, razonSocial, text }
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

        if (type === 'application/pdf' || name.toLowerCase().endsWith('.pdf')) {
            // Para PDFs: Vision API soporta PDFs directamente via document_text_detection
            const [result] = await client.documentTextDetection({
                image: { content: buffer.toString('base64') },
                imageContext: { languageHints: ['es', 'en'] },
            });
            extractedText = result.fullTextAnnotation?.text || '';

        } else if (type.startsWith('image/') || /\.(png|jpe?g|webp|tiff?|bmp)$/i.test(name)) {
            // Para imágenes: document_text_detection es más preciso que text_detection
            const [result] = await client.documentTextDetection({
                image: { content: buffer.toString('base64') },
                imageContext: { languageHints: ['es', 'en'] },
            });
            extractedText = result.fullTextAnnotation?.text || '';
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
        });

    } catch (err) {
        console.error('[scan-invoice] Error:', err);
        return NextResponse.json({ error: err?.message || 'Error desconocido' }, { status: 500 });
    }
}

// ─── Extracción del MONTO TOTAL ──────────────────────────────────────────
function extractTotalAmount(text) {
    const upper = text.toUpperCase().replace(/\s+/g, ' ');

    // Prioridad 1: "Importe Total: 24.30" o "TOTAL A PAGAR: S/ 24.30"
    const priority = [
        /IMPORTE\s+TOTAL[^:\n]{0,15}[:\s]+S?\/?\s*([\d,]+\.?\d{0,2})/i,
        /TOTAL\s+A\s+PAGAR[^:\n]{0,10}[:\s]+S?\/?\s*([\d,]+\.?\d{0,2})/i,
        /TOTAL[^:\n]{0,20}[:\s]+S?\/?\s*([\d,]+\.?\d{0,2})/i,
        /IMPORTE[^:\n]{0,20}[:\s]+S?\/?\s*([\d,]+\.?\d{0,2})/i,
    ];
    for (const re of priority) {
        const m = upper.match(re);
        if (m) {
            const n = parseFloat(m[1].replace(/,/g, ''));
            if (n > 0 && n < 10_000_000) return Math.round(n * 100) / 100;
        }
    }

    // Prioridad 2: S/. XX.XX o S/ XX.XX
    const soles = [...upper.matchAll(/S\s*\/\.?\s*([\d,]+\.\d{2})/g)]
        .map(m => parseFloat(m[1].replace(/,/g, '')))
        .filter(n => n > 0 && n < 10_000_000);
    if (soles.length > 0) return Math.max(...soles);

    // Prioridad 3: cualquier monto con decimales
    const general = [...upper.matchAll(/\b(\d{1,3}(?:,\d{3})*\.\d{2})\b/g)]
        .map(m => parseFloat(m[1].replace(/,/g, '')))
        .filter(n => n > 1 && n < 10_000_000);
    if (general.length > 0) return Math.max(...general);

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
