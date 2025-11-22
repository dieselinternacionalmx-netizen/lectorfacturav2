const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

const pdfPath = path.join(__dirname, 'depositosbanorte', 'depositos.pdf');

let dataBuffer = fs.readFileSync(pdfPath);

pdf(dataBuffer).then(function (data) {
    console.log('='.repeat(80));
    console.log('ANÁLISIS DEL ARCHIVO: depositosbanorte/depositos.pdf');
    console.log('='.repeat(80));
    console.log('\n--- TEXTO COMPLETO EXTRAÍDO ---\n');
    console.log(data.text);
    console.log('\n' + '='.repeat(80));
    console.log('TOTAL DE PÁGINAS:', data.numpages);
    console.log('TOTAL DE CARACTERES:', data.text.length);
    console.log('='.repeat(80));
}).catch(function (error) {
    console.error('Error parsing PDF:', error);
});
