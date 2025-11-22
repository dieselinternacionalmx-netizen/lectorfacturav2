const db = require('./database');
const { parseBankPDF } = require('./parse_bank_pdf');
const path = require('path');

async function run() {
    try {
        const bankPdfPath = path.join(__dirname, '..', 'depositosbanorte', 'depositos.pdf');
        console.log("Scanning:", bankPdfPath);

        const transactions = await parseBankPDF(bankPdfPath);
        console.log(`Found ${transactions.length} transactions.`);

        const insertStmt = db.prepare(`
            INSERT INTO bank_transactions (date, agent, description, amount, balance, beneficiary, tracking_key, associated_invoices)
            VALUES (@date, @agent, @description, @amount, @balance, @beneficiary, @tracking_key, @associated_invoices)
        `);

        const deleteStmt = db.prepare('DELETE FROM bank_transactions');
        deleteStmt.run();
        console.log("Cleared old data.");

        let count = 0;
        const transaction = db.transaction((txs) => {
            for (const tx of txs) {
                insertStmt.run(tx);
                count++;
            }
        });

        transaction(transactions);
        console.log(`Inserted ${count} rows.`);

    } catch (error) {
        console.error("Error:", error);
    }
}

run();
