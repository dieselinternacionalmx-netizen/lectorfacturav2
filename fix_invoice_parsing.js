// Script to fix invoice number extraction for CFDI files
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'client', 'src', 'api_upload.js');
let content = fs.readFileSync(filePath, 'utf8');

// Find and replace the parseInvoiceData function
const oldCode = `function parseInvoiceData(text, filename) {
    // Extract invoice number
    const invoiceMatch = text.match(/(?:Factura|FACTURA|Invoice|INVOICE)[:\\s#]*([A-Z0-9-]+)/i);
    const invoiceNumber = invoiceMatch ? invoiceMatch[1].trim() : filename.replace('.pdf', '');`;

const newCode = `function parseInvoiceData(text, filename) {
    // Extract invoice number from PDF text first
    let invoiceNumber = null;
    
    // Try to find invoice number in the PDF text
    const invoiceMatch = text.match(/(?:Factura|FACTURA|Invoice|INVOICE|Folio)[:\\s#]*([A-Z0-9-]+)/i);
    if (invoiceMatch) {
        invoiceNumber = invoiceMatch[1].trim();
    }
    
    // If not found in text, try to extract from filename
    if (!invoiceNumber || invoiceNumber === filename.replace('.pdf', '')) {
        // Pattern for CFDI filenames: CFDI_FACTURA_CREDITO_4.0_A_30475 -> 30475
        const cfdiMatch = filename.match(/[_A](\\d{5,})/);
        if (cfdiMatch) {
            invoiceNumber = cfdiMatch[1];
        } else {
            // Try to find any number sequence in the filename
            const numberMatch = filename.match(/(\\d{4,})/);
            if (numberMatch) {
                invoiceNumber = numberMatch[1];
            } else {
                // Last resort: use filename without extension
                invoiceNumber = filename.replace('.pdf', '');
            }
        }
    }`;

content = content.replace(oldCode, newCode);
fs.writeFileSync(filePath, content, 'utf8');
console.log('✓ Fixed invoice number extraction');
