// Quick script to verify database schema
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'invoices.db'));

console.log('\n📊 Database Schema Verification\n');

// Check tables
console.log('Tables:');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
tables.forEach(t => console.log(`  - ${t.name}`));

// Check invoices columns
console.log('\nInvoices columns:');
const invoicesCols = db.prepare("PRAGMA table_info(invoices)").all();
invoicesCols.forEach(c => console.log(`  - ${c.name} (${c.type})`));

// Check invoice_payments columns
console.log('\nInvoice_payments columns:');
const paymentsCols = db.prepare("PRAGMA table_info(invoice_payments)").all();
paymentsCols.forEach(c => console.log(`  - ${c.name} (${c.type})`));

// Check stats
const stats = db.prepare(`
  SELECT 
    COUNT(*) FILTER (WHERE payment_status = 'pending') as pending,
    COUNT(*) FILTER (WHERE payment_status = 'partial') as partial,
    COUNT(*) FILTER (WHERE payment_status = 'paid') as paid,
    COUNT(*) as total
  FROM invoices
`).get();

console.log('\nInvoice Status:');
console.log(`  🔴 Pending: ${stats.pending}`);
console.log(`  🟡 Partial: ${stats.partial}`);
console.log(`  🟢 Paid: ${stats.paid}`);
console.log(`  Total: ${stats.total}\n`);

db.close();
