const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

async function parseInvoice(filePath) {
    const dataBuffer = fs.readFileSync(filePath);

    try {
        const data = await pdf(dataBuffer);
        const text = data.text;
        const lines = text.split('\n');

        let agent = 'Unknown';
        let client = '';
        let rfc = '';
        let subtotal = 0.0;
        let iva = 0.0;
        let invoiceNumber = '';
        let date = '';
        let total = 0.0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const lowerLine = line.toLowerCase();

            // Agente
            if (lowerLine.includes('agente:')) {
                if (i + 5 < lines.length) {
                    agent = lines[i + 5].trim();
                }
            }

            // Cliente
            if (lowerLine === 'cliente:') {
                if (i + 1 < lines.length) {
                    client = lines[i + 1].trim();
                }
            }

            // RFC
            if (lowerLine === 'rfc:') {
                if (i + 1 < lines.length) {
                    let rfcLine = lines[i + 1].trim();
                    if (rfcLine.includes('Uso CFDI')) {
                        rfc = rfcLine.split('Uso CFDI')[0].trim();
                    } else {
                        rfc = rfcLine;
                    }
                }
            }

            // Subtotal (Logic: "Total con letra:" -> Next + 1)
            if (lowerLine.includes('total con letra:')) {
                if (i + 1 < lines.length) {
                    let val = lines[i + 1].trim().replace('$', '').replace(',', '');
                    subtotal = parseFloat(val) || 0.0;
                }
            }

            // IVA (Logic: "Subtotal:" -> Next + 2)
            if (lowerLine === 'subtotal:') {
                if (i + 2 < lines.length) {
                    let val = lines[i + 2].trim().replace('$', '').replace(',', '');
                    iva = parseFloat(val) || 0.0;
                }
            }

            // Total (Logic: "Total:" -> Next + 1)
            if (lowerLine === 'total:') {
                if (i + 1 < lines.length) {
                    let val = lines[i + 1].trim().replace('$', '').replace(',', '');
                    total = parseFloat(val) || 0.0;
                }
            }
        }

        // Fallback for Invoice Number and Date if not found in loop (using Regex)
        if (!invoiceNumber) {
            const invoiceMatch = text.match(/A\s+(\d+)/);
            if (invoiceMatch) invoiceNumber = invoiceMatch[1];
        }
        if (!date) {
            const dateMatch = text.match(/(\d{2}\/[A-Za-z]{3}\/\d{4})/);
            if (dateMatch) date = dateMatch[1];
        }

        return {
            filename: path.basename(filePath),
            invoice_number: invoiceNumber,
            date: date,
            agent: agent,
            client: client || 'Unknown',
            rfc: rfc || 'Unknown',
            subtotal: subtotal || 0.0,
            iva: iva || 0.0,
            total: total || 0.0,
            raw_text: text
        };

    } catch (error) {
        console.error(`Error parsing ${filePath}:`, error);
        return null;
    }
}

module.exports = { parseInvoice };
