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
    // Extract invoice number from PDF text first
    let invoiceNumber = null;

    // Pattern 1: "Folio: A 30656" or "Folio: C 28295" -> extract just the numbers
    const folioMatch = text.match(/Folio:\s*[A-Z]?\s*(\d+)/i);
    if (folioMatch) {
        invoiceNumber = folioMatch[1];
    }

    // Fallback: Try to extract from filename if not found in text
    if (!invoiceNumber) {
        const cfdiMatch = filename.match(/[_A](\d{5,})/);
        if (cfdiMatch) {
            invoiceNumber = cfdiMatch[1];
        } else {
            const numberMatch = filename.match(/(\d{4,})/);
            if (numberMatch) {
                invoiceNumber = numberMatch[1];
            } else {
                invoiceNumber = filename.replace('.pdf', '');
            }
        }
    }

    // Extract date
    const dateMatch = text.match(/(\d{1,2}[-\/]\w{3}[-\/]\d{4})|(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})|(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/);
    let date = dateMatch ? dateMatch[0] : null;

    // Normalize date to YYYY-MM-DD if possible
    if (date) {
        try {
            // Handle "23/Ene/2025" format
            if (date.match(/\d{1,2}[-\/]\w{3}[-\/]\d{4}/)) {
                const monthMap = {
                    'ene': '01', 'feb': '02', 'mar': '03', 'abr': '04',
                    'may': '05', 'jun': '06', 'jul': '07', 'ago': '08',
                    'sep': '09', 'oct': '10', 'nov': '11', 'dic': '12'
                };
                const parts = date.split(/[-\/]/);
                const month = monthMap[parts[1].toLowerCase()];
                date = `${parts[2]}-${month}-${parts[0].padStart(2, '0')}`;
            } else {
                const parts = date.split(/[-\/]/);
                if (parts[0].length === 4) {
                    // YYYY-MM-DD
                    date = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
                } else {
                    // DD-MM-YYYY
                    date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                }
            }
        } catch (e) {
            console.warn('Date parsing error:', e);
        }
    }

    // Extract agent - Pattern: "Agente: 09 - TEODORO" or just "TEODORO"
    let agent = null;
    const agenteMatch = text.match(/Agente:\s*\d*\s*-?\s*([A-Z][A-Z\s]+)/i);
    if (agenteMatch) {
        agent = agenteMatch[1].trim();
    }

    // Extract client - Pattern: "Cliente: 9374 - ALMA ANGELICA SANCHEZ ROSAS"
    const clienteMatch = text.match(/Cliente:\s*\d+\s*-\s*([^\n\r]+)/i);
    const client = clienteMatch ? clienteMatch[1].trim() : null;

    // Extract RFC - Look for RFC after "Datos del Cliente" section
    let rfc = null;
    const rfcMatch = text.match(/Datos del Cliente:[\s\S]{0,300}RFC:\s*([A-Z0-9]{12,13})/i);
    if (rfcMatch) {
        rfc = rfcMatch[1].trim();
    } else {
        // Fallback: Generic RFC search
        const genericRfcMatch = text.match(/RFC:\s*([A-Z0-9]{12,13})/i);
        if (genericRfcMatch) {
            rfc = genericRfcMatch[1].trim();
        }
    }

    // Extract amounts - More flexible patterns
    const subtotalMatch = text.match(/(?:Subtotal|SUBTOTAL|Sub-total|Sub total)[:\s]*\$?\s*([0-9,]+\.?\d{0,2})/i);
    const subtotal = subtotalMatch ? parseFloat(subtotalMatch[1].replace(/,/g, '')) : 0;

    const ivaMatch = text.match(/(?:IVA|I\.V\.A\.|Iva|iva)[:\s]*\$?\s*([0-9,]+\.?\d{0,2})/i);
    const iva = ivaMatch ? parseFloat(ivaMatch[1].replace(/,/g, '')) : 0;

    const totalMatch = text.match(/(?:Total|TOTAL)[:\s]*\$?\s*([0-9,]+\.?\d{0,2})/i);
    const total = totalMatch ? parseFloat(totalMatch[1].replace(/,/g, '')) : subtotal + iva;

    return {
        invoice_number: invoiceNumber || '',
        date: date || '',
        agent: agent || '',
        client: client || '',
        rfc: rfc || '',
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
