/**
 * Data Migration Script: Local API → Supabase PostgreSQL
 * 
 * Bypasses SQLite file lock by using the running server's API.
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// ============================================
// CONFIGURACIÓN
// ============================================

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://sckksmidfhsrqagxxzwd.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNja2tzbWlkZmhzcnFhZ3h4endkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzgyNDk0OSwiZXhwIjoyMDc5NDAwOTQ5fQ.qDgxUIMoBDQYUWH5ediUb9JDTaxa_KpfGvRj-MOslSg';
const LOCAL_API_URL = 'http://localhost:3000/api';

// Inicializar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Helper para parsear fechas en español (DD/MMM/YYYY -> YYYY-MM-DD)
function parseSpanishDate(dateStr) {
    if (!dateStr) return null;

    // Si ya es ISO, devolver tal cual
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;

    const months = {
        'Ene': '01', 'Feb': '02', 'Mar': '03', 'Abr': '04', 'May': '05', 'Jun': '06',
        'Jul': '07', 'Ago': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dic': '12',
        'Jan': '01', 'Apr': '04', 'Aug': '08', 'Dec': '12' // English fallbacks just in case
    };

    // Formato DD/MMM/YYYY (ej: 20/Ene/2025)
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const monthStr = parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase(); // Capitalize
        const month = months[monthStr.substring(0, 3)] || '01';
        const year = parts[2];
        return `${year}-${month}-${day}`;
    }

    return dateStr; // Fallback
}

// ============================================
// FUNCIONES DE MIGRACIÓN
// ============================================

async function migrateInvoices() {
    console.log('\n📄 Migrando facturas desde API local...');

    try {
        const response = await fetch(`${LOCAL_API_URL}/invoices`);
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);

        const invoices = await response.json();
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
                        date: parseSpanishDate(invoice.date),
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
                    if (error.code === '23505') { // Duplicate key
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
    } catch (error) {
        console.error('   ❌ Error obteniendo facturas:', error.message);
        return { migrated: 0, errors: 1 };
    }
}

async function migrateBankTransactions() {
    console.log('\n💰 Migrando depósitos bancarios desde API local...');

    try {
        const response = await fetch(`${LOCAL_API_URL}/bank-transactions`);
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);

        const transactions = await response.json();
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
    } catch (error) {
        console.error('   ❌ Error obteniendo depósitos:', error.message);
        return { migrated: 0, errors: 1 };
    }
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
            const storagePath = `pdfs/${file}`; // Use simple path for now

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
    console.log('║  MIGRACIÓN DE DATOS: API Local → Supabase PostgreSQL  ║');
    console.log('╚════════════════════════════════════════════════════════╝');

    try {
        const invoicesResult = await migrateInvoices();
        const transactionsResult = await migrateBankTransactions();
        const pdfsResult = await uploadPDFs();

        console.log('\n✨ Migración completada!');

    } catch (error) {
        console.error('\n❌ Error fatal:', error);
    }
}

main();
