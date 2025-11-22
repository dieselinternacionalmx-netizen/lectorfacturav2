import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { fileName, pdfUrl } = await req.json()

        // Create Supabase client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Download PDF from storage
        const pdfResponse = await fetch(pdfUrl)
        const pdfBuffer = await pdfResponse.arrayBuffer()

        // Extract text from PDF using pdf-parse
        const pdfParse = await import('https://esm.sh/pdf-parse@1.1.1')
        const data = await pdfParse.default(Buffer.from(pdfBuffer))
        const text = data.text

        // Extract invoice data using regex patterns
        const invoiceData = extractInvoiceData(text, fileName)

        // Insert into database
        const { data: insertedData, error: insertError } = await supabaseClient
            .from('invoices')
            .insert({
                filename: fileName,
                invoice_number: invoiceData.invoice_number,
                date: invoiceData.date,
                agent: invoiceData.agent,
                client: invoiceData.client,
                rfc: invoiceData.rfc,
                subtotal: invoiceData.subtotal,
                iva: invoiceData.iva,
                total: invoiceData.total,
                raw_text: text,
                pdf_url: pdfUrl,
            })
            .select()

        if (insertError) throw insertError

        return new Response(
            JSON.stringify({
                success: true,
                data: insertedData,
                invoice: invoiceData,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})

function extractInvoiceData(text: string, filename: string) {
    // Extract invoice number
    const invoiceMatch = text.match(/(?:Factura|FACTURA|Invoice|INVOICE)[:\s#]*([A-Z0-9-]+)/i)
    const invoiceNumber = invoiceMatch ? invoiceMatch[1].trim() : filename.replace('.pdf', '')

    // Extract date (multiple formats)
    const dateMatch = text.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})|(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/)
    const date = dateMatch ? dateMatch[0] : null

    // Extract agent (common names)
    const agentPatterns = ['ANDRES', 'JUAN DIOS', 'JUAN_DIOS', 'CARLOS', 'MARIA']
    let agent = null
    for (const pattern of agentPatterns) {
        if (text.toUpperCase().includes(pattern)) {
            agent = pattern.replace('_', ' ')
            break
        }
    }

    // Extract client name (after "Cliente:" or "Razón Social:")
    const clientMatch = text.match(/(?:Cliente|Razón Social|CLIENTE|RAZÓN SOCIAL)[:\s]+([^\n]+)/i)
    const client = clientMatch ? clientMatch[1].trim() : null

    // Extract RFC
    const rfcMatch = text.match(/RFC[:\s]+([A-Z0-9]{12,13})/i)
    const rfc = rfcMatch ? rfcMatch[1].trim() : null

    // Extract amounts
    const subtotalMatch = text.match(/(?:Subtotal|SUBTOTAL)[:\s$]*([0-9,]+\.?\d{0,2})/i)
    const subtotal = subtotalMatch ? parseFloat(subtotalMatch[1].replace(/,/g, '')) : 0

    const ivaMatch = text.match(/(?:IVA|I\.V\.A\.)[:\s$]*([0-9,]+\.?\d{0,2})/i)
    const iva = ivaMatch ? parseFloat(ivaMatch[1].replace(/,/g, '')) : 0

    const totalMatch = text.match(/(?:Total|TOTAL)[:\s$]*([0-9,]+\.?\d{0,2})/i)
    const total = totalMatch ? parseFloat(totalMatch[1].replace(/,/g, '')) : subtotal + iva

    return {
        invoice_number: invoiceNumber,
        date,
        agent,
        client,
        rfc,
        subtotal,
        iva,
        total,
    }
}
