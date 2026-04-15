# Advanced search helper panel patch

## What this adds
- a visual advanced search helper for Leads
- a visual advanced search helper for Tenders
- automatic quoting for multi-word values like `Cape Town`
- query preview before applying to the search box
- clear helper button to reset structured query fields

## Files changed
- `src/components/search/AdvancedSearchBuilder.tsx`
- `src/pages/search/SearchPage.tsx`
- `src/pages/tenders/TendersPage.tsx`

## Notes
- No database migration is required.
- No Edge Function redeploy is required for this patch because structured search support is already in the current build.
