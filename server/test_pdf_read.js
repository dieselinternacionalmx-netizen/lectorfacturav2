const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

const pdfPath = path.join(__dirname, '../depositosbanorte/depositos.pdf');

if (!fs.existsSync(pdfPath)) {
    console.error('File not found:', pdfPath);
    process.exit(1);
}

const dataBuffer = fs.readFileSync(pdfPath);

pdf(dataBuffer).then(function (data) {
    console.log('Number of pages:', data.numpages);
    console.log('Info:', data.info);
    console.log('------------------ TEXT CONTENT START ------------------');
    console.log(data.text.substring(0, 500)); // Print first 500 chars
    console.log('------------------ TEXT CONTENT END ------------------');
}).catch(function (error) {
    console.error('Error parsing PDF:', error);
});
