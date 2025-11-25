/**
 * Data Migration Script: SQLite → Supabase PostgreSQL
 * Uses 'sqlite3' instead of 'better-sqlite3'
 */

const sqlite3 = require('sqlite3').verbose();
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// ============================================
// CONFIGURACIÓN
// ============================================

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://sckksmidfhsrqagxxzwd.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNja2tzbWlkZmhzcnFhZ3h4endkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzgyNDk0OSwiZXhwIjoyMDc5NDAwOTQ5fQ.qDgxUIMoBDQYUWH5ediUb9JDTaxa_KpfGvRj-MOslSg';

// Inicializar clientes
const dbPath = path.join(__dirname, 'server', 'invoices.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Helper to promisify sqlite queries
function query(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

// ============================================
// FUNCIONES DE MIGRACIÓN
// ============================================

async function migrateInvoices() {
    console.log('\n📄 Migrando facturas...');

    const invoices = await query('SELECT * FROM invoices');
    console.log(`   Encontradas ${invoices.length} facturas`);

    let migrated = 0;
    let errors = 0;

    for (const invoice of invoices) {
        try {
            const { error } = await supabase
                .from('invoices')
                .insert({
                    filename: invoice.filename,
                    invoice_number: invoice.invoice_number,
                    date: invoice.date,
                    agent: invoice.agent,
                    client: invoice.client,
                    rfc: invoice.rfc,
                    subtotal: invoice.subtotal,
                    iva: invoice.iva,
                    total: invoice.total,
                    raw_text: invoice.raw_text,
                    pdf_url: null,
                    created_at: invoice.created_at || new Date().toISOString()
                });

            if (error) {
                // Ignore duplicate key errors (already migrated)
                if (error.code === '23505') {
                    migrated++;
                } else {
                    console.error(`   ❌ Error en factura ${invoice.filename}:`, error.message);
                    errors++;
                }
            } else {
                migrated++;
                process.stdout.write(`\r   Migradas: ${migrated}/${invoices.length}`);
            }
        } catch (err) {
            console.error(`   ❌ Error inesperado en ${invoice.filename}:`, err.message);
            errors++;
        }
    }

    console.log(`\n   ✅ Migradas: ${migrated} | ❌ Errores: ${errors}`);
    return { migrated, errors };
}

async function migrateBankTransactions() {
    console.log('\n💰 Migrando depósitos bancarios...');

    const transactions = await query('SELECT * FROM bank_transactions');
    console.log(`   Encontrados ${transactions.length} depósitos`);

    let migrated = 0;
    let errors = 0;

    for (const tx of transactions) {
        try {
            let associatedInvoices = tx.associated_invoices;
            if (typeof associatedInvoices === 'string') {
                try {
                    associatedInvoices = JSON.parse(associatedInvoices);
                } catch (e) { }
            }

            const { error } = await supabase
                .from('bank_transactions')
                .insert({
                    date: tx.date,
                    agent: tx.agent,
                    description: tx.description,
                    amount: tx.amount,
                    balance: tx.balance,
                    beneficiary: tx.beneficiary,
                    tracking_key: tx.tracking_key,
                    associated_invoices: associatedInvoices,
                    created_at: tx.created_at || new Date().toISOString()
                });

            if (error) {
                if (error.code === '23505') {
                    migrated++;
                } else {
                    console.error(`   ❌ Error en depósito ${tx.id}:`, error.message);
                    errors++;
                }
            } else {
                migrated++;
                process.stdout.write(`\r   Migrados: ${migrated}/${transactions.length}`);
            }
        } catch (err) {
            console.error(`   ❌ Error inesperado en depósito ${tx.id}:`, err.message);
            errors++;
        }
    }

    console.log(`\n   ✅ Migrados: ${migrated} | ❌ Errores: ${errors}`);
    return { migrated, errors };
}

async function uploadPDFs() {
    console.log('\n📎 Subiendo PDFs a Supabase Storage...');

    const pdfDir = path.join(__dirname, 'FACTURAS_PDF');

    if (!fs.existsSync(pdfDir)) {
        console.log('   ⚠️  Carpeta FACTURAS_PDF no encontrada, saltando...');
        return { uploaded: 0, errors: 0 };
    }

    const files = fs.readdirSync(pdfDir).filter(f => f.toLowerCase().endsWith('.pdf'));
    console.log(`   Encontrados ${files.length} PDFs`);

    let uploaded = 0;
    let errors = 0;

    for (const file of files) {
        try {
            const filePath = path.join(pdfDir, file);
            const fileBuffer = fs.readFileSync(filePath);

            // Obtener agente
            const { data: invoice } = await supabase
                .from('invoices')
                .select('agent')
                .eq('filename', file)
                .single();

            const agent = invoice?.agent || 'GENERAL';
            const storagePath = `pdfs/${file}`; // Use simple path for now to match policy

            const { error: uploadError } = await supabase.storage
                .from('invoices')
                .upload(storagePath, fileBuffer, {
                    contentType: 'application/pdf',
                    upsert: true
                });

            if (uploadError) {
                console.error(`   ❌ Error subiendo ${file}:`, uploadError.message);
                errors++;
            } else {
                const { data: { publicUrl } } = supabase.storage
                    .from('invoices')
                    .getPublicUrl(storagePath);

                await supabase
                    .from('invoices')
                    .update({ pdf_url: publicUrl })
                    .eq('filename', file);

                uploaded++;
                process.stdout.write(`\r   Subidos: ${uploaded}/${files.length}`);
            }
        } catch (err) {
            console.error(`   ❌ Error inesperado con ${file}:`, err.message);
            errors++;
        }
    }

    console.log(`\n   ✅ Subidos: ${uploaded} | ❌ Errores: ${errors}`);
    return { uploaded, errors };
}

async function main() {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║  MIGRACIÓN DE DATOS: SQLite → Supabase PostgreSQL     ║');
    console.log('╚════════════════════════════════════════════════════════╝');

    try {
        const invoicesResult = await migrateInvoices();
        const transactionsResult = await migrateBankTransactions();
        const pdfsResult = await uploadPDFs();

        console.log('\n✨ Migración completada!');

    } catch (error) {
        console.error('\n❌ Error fatal:', error);
    } finally {
        db.close();
    }
}

main();
