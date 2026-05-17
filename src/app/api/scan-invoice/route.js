import { NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';
import { createWorker } from 'tesseract.js';

export async function POST(req) {
    try {
        const data = await req.formData();
        const file = data.get('file');

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const type = file.type;
        
        let extractedText = '';

        if (type === 'application/pdf') {
            const parser = new PDFParse({ data: buffer });
            const pdfData = await parser.getText();
            extractedText = pdfData;
        } else if (type.startsWith('image/')) {
            const path = require('path');
            const workerPath = path.join(process.cwd(), 'node_modules', 'tesseract.js', 'src', 'worker-script', 'node', 'index.js');
            const corePath   = path.join(process.cwd(), 'node_modules', 'tesseract.js-core', 'tesseract-core-simd.wasm.js');
            const worker = await createWorker('spa', 1, {
                workerPath,
                corePath
            });
            const ret = await worker.recognize(buffer);
            extractedText = ret.data.text;
            await worker.terminate();
        } else {
            return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
        }

        const amount = extractTotalAmount(extractedText);

        return NextResponse.json({ amount, text: extractedText });
    } catch (err) {
        console.error("Error scanning invoice:", err);
        return NextResponse.json({ error: err ? err.toString() : 'Unknown error' }, { status: 500 });
    }
}

function extractTotalAmount(text) {
    // Normalize spaces and newlines
    const normalized = text.toUpperCase().replace(/\s+/g, ' ');
    
    // Attempt 1: Keywords
    const keywordRegex = /(?:IMPORTE TOTAL|TOTAL A PAGAR|TOTAL COMPROBANTE|IMPORTE DE LA OPERACION|IMPORTE|TOTAL)[^\d]{0,25}?(\d{1,6}(?:[.,\s]\d{3})*(?:[.,]\d{1,2}))/g;
    let matches = [...normalized.matchAll(keywordRegex)];
    if (matches.length > 0) {
        // Usually the grand total is the last mention
        return parseNumberString(matches[matches.length - 1][1]);
    }
    
    // Attempt 2: Currency symbol S/
    const currencyRegex = /S\/\s*?(\d{1,6}(?:[.,\s]\d{3})*(?:[.,]\d{1,2}))/g;
    matches = [...normalized.matchAll(currencyRegex)];
    if (matches.length > 0) {
        return parseNumberString(matches[matches.length - 1][1]);
    }

    // Attempt 3: PEN currency code
    const penRegex = /PEN[^\d]{0,10}?(\d{1,6}(?:[.,\s]\d{3})*(?:[.,]\d{1,2}))/g;
    matches = [...normalized.matchAll(penRegex)];
    if (matches.length > 0) {
        return parseNumberString(matches[matches.length - 1][1]);
    }

    return null;
}

function parseNumberString(str) {
    // Remove all spaces (e.g. "1 500.00" -> "1500.00")
    let cleanStr = str.replace(/\s+/g, '');
    
    if (/,/.test(cleanStr) && !/\./.test(cleanStr)) {
        cleanStr = cleanStr.replace(',', '.');
    } else if (/,/.test(cleanStr) && /\./.test(cleanStr)) {
        const lastComma = cleanStr.lastIndexOf(',');
        const lastDot = cleanStr.lastIndexOf('.');
        if (lastComma > lastDot) {
            cleanStr = cleanStr.replace(/\./g, '').replace(',', '.');
        } else {
            cleanStr = cleanStr.replace(/,/g, '');
        }
    } else {
        cleanStr = cleanStr.replace(/,/g, '');
    }
    const val = parseFloat(cleanStr);
    return isNaN(val) ? null : val;
}
