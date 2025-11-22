const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

const pdfPath = path.join(__dirname, 'EJEMPLOS XML', 'FA0000030836.pdf');

let dataBuffer = fs.readFileSync(pdfPath);

pdf(dataBuffer).then(function (data) {
    const lines = data.text.split('\n');
    console.log('--- SEARCHING FOR NEW FIELDS IN FA0000030836.pdf ---');

    const keywords = ['receptor', 'cliente', 'rfc', 'subtotal', 'iva', 'total'];

    lines.forEach((line, index) => {
        const lowerLine = line.toLowerCase();
        if (keywords.some(k => lowerLine.includes(k))) {
            console.log(`Line ${index}: ${line}`);
            for (let i = 1; i <= 3; i++) {
                if (index + i < lines.length) console.log(`  Next +${i}: ${lines[index + i]}`);
            }
        }
    });
    console.log('----------------------------');
}).catch(function (error) {
    console.error('Error parsing PDF:', error);
});
