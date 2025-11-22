const db = require('./database');

console.log('--- Checking Database Schema ---');
const tableInfo = db.pragma('table_info(bank_transactions)');
console.log('Columns in bank_transactions:');
tableInfo.forEach(col => console.log(`- ${col.name} (${col.type})`));

const hasAssoc = tableInfo.some(col => col.name === 'associated_invoices');
console.log(`\nHas 'associated_invoices' column? ${hasAssoc ? 'YES' : 'NO'}`);

console.log('\n--- Checking Recent Transactions ---');
const rows = db.prepare('SELECT id, agent, associated_invoices FROM bank_transactions ORDER BY id DESC LIMIT 5').all();
console.log(rows);

console.log('\n--- Done ---');
