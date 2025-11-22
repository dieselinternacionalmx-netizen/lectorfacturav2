const db = require('./database');

try {
    const negatives = db.prepare('SELECT count(*) as count FROM bank_transactions WHERE amount < 0').get();
    const total = db.prepare('SELECT count(*) as count FROM bank_transactions').get();

    console.log(`Total transactions: ${total.count}`);
    console.log(`Negative transactions: ${negatives.count}`);

    if (negatives.count > 0) {
        const sample = db.prepare('SELECT * FROM bank_transactions WHERE amount < 0 LIMIT 1').get();
        console.log('Sample negative:', sample);
    }
} catch (error) {
    console.error("Error checking DB:", error);
}
