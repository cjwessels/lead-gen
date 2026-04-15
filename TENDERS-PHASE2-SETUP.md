# Tenders Phase 2 patch

## What changes in Phase 2
- tender search switches from HTML scraping to structured OCDS/API ingestion
- the repeated QuickFind / filter-text result problem is removed
- search becomes responsive to the actual query terms
- tender paging is now driven by API pages, not only client-side filtering

## Files changed
- `src/types/index.ts`
- `src/services/tenders.service.ts`
- `src/pages/tenders/TendersPage.tsx`
- `supabase/functions/tender-search/index.ts`

## What to do
1. Copy the patch into your project.
2. Redeploy the tender function:
   - `npx supabase functions deploy tender-search --no-verify-jwt`

## Notes
- This phase uses the official structured procurement data route rather than the JS-rendered eTender opportunities page.
- Phase 3 should add private-sector and platform-based tender sources into the same normalized search and pipeline flow.
