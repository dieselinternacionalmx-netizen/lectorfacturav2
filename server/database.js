const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'invoices.db');
const db = new Database(dbPath);

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT UNIQUE,
    invoice_number TEXT,
    date TEXT,
    agent TEXT,
    client TEXT,
    rfc TEXT,
    subtotal REAL,
    iva REAL,
    total REAL,
    raw_text TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS bank_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    agent TEXT,
    description TEXT,
    amount REAL,
    balance REAL,
    beneficiary TEXT,
    tracking_key TEXT,
    associated_invoices TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migration helper (simple version for dev)
const runMigration = (sql) => {
  try {
    db.exec(sql);
  } catch (err) {
    // Ignore error if column exists
  }
};

runMigration("ALTER TABLE invoices ADD COLUMN client TEXT");
runMigration("ALTER TABLE invoices ADD COLUMN rfc TEXT");
runMigration("ALTER TABLE invoices ADD COLUMN subtotal REAL");
runMigration("ALTER TABLE invoices ADD COLUMN iva REAL");
runMigration("ALTER TABLE bank_transactions ADD COLUMN associated_invoices TEXT");

module.exports = db;
