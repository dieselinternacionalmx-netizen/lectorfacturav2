/**
 * Data Migration Script: SQLite → Supabase PostgreSQL
 * 
 * Este script migra los datos existentes de la base de datos local
 * SQLite a Supabase PostgreSQL manteniendo la integridad de los datos.
 * 
 * PREREQUISITOS:
 * 1. Proyecto Supabase creado
 * 2. Schema.sql ejecutado en Supabase
 * 3. Variables de entorno configuradas
 * 
 * USO:
 * node migrate_to_supabase.js
 */

const Database = require('better-sqlite3');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// ============================================
// CONFIGURACIÓN
// ============================================

// Supabase credentials (obtener de Supabase Dashboard)
const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'YOUR_SERVICE_KEY';

// Validar configuración
if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_SERVICE_KEY === 'YOUR_SERVICE_KEY') {
    console.error('❌ Error: Configura las variables de entorno SUPABASE_URL y SUPABASE_SERVICE_KEY');
    console.log('\nEjemplo:');
    console.log('  set SUPABASE_URL=https://xxx.supabase.co');
    console.log('  set SUPABASE_SERVICE_KEY=eyJxxx...');
    console.log('  node migrate_to_supabase.js');
    process.exit(1);
}

// Inicializar clientes
const sqlite = new Database(path.join(__dirname, 'server', 'invoices.db'));
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================
// FUNCIONES DE MIGRACIÓN
// ============================================

async function migrateInvoices() {
    console.log('\n📄 Migrando facturas...');

    const invoices = sqlite.prepare('SELECT * FROM invoices').all();
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
                    pdf_url: null, // Se actualizará después de subir PDFs
                    created_at: invoice.created_at || new Date().toISOString()
                });

            if (error) {
                console.error(`   ❌ Error en factura ${invoice.filename}:`, error.message);
                errors++;
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

    const transactions = sqlite.prepare('SELECT * FROM bank_transactions').all();
    console.log(`   Encontrados ${transactions.length} depósitos`);

    let migrated = 0;
    let errors = 0;

    for (const tx of transactions) {
        try {
            // Parsear associated_invoices si es JSON string
            let associatedInvoices = tx.associated_invoices;
            if (typeof associatedInvoices === 'string') {
                try {
                    associatedInvoices = JSON.parse(associatedInvoices);
                } catch (e) {
                    // Si no es JSON válido, mantener como string
                }
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
                console.error(`   ❌ Error en depósito ${tx.id}:`, error.message);
                errors++;
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

            // Obtener agente de la factura
            const invoice = await supabase
                .from('invoices')
                .select('agent')
                .eq('filename', file)
                .single();

            const agent = invoice.data?.agent || 'GENERAL';
            const storagePath = `${agent}/${file}`;

            // Subir a Supabase Storage
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
                // Actualizar URL en la tabla invoices
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

async function createAdminUser() {
    console.log('\n👤 Configuración de usuario admin...');
    console.log('   ⚠️  IMPORTANTE: Debes crear el usuario admin manualmente en Supabase Auth');
    console.log('   1. Ve a Supabase Dashboard → Authentication → Users');
    console.log('   2. Crea un nuevo usuario con email y contraseña');
    console.log('   3. Copia el UUID del usuario');
    console.log('   4. Ejecuta este comando SQL en Supabase SQL Editor:');
    console.log('');
    console.log('      INSERT INTO user_profiles (user_id, email, full_name, role)');
    console.log('      VALUES (');
    console.log('        \'UUID-DEL-USUARIO\',');
    console.log('        \'admin@diesel.com\',');
    console.log('        \'Administrador\',');
    console.log('        \'admin\'');
    console.log('      );');
    console.log('');
}

// ============================================
// EJECUCIÓN PRINCIPAL
// ============================================

async function main() {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║  MIGRACIÓN DE DATOS: SQLite → Supabase PostgreSQL     ║');
    console.log('╚════════════════════════════════════════════════════════╝');

    try {
        // Verificar conexión a Supabase
        console.log('\n🔌 Verificando conexión a Supabase...');
        const { data, error } = await supabase.from('invoices').select('count').limit(1);
        if (error) {
            console.error('❌ Error conectando a Supabase:', error.message);
            console.log('\n💡 Asegúrate de:');
            console.log('   1. Haber ejecutado schema.sql en Supabase SQL Editor');
            console.log('   2. Tener las credenciales correctas');
            process.exit(1);
        }
        console.log('   ✅ Conexión exitosa');

        // Ejecutar migraciones
        const invoicesResult = await migrateInvoices();
        const transactionsResult = await migrateBankTransactions();
        const pdfsResult = await uploadPDFs();

        // Resumen
        console.log('\n╔════════════════════════════════════════════════════════╗');
        console.log('║  RESUMEN DE MIGRACIÓN                                  ║');
        console.log('╚════════════════════════════════════════════════════════╝');
        console.log(`\n📄 Facturas:        ${invoicesResult.migrated} migradas, ${invoicesResult.errors} errores`);
        console.log(`💰 Depósitos:       ${transactionsResult.migrated} migrados, ${transactionsResult.errors} errores`);
        console.log(`📎 PDFs:            ${pdfsResult.uploaded} subidos, ${pdfsResult.errors} errores`);

        const totalSuccess = invoicesResult.migrated + transactionsResult.migrated + pdfsResult.uploaded;
        const totalErrors = invoicesResult.errors + transactionsResult.errors + pdfsResult.errors;

        console.log(`\n${'='.repeat(60)}`);
        console.log(`✅ TOTAL EXITOSO:   ${totalSuccess}`);
        console.log(`❌ TOTAL ERRORES:   ${totalErrors}`);
        console.log(`${'='.repeat(60)}`);

        // Instrucciones para admin
        await createAdminUser();

        console.log('\n✨ Migración completada!');
        console.log('\n📝 PRÓXIMOS PASOS:');
        console.log('   1. Crear usuario admin en Supabase Auth');
        console.log('   2. Insertar perfil de admin en user_profiles');
        console.log('   3. Configurar variables de entorno en Vercel');
        console.log('   4. Desplegar aplicación Next.js');

    } catch (error) {
        console.error('\n❌ Error fatal durante la migración:', error);
        process.exit(1);
    } finally {
        sqlite.close();
    }
}

// Ejecutar
main();
