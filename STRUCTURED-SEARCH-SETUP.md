# Structured search patch

## What this adds
- structured query parsing for both leads and tenders
- support for field-style syntax such as:
  - `city:"Cape Town" keyword:"panel beaters" service:"VW Polo"`
  - `province:"Western Cape" keyword:"managed services" source:government`
- multi-word city preservation for saved leads
- lead city extraction now prefers quoted/structured city values and known multi-word cities from formatted addresses

## Files changed
- `src/lib/structuredSearch.ts`
- `src/services/search.service.ts`
- `src/pages/search/SearchPage.tsx`
- `src/pages/tenders/TendersPage.tsx`
- `supabase/functions/places-search/index.ts`
- `supabase/functions/tender-search/index.ts`

## What to do
1. Copy the patch into your project.
2. Redeploy both functions:
   - `npx supabase functions deploy places-search --no-verify-jwt`
   - `npx supabase functions deploy tender-search --no-verify-jwt`

## Notes
- This patch does not change your database schema.
- It fixes the `Cape Town` -> `Town` problem by preserving multi-word city names from the query or address.
