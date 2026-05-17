import { NextResponse } from 'next/server';
import vision from '@google-cloud/vision';

// ─── Cliente de Google Cloud Vision ──────────────────────────────────────
// Siempre que existan FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY las usamos
// (típicamente en local). Si estamos en Cloud Run / App Hosting, se usa ADC automático.
function getVisionClient() {
    const isProd = process.env.NODE_ENV === 'production' || process.env.K_SERVICE;
    
    if (!isProd) {
        const projectId   = process.env.FIREBASE_PROJECT_ID?.replace(/^["']|["']$/g, '');
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.replace(/^["']|["']$/g, '');
        const privateKey  = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');

        if (clientEmail && privateKey) {
            return new vision.ImageAnnotatorClient({
                credentials: { client_email: clientEmail, private_key: privateKey },
                projectId,
            });
        }
    }
    return new vision.ImageAnnotatorClient();
}

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: 'No se recibió archivo.' }, { status: 400 });
        }
        if (typeof file === 'string') {
            return NextResponse.json({ error: 'Archivo inválido (se esperaba binario).' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const type   = file.type || '';
        const name   = file.name || '';

        // Google Vision máximo: 20MB
        if (buffer.byteLength > 20 * 1024 * 1024) {
            return NextResponse.json({
                error: `El archivo pesa ${(buffer.byteLength / 1024 / 1024).toFixed(1)} MB. El máximo soportado es 20 MB.`,
            }, { status: 413 });
        }

        let extractedText = '';
        let textSource = '';

        if (type === 'application/pdf' || name.toLowerCase().endsWith('.pdf')) {
            // 1. Intentamos extracción rápida de texto nativo con import dinámico para evitar 500
            try {
                const { PDFParse } = await import('pdf-parse');
                const parser = new PDFParse({ data: buffer });
                const pdfData = await parser.getText();
                extractedText = pdfData?.text || '';
                textSource = 'pdf-parse';
            } catch (parseErr) {
                console.warn('[scan-invoice] pdf-parse falló:', parseErr?.message);
            }

            // 2) Si la capa de texto no sirve, mandamos el PDF a Vision tal cual
            const tooShort  = !extractedText || extractedText.trim().length < 50;
            const tempRuc   = tooShort ? null : extractRUC(extractedText);
            const tempAmnt  = tooShort ? null : extractTotalAmount(extractedText);

            if (tooShort || !tempRuc || !tempAmnt) {
                try {
                    console.log('[scan-invoice] PDF escaneado o sin capa de texto clara. Usando Vision API...');
                    const client = getVisionClient();
                    
                    const [result] = await client.documentTextDetection({
                        image: { content: buffer.toString('base64') },
                        imageContext: { languageHints: ['es', 'en'] },
                    });
                    
                    extractedText = result.fullTextAnnotation?.text || '';
                    textSource = 'google-vision-pdf';
                } catch (visionPdfErr) {
                    console.error('[scan-invoice] Fallo en Vision PDF:', visionPdfErr?.message);
                    return NextResponse.json({ error: `OCR Vision falló: ${visionPdfErr?.message}` }, { status: 500 });
                }
            }
        } 
        else if (type.startsWith('image/') || /\.(png|jpe?g|webp|tiff?|bmp)$/i.test(name)) {
            // Imágenes van directo a Vision
            try {
                const client = getVisionClient();
                const [result] = await client.documentTextDetection({
                    image: { content: buffer.toString('base64') },
                    imageContext: { languageHints: ['es', 'en'] },
                });
                extractedText = result.fullTextAnnotation?.text || '';
                textSource = 'google-vision-image';
            } catch (visionImgErr) {
                console.error('[scan-invoice] Fallo en Vision Imagen:', visionImgErr?.message);
                return NextResponse.json({ error: `OCR Vision falló: ${visionImgErr?.message}` }, { status: 500 });
            }
        } 
        else {
            return NextResponse.json({ error: `Tipo de archivo no soportado: ${type || name}` }, { status: 400 });
        }

        if (!extractedText || extractedText.trim().length === 0) {
            return NextResponse.json({
                error: 'No se pudo extraer texto del comprobante.',
                text: '',
            }, { status: 200 });
        }

        // ── Extracción Segura ──
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
            text: (extractedText || '').slice(0, 3000),
            textSource,
            stages: [
                { name: textSource, chars: extractedText.length, error: null }
            ]
        });

    } catch (err) {
        console.error('[scan-invoice] Error crítico:', err);
        return NextResponse.json({ error: err?.message || 'Error interno en el servidor.' }, { status: 500 });
    }
}

// ─── Extracción del MONTO TOTAL ──────────────────────────────────────────
function extractTotalAmount(text) {
    if (!text) return null;
    const upper = text.toUpperCase().replace(/\s+/g, ' ');

    const regexes = [
        /(?:IMPORTE\s+TOTAL|TOTAL\s+A\s+PAGAR|TOTAL\s+NETO)\s*[:\-–\s]*\s*(?:S\s*\/?[.\s]*|PEN\s*|\$\s*)?([\d,]+\.\d{2})\b/gi,
        /(?<!SUB\s*|P\.\s*)(?<!PRECIO\s*)TOTAL\s*[:\-–\s]*\s*(?:S\s*\/?[.\s]*|PEN\s*|\$\s*)?([\d,]+\.\d{2})\b/gi,
        /IMPORTE\s*[:\-–\s]*\s*(?:S\s*\/?[.\s]*|PEN\s*|\$\s*)?([\d,]+\.\d{2})\b/gi,
    ];

    for (const regex of regexes) {
        let match;
        regex.lastIndex = 0;
        const matches = [];
        while ((match = regex.exec(upper)) !== null) {
            const val = parseFloat(match[1].replace(/,/g, ''));
            if (val > 0 && val < 1000000) matches.push(val);
        }
        if (matches.length > 0) return matches[matches.length - 1];
    }

    const moneyRegex = /(?:S\s*\/?[.\s]*|PEN\s*|\$\s*)([\d,]+\.\d{2})\b/gi;
    let m;
    const moneyValues = [];
    while ((m = moneyRegex.exec(upper)) !== null) {
        const val = parseFloat(m[1].replace(/,/g, ''));
        if (val > 0 && val < 1000000) moneyValues.push(val);
    }
    if (moneyValues.length > 0) return moneyValues[moneyValues.length - 1];

    return null;
}

// ─── Extracción del RUC ───────────────────────────────────────
function extractRUC(text) {
    if (!text) return null;
    const upper = text.toUpperCase();
    const m = upper.match(/R\.?U\.?C\.?\s*[:N°#]?\s*([12]\d{10})\b/);
    if (m?.[1]) return m[1];
    const m2 = upper.match(/\b(10|15|17|20)\d{9}\b/);
    return m2?.[0] || null;
}

// ─── Extracción de Serie + Número ────────────────────────
function extractSerieNumero(text, filename = '') {
    if (!text) return null;
    const fnMatch = filename.match(/(\d{8,11})-(\d{2})-([EFB]\d{2,3})-(\d+)/i);
    if (fnMatch) return { serie: fnMatch[3].toUpperCase(), numero: fnMatch[4] };

    const upper = text.toUpperCase();
    const m = upper.match(/\b([EFB]\d{2,3})\s*[-–]\s*(\d{1,10})\b/);
    if (m) return { serie: m[1], numero: m[2].replace(/^0+/, '') || m[2] };
    return null;
}

// ─── Extracción de Fecha ──────────────────────────────────────
function extractFecha(text) {
    if (!text) return null;
    const upper = text.toUpperCase();
    const m = upper.match(/(?:F\.?\s*EMISI[ÓO]N|FECHA[^:]*)[:\s]+(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
    if (m) {
        const dd = m[1].padStart(2, '0');
        const mm = m[2].padStart(2, '0');
        let yy = m[3].length === 2 ? (parseInt(m[3]) > 50 ? '19' : '20') + m[3] : m[3];
        const d = new Date(`${yy}-${mm}-${dd}`);
        if (!isNaN(d) && d.getFullYear() >= 2020 && d.getFullYear() <= 2035) return `${yy}-${mm}-${dd}`;
    }
    const m2 = upper.match(/\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\b/);
    if (m2) {
        const dd = m2[1].padStart(2, '0'), mm = m2[2].padStart(2, '0'), yy = m2[3];
        const d = new Date(`${yy}-${mm}-${dd}`);
        if (!isNaN(d) && d.getFullYear() >= 2020 && d.getFullYear() <= 2035) return `${yy}-${mm}-${dd}`;
    }
    return null;
}

// ─── Extracción de Razón Social ────────────────────────────────
function extractRazonSocial(text, ruc) {
    if (!text || !ruc) return null;
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
