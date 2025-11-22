const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

async function parseBankPDF(pdfPath) {
    if (!fs.existsSync(pdfPath)) {
        throw new Error('File not found: ' + pdfPath);
    }

    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer);
    let text = data.text;

    // --- CLEANING ---
    // 1. Fix split numbers
    text = text.replace(/(?<!\/\d{4})([$\d,.-])[\r\n]+\s*([\d,.-])/g, '$1$2');
    // 2. Remove multiple spaces
    text = text.replace(/ +/g, ' ');

    // --- PARSING ---
    const dateRegex = /(\d{2}\/[A-Z][a-z]{2}\/\d{4})/g;
    const rawChunks = text.split(dateRegex);

    const rows = [];
    let nextName = rawChunks[0].trim();

    for (let i = 1; i < rawChunks.length; i += 2) {
        const date = rawChunks[i];
        let content = rawChunks[i + 1];

        if (!content) continue;

        const moneyMatches = [...content.matchAll(/(\$-?[\d,]+\.\d{2})/g)];

        if (moneyMatches.length >= 2) {
            const balanceMatch = moneyMatches[moneyMatches.length - 1];
            const amountMatch = moneyMatches[moneyMatches.length - 2];

            const balance = parseFloat(balanceMatch[0].replace(/[$,]/g, ''));
            const amount = parseFloat(amountMatch[0].replace(/[$,]/g, ''));

            const balanceIndex = content.lastIndexOf(balanceMatch[0]);
            const mainContent = content.substring(0, balanceIndex).trim();
            const potentialNextName = content.substring(balanceIndex + balanceMatch[0].length).trim();

            const amountIndex = mainContent.lastIndexOf(amountMatch[0]);
            let description = mainContent.substring(0, amountIndex).trim();
            description = description.replace(/\s+/g, ' ');

            // --- EXTRACTION OF SPECIFIC FIELDS ---

            // Beneficiary: "DEL CLIENTE ... DE" or "BENEF:... ("
            let beneficiary = "";
            const clientMatch = description.match(/DEL CLIENTE (.*?) (?:DE|CON RFC)/);
            if (clientMatch) {
                beneficiary = clientMatch[1];
            } else {
                const benefMatch = description.match(/BENEF:(.*?) \(/);
                if (benefMatch) {
                    beneficiary = benefMatch[1];
                }
            }

            // Tracking Key: "CVE RAST: ..."
            let trackingKey = "";
            const trackMatch = description.match(/CVE RAST:? (.*?) (?:\s|$)/);
            if (trackMatch) {
                trackingKey = trackMatch[1];
            }

            // Associated Invoices: "F-123" or "f 123 456"
            let invoices = [];
            // Case 1: F-12345
            const fDashMatches = [...description.matchAll(/[Ff]-(\d+)/g)];
            fDashMatches.forEach(m => invoices.push(m[1]));

            // Case 2: f 12345 67890 (often followed by CVE RAST or end)
            // This is harder because it captures multiple numbers.
            // Let's look for "f " followed by numbers.
            const fSpaceMatch = description.match(/ f ((?:\d+\s*)+)/);
            if (fSpaceMatch) {
                const nums = fSpaceMatch[1].split(/\s+/).filter(n => n.length > 3); // Filter small numbers?
                invoices.push(...nums);
            }

            // Deduplicate
            const uniqueInvoices = [...new Set(invoices)].join(', ');

            // ONLY ADD IF AMOUNT IS POSITIVE (DEPOSIT)
            if (amount > 0) {
                rows.push({
                    date: date,
                    agent: nextName, // The name appearing BEFORE this transaction block
                    description: description,
                    amount: amount,
                    balance: balance,
                    beneficiary: beneficiary.trim(),
                    tracking_key: trackingKey.trim(),
                    associated_invoices: uniqueInvoices
                });
            }

            nextName = potentialNextName;
        }
    }

    return rows;
}

module.exports = { parseBankPDF };
