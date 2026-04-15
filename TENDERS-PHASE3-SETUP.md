# Tenders Phase 3 patch

## What Phase 3 adds
- multi-source tender aggregation
- official public procurement source retained
- platform / private-sector signal sources added
- source labels and source-type badges in the UI
- source filter in the Tender screen
- saved tender records persist the source type and source label

## Files changed
- `src/types/index.ts`
- `src/services/tenders.service.ts`
- `src/pages/tenders/TendersPage.tsx`
- `supabase/functions/tender-search/index.ts`
- `supabase/migrations/0006_tenders_phase3.sql`

## What to do
1. Copy the patch into your project.
2. Run the migration:
   - `npx supabase db push`
3. Redeploy the function:
   - `npx supabase functions deploy tender-search --no-verify-jwt`

## Notes
- This phase merges official government data with platform/private-sector signals where available.
- The next natural refinement is source weighting, source trust scoring, and dedicated adapters per provider.
