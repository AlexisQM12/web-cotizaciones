try {
    const { PDFParse } = require('pdf-parse');
    console.log('Instanciando PDFParse...');
    const parser = new PDFParse({ data: Buffer.alloc(100) });
    console.log('PDFParse instanciado con éxito:', typeof parser);
} catch (err) {
    console.error('ERROR AL INSTANCIAR:', err);
}
