const db = require('./database');

try {
    const invoiceCount = db.prepare('SELECT count(*) as count FROM invoices').get();
    const bankCount = db.prepare('SELECT count(*) as count FROM bank_transactions').get();

    console.log(`Invoices: ${invoiceCount.count}`);
    console.log(`Bank Transactions: ${bankCount.count}`);
} catch (error) {
    console.error("Error counting rows:", error);
}
