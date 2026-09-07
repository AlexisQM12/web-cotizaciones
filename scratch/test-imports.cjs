try {
    console.log('Cargando pdf-parse...');
    const pdfParse = require('pdf-parse');
    console.log('pdf-parse cargado:', typeof pdfParse, Object.keys(pdfParse));

    console.log('Cargando pdfjs-dist...');
    // Probamos importación dinámica
    import('pdfjs-dist/legacy/build/pdf.mjs').then(pdfjs => {
        console.log('pdfjs-dist mjs cargado con éxito:', typeof pdfjs);
    }).catch(err => {
        console.error('Error cargando pdfjs-dist mjs:', err);
    });

} catch (err) {
    console.error('ERROR EN IMPORTACIÓN:', err);
}
