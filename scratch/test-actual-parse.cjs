const { PDFParse } = require('pdf-parse');
const fs = require('fs');
const path = require('path');

async function test() {
    try {
        console.log('Creando buffer vacío...');
        const buffer = Buffer.alloc(100);
        const parser = new PDFParse({ data: buffer });
        console.log('Llamando a getText()...');
        const text = await parser.getText();
        console.log('Resultado de getText:', text);
    } catch (err) {
        console.error('ERROR AL PARSEAR:', err);
    }
}

test();
