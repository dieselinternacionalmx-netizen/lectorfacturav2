import { supabase } from './supabase';

// PDF.js will be loaded from CDN/local file in index.html
// const pdfjsLib = window.pdfjsLib;

/**
 * Extract text from PDF file
 */
async function extractTextFromPDF(file) {
    const pdfjsLib = window.pdfjsLib;

    // Ensure worker is configured
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
    }

    return fullText;
}

/**
 * Parse invoice data from text
 */
function parseInvoiceData(text, filename) {
    // Extract invoice number
    const invoiceMatch = text.match(/(?:Factura|FACTURA|Invoice|INVOICE)[:\s#]*([A-Z0-9-]+)/i);
    const invoiceNumber = invoiceMatch ? invoiceMatch[1].trim() : filename.replace('.pdf', '');

    // Extract date
    const dateMatch = text.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})|(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/);
    let date = dateMatch ? dateMatch[0] : null;

    // Normalize date to YYYY-MM-DD if possible
    if (date) {
        try {
            const parts = date.split(/[-\/]/);
            if (parts[0].length === 4) {
                // YYYY-MM-DD
                date = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
            } else {
                // DD-MM-YYYY
                date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
        } catch (e) {
            console.warn('Date parsing error:', e);
        }
    }

    // Extract agent
    const agentPatterns = ['ANDRES', 'JUAN DIOS', 'JUAN_DIOS', 'CARLOS', 'MARIA'];
    let agent = null;
    for (const pattern of agentPatterns) {
        if (text.toUpperCase().includes(pattern)) {
            agent = pattern.replace('_', ' ');
            break;
        }
    }

    // Extract client
    const clientMatch = text.match(/(?:Cliente|Razón Social|CLIENTE|RAZÓN SOCIAL)[:\s]+([^\n]+)/i);
    const client = clientMatch ? clientMatch[1].trim() : null;

    // Extract RFC
    const rfcMatch = text.match(/RFC[:\s]+([A-Z0-9]{12,13})/i);
    const rfc = rfcMatch ? rfcMatch[1].trim() : null;

    // Extract amounts
    const subtotalMatch = text.match(/(?:Subtotal|SUBTOTAL)[:\s$]*([0-9,]+\.?\d{0,2})/i);
    const subtotal = subtotalMatch ? parseFloat(subtotalMatch[1].replace(/,/g, '')) : 0;

    const ivaMatch = text.match(/(?:IVA|I\.V\.A\.)[:\s$]*([0-9,]+\.?\d{0,2})/i);
    const iva = ivaMatch ? parseFloat(ivaMatch[1].replace(/,/g, '')) : 0;

    const totalMatch = text.match(/(?:Total|TOTAL)[:\s$]*([0-9,]+\.?\d{0,2})/i);
    const total = totalMatch ? parseFloat(totalMatch[1].replace(/,/g, '')) : subtotal + iva;

    return {
        invoice_number: invoiceNumber,
        date,
        agent,
        client,
        rfc,
        subtotal,
        iva,
        total
    };
}

/**
 * Parse bank transactions from text
 */
function parseBankTransactions(text) {
    const transactions = [];
    const lines = text.split('\n');

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        // Date
        const dateMatch = trimmedLine.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
        if (!dateMatch) continue;

        // Convert DD/MM/YYYY to YYYY-MM-DD
        const [day, month, year] = dateMatch[1].split('/');
        const date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

        // Description
        const descMatch = trimmedLine.match(/(SPEI|TRANSFERENCIA|DEPOSITO)[^\$]*/i);
        const description = descMatch ? descMatch[0].trim() : '';

        // Amount
        const amountMatch = trimmedLine.match(/\$\s*([0-9,]+\.?\d{0,2})/);
        const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;

        if (amount > 0) {
            // Beneficiary
            const benefMatch = trimmedLine.match(/(?:BENEFICIARIO|BENEFICIARY)[:\s]+([^\n]+)/i);
            const beneficiary = benefMatch ? benefMatch[1].trim() : null;

            // Tracking Key
            const trackingMatch = trimmedLine.match(/(?:CLAVE|TRACKING|KEY)[:\s]+([A-Z0-9]+)/i);
            const tracking_key = trackingMatch ? trackingMatch[1].trim() : null;

            // Agent inference
            const agentPatterns = ['ANDRES', 'JUAN DIOS', 'JUAN_DIOS', 'CARLOS', 'MARIA'];
            let agent = null;
            const searchText = (description + ' ' + (beneficiary || '')).toUpperCase();
            for (const pattern of agentPatterns) {
                if (searchText.includes(pattern)) {
                    agent = pattern.replace('_', ' ');
                    break;
                }
            }

            transactions.push({
                date,
                agent,
                description,
                amount,
                beneficiary,
                tracking_key,
                associated_invoices: null
            });
        }
    }
    return transactions;
}

/**
 * Upload and process invoice PDFs
 */
export async function uploadInvoices(files) {
    const results = [];

    for (const file of files) {
        try {
            // 1. Upload to Storage
            const fileName = `${Date.now()}_${file.name}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('invoices')
                .upload(`pdfs/${fileName}`, file, { contentType: 'application/pdf' });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('invoices')
                .getPublicUrl(`pdfs/${fileName}`);

            // 2. Extract Text (Client-side)
            const text = await extractTextFromPDF(file);

            // 3. Parse Data
            const invoiceData = parseInvoiceData(text, file.name);

            // 4. Insert into DB
            const { data: insertedData, error: insertError } = await supabase
                .from('invoices')
                .upsert({
                    filename: file.name, // Use original filename for display
                    invoice_number: invoiceData.invoice_number,
                    date: invoiceData.date,
                    agent: invoiceData.agent,
                    client: invoiceData.client,
                    rfc: invoiceData.rfc,
                    subtotal: invoiceData.subtotal,
                    iva: invoiceData.iva,
                    total: invoiceData.total,
                    raw_text: text,
                    pdf_url: publicUrl
                }, { onConflict: 'filename' })
                .select();

            if (insertError) throw insertError;

            results.push({
                success: true,
                fileName: file.name,
                data: insertedData
            });

        } catch (error) {
            console.error('Error processing file:', file.name, error);
            results.push({
                success: false,
                fileName: file.name,
                error: error.message
            });
        }
    }

    return results;
}

/**
 * Upload and process bank deposits PDF
 */
export async function uploadBankDeposits(file) {
    try {
        // 1. Upload to Storage
        const fileName = `deposits_${Date.now()}.pdf`;
        const { error: uploadError } = await supabase.storage
            .from('invoices')
            .upload(`bank/${fileName}`, file, { contentType: 'application/pdf' });

        if (uploadError) throw uploadError;

        // 2. Extract Text
        const text = await extractTextFromPDF(file);

        // 3. Parse Transactions
        const transactions = parseBankTransactions(text);

        if (transactions.length === 0) {
            throw new Error('No se encontraron transacciones válidas en el PDF');
        }

        // 4. Insert into DB
        // Note: In a real app, we might want to check for duplicates
        const { data: insertedData, error: insertError } = await supabase
            .from('bank_transactions')
            .insert(transactions)
            .select();

        if (insertError) throw insertError;

        return {
            success: true,
            count: transactions.length,
            data: insertedData
        };

    } catch (error) {
        throw new Error(`Error procesando depósitos: ${error.message}`);
    }
}
