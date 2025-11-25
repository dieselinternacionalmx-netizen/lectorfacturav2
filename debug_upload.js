
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sckksmidfhsrqagxxzwd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNja2tzbWlkZmhzcnFhZ3h4endkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MjQ5NDksImV4cCI6MjA3OTQwMDk0OX0.mGrdcyHhiOAh5lcPApRplxHs_P-id49oAIKWzjcFugk';

const supabase = createClient(supabaseUrl, supabaseKey);

// Minimal valid PDF binary string (Hello World)
const minimalPdf = `%PDF-1.7
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 44 >>
stream
BT /F1 24 Tf 100 700 Td (Hello World) Tj ET
endstream
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000060 00000 n
0000000117 00000 n
0000000235 00000 n
0000000303 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
397
%%EOF`;

async function testUpload() {
    console.log('1. Probando conexión a Supabase...');

    const buffer = Buffer.from(minimalPdf, 'utf-8');
    const fileName = `test_valid_${Date.now()}.pdf`;

    console.log('2. Intentando subir archivo a bucket "invoices"...');

    const { data, error } = await supabase.storage
        .from('invoices')
        .upload(`pdfs/${fileName}`, buffer, {
            contentType: 'application/pdf'
        });

    if (error) {
        console.error('❌ Error subiendo archivo:', error);
        return;
    }

    console.log('✅ Archivo subido correctamente:', data);

    console.log('3. Obteniendo URL pública...');
    const { data: { publicUrl } } = supabase.storage
        .from('invoices')
        .getPublicUrl(`pdfs/${fileName}`);

    console.log('URL:', publicUrl);

    console.log('4. Probando Edge Function "process-invoice"...');

    try {
        const response = await fetch(`${supabaseUrl}/functions/v1/process-invoice`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fileName,
                pdfUrl: publicUrl
            })
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('❌ Error en Edge Function (Status ' + response.status + '):');
            console.error(JSON.stringify(result, null, 2));
        } else {
            console.log('✅ Edge Function respondió OK:', result);
        }
    } catch (e) {
        console.error('❌ Error de red/fetch:', e);
    }
}

testUpload();
