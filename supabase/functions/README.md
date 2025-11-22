# Supabase Edge Functions Deployment Guide

## Prerequisites

1. Install Supabase CLI:
```powershell
npm install -g supabase
```

2. Login to Supabase:
```powershell
supabase login
```

## Deploy Edge Functions

### 1. Link to your project

```powershell
supabase link --project-ref sckksmidfhsrqagxxzwd
```

### 2. Deploy process-invoice function

```powershell
supabase functions deploy process-invoice
```

### 3. Deploy process-bank-deposits function

```powershell
supabase functions deploy process-bank-deposits
```

## Set Environment Variables

The functions need access to your Supabase URL and Service Role Key:

```powershell
supabase secrets set SUPABASE_URL=https://sckksmidfhsrqagxxzwd.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**To get your Service Role Key**:
1. Go to: https://supabase.com/dashboard/project/sckksmidfhsrqagxxzwd/settings/api
2. Copy the `service_role` key (secret)

## Test Functions

### Test process-invoice

```powershell
curl -X POST https://sckksmidfhsrqagxxzwd.supabase.co/functions/v1/process-invoice \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"fileName": "test.pdf", "pdfUrl": "https://..."}'
```

### Test process-bank-deposits

```powershell
curl -X POST https://sckksmidfhsrqagxxzwd.supabase.co/functions/v1/process-bank-deposits \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"fileName": "deposits.pdf", "pdfUrl": "https://..."}'
```

## Troubleshooting

### Function not found
- Make sure you deployed the function
- Check function name matches exactly

### Permission denied
- Verify Service Role Key is set correctly
- Check RLS policies allow function to insert

### PDF parsing errors
- Ensure PDF is valid and not encrypted
- Check PDF text extraction works (some PDFs are image-based)

## Local Development

To test functions locally:

```powershell
supabase start
supabase functions serve process-invoice
```

Then test with:
```powershell
curl -X POST http://localhost:54321/functions/v1/process-invoice \
  -H "Content-Type: application/json" \
  -d '{"fileName": "test.pdf", "pdfUrl": "..."}'
```
