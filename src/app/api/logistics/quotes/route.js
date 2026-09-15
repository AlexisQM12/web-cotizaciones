import { NextResponse } from 'next/server';
import { firestore, admin } from '@/lib/firebase-admin';
import * as XLSX from 'xlsx';

const LISTS_COL  = 'logistics_lists';
const QUOTES_COL = 'logistics_quotes';

// ── Normalización y matching difuso ─────────────────────────────────────────
const STOPWORDS = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'para', 'con', 'por', 'und', 'unidad', 'unidades']);

const ACCENT_MAP = { 'á':'a','é':'e','í':'i','ó':'o','ú':'u','ü':'u','ñ':'n' };

function normalize(s) {
    return String(s || '')
        .toLowerCase()
        .replace(/[áéíóúüñ]/g, ch => ACCENT_MAP[ch] || ch)
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function tokenize(s) {
    return normalize(s).split(' ').filter(t => t.length >= 2 && !STOPWORDS.has(t));
}

// Puntúa qué tan bien una línea del proveedor cubre el nombre del requerimiento
function matchScore(reqTokens, lineNorm) {
    if (reqTokens.length === 0) return 0;
    let hit = 0;
    for (const t of reqTokens) {
        if (/\d/.test(t)) {
            // Tokens numéricos (capacidades, mallas: "50", "1l", "100ml") deben
            // coincidir como palabra completa — "50" no debe coincidir dentro de "500ml"
            const esc = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            if (new RegExp(`(?<![a-z0-9])${esc}(?![0-9])`).test(lineNorm)) hit++;
        } else if (lineNorm.includes(t)) {
            hit++;
        } else if (t.length > 4 && lineNorm.includes(t.slice(0, -2))) {
            hit += 0.7; // tolera plural/sufijo
        }
    }
    return hit / reqTokens.length;
}

// Bloques que son cabecera/pie del documento, no ítems
function isJunkCandidate(c) {
    if (c.norm.length > 300) return true;
    return /validez de (la )?oferta|impreso por|datos de cliente|forma de pago|cond\s+pago|razon social|representacion impresa|consulte su documento/.test(c.norm);
}

// Extrae montos de una línea: "10.50" "1,250.00" y formatos de 4 decimales
// tipo "34.0000" (algunos sistemas los emiten así, a veces pegados a más texto).
function extractLinePrices(line) {
    const prices = [];
    const push = (raw) => {
        const v = Math.round(parseFloat(raw.replace(/,/g, '')) * 100) / 100;
        if (v > 0 && v < 1_000_000) prices.push(v);
    };
    const re2 = /(?<![\d,.])(\d{1,3}(?:,\d{3})*\.\d{2}|\d+\.\d{2})(?!\d)/g;
    const re4 = /(?<![\d,.])(\d{1,3}(?:,\d{3})*\.\d{4}|\d+\.\d{4})(?!\d)/g;
    let m;
    while ((m = re2.exec(line)) !== null) push(m[1]);
    while ((m = re4.exec(line)) !== null) push(m[1]);
    return prices;
}

// Construye candidatos {text, norm, prices} desde texto plano (PDF/imagen).
// Muchos PDFs emiten la descripción y los precios en LÍNEAS SEPARADAS
// (descripción → marca → cantidad → unidad → precio → importe), así que
// agrupamos en bloques: un bloque arranca en una línea "descriptiva" y absorbe
// las líneas siguientes (precios, unidades, marca) hasta la próxima descripción.
function candidatesFromText(input) {
    const lines = (Array.isArray(input) ? input : String(input).split('\n'))
        .map(l => l.trim()).filter(l => l.length > 1);
    const isDescLine = (norm) => (norm.match(/[a-z]{3,}/g) || []).length >= 2;

    const blocks = [];
    let cur = null;
    for (const line of lines) {
        const norm   = normalize(line);
        const prices = extractLinePrices(line);
        const desc   = isDescLine(norm);

        if (desc && (!cur || cur.prices.length > 0 || cur.descLines.length >= 5)) {
            // Nueva descripción después de haber visto precios → nuevo bloque
            if (cur) blocks.push(cur);
            cur = { descLines: [line], prices: [...prices] };
        } else if (cur) {
            if (desc) cur.descLines.push(line);   // continúa la descripción (marca, presentación…)
            cur.prices.push(...prices);
        } else if (desc) {
            cur = { descLines: [line], prices: [...prices] };
        }
    }
    if (cur) blocks.push(cur);

    return blocks.map(b => {
        const joined = b.descLines.join(' ');
        return { text: joined.slice(0, 200), norm: normalize(joined), prices: b.prices.slice(0, 12) };
    });
}

// Dado el conjunto de montos de un bloque y la cantidad requerida, infiere
// precio unitario y total: busca la pareja donde unit × qty ≈ total.
function inferPrices(prices, qty) {
    const uniq = [...new Set(prices)];
    if (uniq.length === 0) return null;

    if (qty > 0 && uniq.length > 1) {
        for (const p of uniq) {
            for (const t of uniq) {
                if (p === t) continue;
                if (Math.abs(p * qty - t) <= Math.max(t * 0.02, 0.05)) {
                    return { unitPrice: p, total: t, inferred: 'qty-pair' };
                }
            }
        }
    }
    // Descartar montos que en realidad son la cantidad (ej. "10.00" cuando qty=10)
    const rest = qty > 0 ? uniq.filter(v => Math.abs(v - qty) > 0.001) : uniq;
    const pool = rest.length > 0 ? rest : uniq;
    const sorted = [...pool].sort((a, b) => a - b);
    const unitPrice = sorted[0];
    const total = sorted.length > 1
        ? sorted[sorted.length - 1]
        : (qty > 0 ? Math.round(unitPrice * qty * 100) / 100 : unitPrice);
    return { unitPrice, total, inferred: 'min-max' };
}

// Construye candidatos desde un Excel de proveedor (cualquier formato tabular)
function candidatesFromXlsx(buffer) {
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const out = [];
    for (const name of wb.SheetNames) {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: null });
        for (const row of rows) {
            if (!row) continue;
            const texts  = row.filter(c => typeof c === 'string' && c.trim().length > 2);
            const nums   = row.filter(c => typeof c === 'number' && c > 0 && c < 1_000_000);
            if (texts.length === 0) continue;
            const joined = texts.join(' ');
            const prices = nums.map(n => Math.round(n * 100) / 100);
            // También detectar precios dentro de celdas de texto
            for (const t of texts) prices.push(...extractLinePrices(t));
            out.push({ text: joined.slice(0, 200), norm: normalize(joined), prices });
        }
    }
    return out;
}

// ── Extracción del número de cotización / presupuesto ───────────────────────
// Formatos reales soportados:
//   "PRESUPUESTO N°411-DQ-26"            → 411-DQ-26
//   "COTIZACIÓN  N° C001-00011814"       → C001-00011814
//   "Número de cotización\nS02471"       → S02471
//   "COTIZACIÓN: 00002243"               → 00002243
//   "CO06261151..." (texto pegado)       → CO06261151
//   Fallback: nombre del archivo
function extractQuoteNumber(text, fileName = '') {
    const t = String(text || '').replace(/\r/g, '');

    const clean = (s) => String(s || '').trim().replace(/[.,;:]+$/, '').toUpperCase();
    const isValid = (s) => {
        if (!s || s.length < 3 || s.length > 25) return false;
        if (!/\d/.test(s)) return false;
        if (/^(19|20)\d{2}$/.test(s)) return false;           // año suelto
        if (/^[12]\d{10}$/.test(s)) return false;             // RUC
        return true;
    };

    const textPatterns = [
        // "Número de cotización" con el código en la misma línea o la siguiente
        /N[UÚ]MERO\s+DE\s+COTIZACI[OÓ]N\s*:?\s*\n?\s*([A-Z]{0,3}-?\d{3,10}[A-Z0-9-]*)/i,
        // "COTIZACIÓN / PRESUPUESTO / PROFORMA" + N° opcional + código
        /(?:COTIZACI[OÓ]N|PRESUPUESTO|PROFORMA)\s*(?:N[°ºO]?\.?\s*)?[:#]?\s*\n?\s*([A-Z]{0,4}\d{2,10}(?:[-–][A-Z0-9]{1,8}){0,3})/i,
        // Serie tipo comprobante: C001-00011814
        /\b([A-Z]\d{3}-\d{5,10})\b/,
        // Prefijo CO + 8 dígitos (puede venir pegado a más texto)
        /\b(CO\d{8})/i,
    ];
    for (const re of textPatterns) {
        const m = t.match(re);
        if (m?.[1]) {
            const v = clean(m[1]);
            if (isValid(v)) return v;
        }
    }

    // Fallbacks sobre el nombre del archivo
    const base = String(fileName || '').replace(/\.[a-z0-9]+$/i, '');
    const filePatterns = [
        /([A-Z]\d{3}-\d{5,10})/i,                       // C001-00011814
        /PRESUP\w*[\s_-]*(\d{2,5}-[A-Z]{1,4}-\d{2,4})/i, // PRESUP 411-DQ-26
        /COTIZACI[OÓ]?N?[\s_-]+(\d{3,8})\b/i,            // COTIZACION-2243
        /\b(S\d{4,6})\b/i,                               // S02471
        /^(CO\d{6,12})$/i,                               // co06261151
        /N[°ºO]?\s*(\d{3,10})/i,                         // N° 1234
    ];
    for (const re of filePatterns) {
        const m = base.match(re);
        if (m?.[1]) {
            const v = clean(m[1]);
            if (isValid(v)) return v;
        }
    }
    return null;
}

// Reconstruye las FILAS reales de la tabla a partir de la geometría de Vision.
// Google Vision, con tablas, vuelca el texto plano por COLUMNAS (toda la columna
// de precios junta, luego códigos, luego descripciones), lo que rompe la
// asociación descripción↔precio. Aquí reagrupamos las palabras por su posición
// vertical (Y) para reconstruir cada fila con su descripción y montos juntos.
function reconstructLinesFromVision(annotationResponses) {
    const allLines = [];
    for (const pageResp of annotationResponses || []) {
        const fta = pageResp?.fullTextAnnotation;
        if (!fta) continue;
        for (const page of fta.pages || []) {
            const words = [];
            for (const block of page.blocks || []) {
                for (const para of block.paragraphs || []) {
                    for (const word of para.words || []) {
                        const txt = (word.symbols || []).map(s => s.text).join('');
                        const verts = word.boundingBox?.normalizedVertices || word.boundingBox?.vertices || [];
                        if (!txt || verts.length === 0) continue;
                        const ys = verts.map(v => v.y || 0);
                        const xs = verts.map(v => v.x || 0);
                        words.push({
                            txt,
                            cy: ys.reduce((a, b) => a + b, 0) / ys.length,
                            cx: xs.reduce((a, b) => a + b, 0) / xs.length,
                            h:  Math.max(...ys) - Math.min(...ys),
                        });
                    }
                }
            }
            if (words.length === 0) continue;
            const avgH = words.reduce((a, w) => a + w.h, 0) / words.length;
            const tol  = Math.max(avgH * 0.6, 0.006); // tolerancia vertical para "misma fila"
            words.sort((a, b) => a.cy - b.cy || a.cx - b.cx);
            let cur = [], curY = null;
            const flush = () => {
                if (!cur.length) return;
                cur.sort((a, b) => a.cx - b.cx);
                allLines.push(cur.map(w => w.txt).join(' '));
                cur = [];
            };
            for (const w of words) {
                if (curY === null || Math.abs(w.cy - curY) <= tol) {
                    cur.push(w);
                    curY = curY === null ? w.cy : (curY * (cur.length - 1) + w.cy) / cur.length;
                } else {
                    flush(); cur = [w]; curY = w.cy;
                }
            }
            flush();
        }
    }
    return allLines;
}

// Devuelve { text, lines }: `text` es el texto plano (para nº de cotización y
// almacenamiento); `lines` son las filas reconstruidas por geometría.
async function extractTextWithVision(buffer, isPdf) {
    const credential = admin.app().options.credential;
    const { access_token: accessToken } = await credential.getAccessToken();
    if (!accessToken) throw new Error('No se pudo obtener token para Vision API.');

    if (isPdf) {
        const response = await fetch('https://vision.googleapis.com/v1/files:annotate', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requests: [{
                    inputConfig: { content: buffer.toString('base64'), mimeType: 'application/pdf' },
                    features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
                    pages: [1, 2, 3, 4, 5],
                }]
            })
        });
        if (!response.ok) {
            const e = await response.json().catch(() => ({}));
            throw new Error(e.error?.message || 'Error en Vision API (PDF)');
        }
        const data = await response.json();
        const responses = data.responses?.[0]?.responses || [];
        const text  = responses.map(p => p?.fullTextAnnotation?.text || '').filter(Boolean).join('\n');
        const lines = reconstructLinesFromVision(responses);
        return { text, lines };
    }

    const response = await fetch('https://vision.googleapis.com/v1/images:annotate', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            requests: [{
                image: { content: buffer.toString('base64') },
                features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
                imageContext: { languageHints: ['es', 'en'] },
            }]
        })
    });
    if (!response.ok) {
        const e = await response.json().catch(() => ({}));
        throw new Error(e.error?.message || 'Error en Vision API (imagen)');
    }
    const data = await response.json();
    const text  = data.responses?.[0]?.fullTextAnnotation?.text || '';
    const lines = reconstructLinesFromVision(data.responses || []);
    return { text, lines };
}

// ── POST: subir cotización de proveedor y auto-emparejar con requerimientos ──
export async function POST(req) {
    try {
        const formData     = await req.formData();
        const listId       = formData.get('listId');
        const providerName = String(formData.get('providerName') || '').trim();
        const file         = formData.get('file');

        if (!listId || !providerName) {
            return NextResponse.json({ error: 'Faltan listId o providerName.' }, { status: 400 });
        }

        const listSnap = await firestore.collection(LISTS_COL).doc(listId).get();
        if (!listSnap.exists) return NextResponse.json({ error: 'Lista no encontrada.' }, { status: 404 });
        const reqItems = listSnap.data().items || [];

        // ── Extraer candidatos del archivo (si se envió) ──
        let candidates = [];
        let extractedText = '';
        let fileName = '';
        let currency = 'PEN';

        if (file && file.name) {
            fileName = file.name;
            const buffer = Buffer.from(await file.arrayBuffer());
            if (buffer.byteLength > 15 * 1024 * 1024) {
                return NextResponse.json({ error: 'Archivo mayor a 15 MB.' }, { status: 400 });
            }
            const lower = fileName.toLowerCase();
            const type  = file.type || '';

            if (/\.(xlsx|xlsm|xls|csv)$/.test(lower)) {
                candidates = candidatesFromXlsx(buffer);
                extractedText = candidates.map(c => c.text).join('\n');
            } else if (type === 'application/pdf' || lower.endsWith('.pdf')) {
                const { text, lines } = await extractTextWithVision(buffer, true);
                extractedText = text;
                // Filas reconstruidas por geometría; si Vision no dio geometría,
                // caemos al texto plano.
                candidates = candidatesFromText(lines.length ? lines : text);
            } else if (type.startsWith('image/') || /\.(png|jpe?g|webp|tiff?|bmp)$/.test(lower)) {
                const { text, lines } = await extractTextWithVision(buffer, false);
                extractedText = text;
                candidates = candidatesFromText(lines.length ? lines : text);
            } else {
                return NextResponse.json({ error: `Tipo de archivo no soportado: ${type || fileName}` }, { status: 400 });
            }

            if (/US\$|USD|D[OÓ]LARES/i.test(extractedText)) currency = 'USD';
        }

        // ── Emparejar cada requerimiento con la mejor línea candidata ──
        const MIN_SCORE = 0.6;
        const items = {};
        let matchedCount = 0;
        const usableCandidates = candidates.filter(c => c.prices.length > 0 && !isJunkCandidate(c));

        for (const reqItem of reqItems) {
            const reqTokens = tokenize(reqItem.name);
            let best = null;
            for (const cand of usableCandidates) {
                const score = matchScore(reqTokens, cand.norm);
                if (score >= MIN_SCORE && (!best || score > best.score)) {
                    best = { ...cand, score };
                }
            }
            if (best) {
                const inferred = inferPrices(best.prices, reqItem.quantity || 0);
                if (inferred && inferred.unitPrice >= 0.05) {
                    const score = Math.round(best.score * 100) / 100;
                    items[reqItem.n] = {
                        unitPrice: inferred.unitPrice,
                        total: inferred.total,
                        matchedText: best.text.slice(0, 160),
                        score,
                        // ⚠️ dudoso: nombre con coincidencia parcial, o varios montos sin
                        // poder verificar la pareja unitario × cantidad = total
                        uncertain: score < 0.8 || (inferred.inferred !== 'qty-pair' && new Set(best.prices).size > 2),
                        source: 'auto',
                        compliant: null, // el usuario valida cumplimiento de especificaciones
                    };
                    matchedCount++;
                }
            }
        }

        const doc = {
            listId,
            providerName,
            fileName,
            quoteNumber: extractQuoteNumber(extractedText, fileName),
            currency,
            items,
            matchedCount,
            totalItems: reqItems.length,
            extractedText: (extractedText || '').slice(0, 5000),
            notes: '',
            createdAt: new Date().toISOString(),
        };
        const ref = await firestore.collection(QUOTES_COL).add(doc);
        return NextResponse.json({ id: ref.id, ...doc });
    } catch (err) {
        console.error('[logistics/quotes POST]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
