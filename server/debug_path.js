const path = require('path');
const fs = require('fs');

const resolvedPath = path.join(__dirname, '..', 'depositosbanorte', 'depositos.pdf');
console.log('__dirname:', __dirname);
console.log('Resolved Path:', resolvedPath);
console.log('Exists:', fs.existsSync(resolvedPath));

try {
    const stats = fs.statSync(resolvedPath);
    console.log('Size:', stats.size);
} catch (e) {
    console.error('Error stating file:', e.message);
}
