/**
 * Migration Script: Apply Invoice-Centric Architecture
 * 
 * This script applies the database migration and migrates existing data
 * from the old associated_invoices format to the new invoice_payments table.
 * 
 * USO:
 * node server/migrations/run_migration.js
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'invoices.db');
const db = new Database(dbPath);

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║  MIGRATION: Invoice-Centric Architecture              ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

try {
    // Step 1: Read and execute migration SQL
    console.log('📄 Step 1: Applying database schema changes...');
    const migrationSQL = fs.readFileSync(
        path.join(__dirname, '001_add_payment_tracking.sql'),
        'utf8'
    );

    db.exec(migrationSQL);
    console.log('   ✅ Schema updated successfully\n');

    // Step 2: Migrate existing data from associated_invoices to invoice_payments
    console.log('📊 Step 2: Migrating existing payment data...');

    const transactions = db.prepare(`
    SELECT id, associated_invoices, amount
    FROM bank_transactions
    WHERE associated_invoices IS NOT NULL AND associated_invoices != ''
  `).all();

    console.log(`   Found ${transactions.length} transactions with associated invoices`);

    let migratedPayments = 0;
    let errors = 0;

    const insertPayment = db.prepare(`
    INSERT INTO invoice_payments (invoice_id, transaction_id, amount, notes)
    VALUES (?, ?, ?, ?)
  `);

    const getInvoiceByNumber = db.prepare(`
    SELECT id, total FROM invoices WHERE invoice_number = ?
  `);

    for (const tx of transactions) {
        try {
            let invoiceData = [];

            // Try to parse as JSON (new format)
            try {
                const parsed = JSON.parse(tx.associated_invoices);
                if (Array.isArray(parsed)) {
                    invoiceData = parsed;
                } else {
                    // Single object, wrap in array
                    invoiceData = [parsed];
                }
            } catch (e) {
                // Old format: comma-separated invoice numbers or single invoice
                const invoiceNumbers = tx.associated_invoices
                    .split(',')
                    .map(s => s.trim())
                    .filter(Boolean);

                // Distribute amount equally among invoices if multiple
                const amountPerInvoice = Math.abs(tx.amount) / invoiceNumbers.length;

                invoiceData = invoiceNumbers.map(inv => ({
                    invoice: inv,
                    amount: amountPerInvoice
                }));
            }

            // Ensure invoiceData is an array
            if (!Array.isArray(invoiceData)) {
                console.log(`   ⚠️  Skipping transaction ${tx.id}: invalid format`);
                continue;
            }

            // Process each invoice
            for (const item of invoiceData) {
                const invoiceNumber = item.invoice;
                const amount = item.amount || 0;

                // Find invoice by number
                const invoice = getInvoiceByNumber.get(invoiceNumber);

                if (invoice) {
                    // Insert payment record
                    insertPayment.run(
                        invoice.id,
                        tx.id,
                        amount > 0 ? amount : invoice.total, // Use specified amount or full invoice total
                        `Migrated from associated_invoices`
                    );
                    migratedPayments++;
                } else {
                    console.log(`   ⚠️  Invoice ${invoiceNumber} not found`);
                }
            }
        } catch (err) {
            console.error(`   ❌ Error migrating transaction ${tx.id}:`, err.message);
            errors++;
        }
    }

    console.log(`   ✅ Migrated ${migratedPayments} payment records`);
    if (errors > 0) {
        console.log(`   ⚠️  ${errors} errors encountered\n`);
    } else {
        console.log('');
    }

    // Step 3: Verify data integrity
    console.log('🔍 Step 3: Verifying data integrity...');

    const stats = db.prepare(`
    SELECT 
      COUNT(*) FILTER (WHERE payment_status = 'pending') as pending,
      COUNT(*) FILTER (WHERE payment_status = 'partial') as partial,
      COUNT(*) FILTER (WHERE payment_status = 'paid') as paid,
      COUNT(*) as total
    FROM invoices
  `).get();

    console.log(`   Total invoices: ${stats.total}`);
    console.log(`   🔴 Pending: ${stats.pending}`);
    console.log(`   🟡 Partial: ${stats.partial}`);
    console.log(`   🟢 Paid: ${stats.paid}\n`);

    // Step 4: Show sample data
    console.log('📋 Step 4: Sample migrated data...');

    const samples = db.prepare(`
    SELECT 
      i.invoice_number,
      i.total,
      i.paid_amount,
      i.remaining_amount,
      i.payment_status,
      COUNT(ip.id) as payment_count
    FROM invoices i
    LEFT JOIN invoice_payments ip ON i.id = ip.invoice_id
    WHERE i.payment_status != 'pending'
    GROUP BY i.id
    LIMIT 5
  `).all();

    console.log('');
    console.log('   Invoice      | Total    | Paid     | Remaining | Status   | Payments');
    console.log('   ' + '-'.repeat(75));

    for (const s of samples) {
        const status = s.payment_status === 'paid' ? '🟢' : '🟡';
        console.log(`   ${s.invoice_number.padEnd(12)} | $${s.total.toFixed(2).padStart(7)} | $${s.paid_amount.toFixed(2).padStart(7)} | $${s.remaining_amount.toFixed(2).padStart(8)} | ${status} ${s.payment_status.padEnd(7)} | ${s.payment_count}`);
    }

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║  ✅ MIGRATION COMPLETED SUCCESSFULLY                   ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    console.log('📝 Next Steps:');
    console.log('   1. Restart the server to load new schema');
    console.log('   2. Test the new payment registration flow');
    console.log('   3. Verify invoice status indicators in UI\n');

} catch (error) {
    console.error('\n❌ MIGRATION FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
} finally {
    db.close();
}
