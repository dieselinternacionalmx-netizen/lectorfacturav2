import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { fileName, pdfUrl } = await req.json()

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Download PDF
        const pdfResponse = await fetch(pdfUrl)
        const pdfBuffer = await pdfResponse.arrayBuffer()

        // Extract text
        const pdfParse = await import('https://esm.sh/pdf-parse@1.1.1')
        const data = await pdfParse.default(Buffer.from(pdfBuffer))
        const text = data.text

        // Extract bank transactions
        const transactions = extractBankTransactions(text)

        // Delete existing transactions (optional - or update logic)
        await supabaseClient.from('bank_transactions').delete().neq('id', 0)

        // Insert new transactions
        const { data: insertedData, error: insertError } = await supabaseClient
            .from('bank_transactions')
            .insert(transactions)
            .select()

        if (insertError) throw insertError

        return new Response(
            JSON.stringify({
                success: true,
                count: transactions.length,
                data: insertedData,
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

function extractBankTransactions(text: string) {
    const transactions = []
    const lines = text.split('\n')

    // Pattern for bank transactions (adjust based on your bank format)
    // Example: "20/11/2025  SPEI RECIBIDO  $11,248.52  BENEFICIARIO: EMPRESA SA  CLAVE: 123456"

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()

        // Skip empty lines
        if (!line) continue

        // Try to match transaction pattern
        const dateMatch = line.match(/(\d{1,2}\/\d{1,2}\/\d{4})/)
        if (!dateMatch) continue

        const date = dateMatch[1]

        // Extract description (SPEI, TRANSFERENCIA, etc)
        const descMatch = line.match(/(SPEI|TRANSFERENCIA|DEPOSITO)[^\$]*/i)
        const description = descMatch ? descMatch[0].trim() : ''

        // Extract amount
        const amountMatch = line.match(/\$\s*([0-9,]+\.?\d{0,2})/)
        const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0

        // Extract beneficiary
        const benefMatch = line.match(/(?:BENEFICIARIO|BENEFICIARY)[:\s]+([^\n]+)/i)
        const beneficiary = benefMatch ? benefMatch[1].trim() : null

        // Extract tracking key
        const trackingMatch = line.match(/(?:CLAVE|TRACKING|KEY)[:\s]+([A-Z0-9]+)/i)
        const tracking_key = trackingMatch ? trackingMatch[1].trim() : null

        // Extract balance (if available)
        const balanceMatch = line.match(/(?:SALDO|BALANCE)[:\s$]*([0-9,]+\.?\d{0,2})/i)
        const balance = balanceMatch ? parseFloat(balanceMatch[1].replace(/,/g, '')) : null

        // Try to extract agent from description or beneficiary
        const agentPatterns = ['ANDRES', 'JUAN DIOS', 'JUAN_DIOS', 'CARLOS', 'MARIA']
        let agent = null
        const searchText = (description + ' ' + (beneficiary || '')).toUpperCase()
        for (const pattern of agentPatterns) {
            if (searchText.includes(pattern)) {
                agent = pattern.replace('_', ' ')
                break
            }
        }

        if (amount > 0) {
            transactions.push({
                date,
                agent,
                description,
                amount,
                balance,
                beneficiary,
                tracking_key,
                associated_invoices: null,
            })
        }
    }

    return transactions
}
