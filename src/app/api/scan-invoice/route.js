import { NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';
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
            const pdfData = await pdfParse(buffer);
            extractedText = pdfData.text;
        } else if (type.startsWith('image/')) {
            const worker = await createWorker('spa');
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
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

function extractTotalAmount(text) {
    const regexes = [
        /(?:IMPORTE TOTAL|TOTAL|TOTAL A PAGAR|MONTO TOTAL)[^\d]*?(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/i,
        /S\/\s*?(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/i,
        /TOTAL[^\d]*S\/\s*?(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/i
    ];
    
    for (let r of regexes) {
        const match = text.match(r);
        if (match && match[1]) {
            let str = match[1];
            if (/,/.test(str) && !/\./.test(str)) {
                str = str.replace(',', '.');
            } else if (/,/.test(str) && /\./.test(str)) {
                const lastComma = str.lastIndexOf(',');
                const lastDot = str.lastIndexOf('.');
                if (lastComma > lastDot) {
                    str = str.replace(/\./g, '').replace(',', '.');
                } else {
                    str = str.replace(/,/g, '');
                }
            } else {
                str = str.replace(/,/g, '');
            }
            const val = parseFloat(str);
            if (!isNaN(val)) return val;
        }
    }
    return null;
}
