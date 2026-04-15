# Tender module patch

## What this adds
- Pro-only tender search
- smart keyword expansion for terms like managed services, office automation, and network management
- tender pipeline with statuses
- tender persistence in Supabase
- tender scoring, summary, dates, and qualification note extraction when available

## Files added or changed
- `src/App.tsx`
- `src/components/layout/AppShell.tsx`
- `src/pages/billing/BillingPage.tsx`
- `src/pages/tenders/TendersPage.tsx`
- `src/services/tenders.service.ts`
- `src/types/index.ts`
- `supabase/functions/tender-search/index.ts`
- `supabase/migrations/0004_tenders.sql`

## Supabase steps
1. Run the migration:
   - `npx supabase db push`
2. Deploy the function with manual auth handling:
   - `npx supabase functions deploy tender-search --no-verify-jwt`

## Important notes
- The tender search is gated to `plan = 'pro'`.
- The function fetches the official currently advertised eTender opportunities page and heuristically extracts matching opportunities.
- If you want deeper qualification extraction and broader coverage later, the next step is integrating the official transparency/OCDS release API.
