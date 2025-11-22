const path = require('path');
const fs = require('fs');

try {
    console.log("Attempting to require ./parse_bank_pdf...");
    const { parseBankPDF } = require('./parse_bank_pdf');
    console.log("Require successful.");

    const pdfPath = path.join(__dirname, '..', 'depositosbanorte', 'depositos.pdf');
    console.log("Parsing:", pdfPath);

    parseBankPDF(pdfPath).then(rows => {
        console.log(`Success! Parsed ${rows.length} rows.`);
        if (rows.length > 0) {
            console.log("First row:", rows[0]);
        } else {
            console.log("WARNING: 0 rows returned.");
        }

        // Check for negatives
        const negatives = rows.filter(r => r.amount < 0);
        if (negatives.length > 0) {
            console.log("WARNING: Found negative amounts:", negatives.length);
        } else {
            console.log("Verified: No negative amounts found.");
        }

    }).catch(err => {
        console.error("Error during parsing:", err);
    });

} catch (e) {
    console.error("Error requiring module:", e);
}
