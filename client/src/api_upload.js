// API functions for file uploads to Supabase

import { supabase } from './supabase';

/**
 * Upload and process invoice PDFs
 * @param {File[]} files - Array of PDF files
 * @returns {Promise<Array>} Results for each file
 */
export async function uploadInvoices(files) {
    const results = [];

    for (const file of files) {
        try {
            // 1. Upload PDF to Supabase Storage
            const fileName = `${Date.now()}_${file.name}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('invoices')
                .upload(`pdfs/${fileName}`, file, {
                    contentType: 'application/pdf'
                });

            if (uploadError) throw uploadError;

            // 2. Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('invoices')
                .getPublicUrl(`pdfs/${fileName}`);

            // 3. Call Edge Function to process PDF
            const { data: processData, error: processError } = await supabase.functions.invoke('process-invoice', {
                body: {
                    fileName,
                    pdfUrl: publicUrl
                }
            });

            if (processError) throw processError;

            results.push({
                success: true,
                fileName: file.name,
                data: processData
            });
        } catch (error) {
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
 * @param {File} file - Bank deposits PDF file
 * @returns {Promise<Object>} Processing result
 */
export async function uploadBankDeposits(file) {
    try {
        // 1. Upload PDF to Supabase Storage
        const fileName = `deposits_${Date.now()}.pdf`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('invoices')
            .upload(`bank/${fileName}`, file, {
                contentType: 'application/pdf'
            });

        if (uploadError) throw uploadError;

        // 2. Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('invoices')
            .getPublicUrl(`bank/${fileName}`);

        // 3. Call Edge Function to process bank PDF
        const { data: processData, error: processError } = await supabase.functions.invoke('process-bank-deposits', {
            body: {
                fileName,
                pdfUrl: publicUrl
            }
        });

        if (processError) throw processError;

        return {
            success: true,
            count: processData.count,
            data: processData
        };
    } catch (error) {
        throw new Error(`Error procesando depósitos: ${error.message}`);
    }
}
