# Tenders Phase 1 patch

## Included in Phase 1
- better tender date detection
- province extraction
- countrywide / national detection
- province filter in the UI
- open-only toggle to hide clearly closed tenders
- tender table fields for province, location text, and national flag

## What to do
1. Copy the patched files into your project.
2. Run the new migration:
   - `npx supabase db push`
3. Deploy the function:
   - `npx supabase functions deploy tender-search --no-verify-jwt`

## Notes
- This is still based on heuristic extraction from the public eTender listings page.
- Phase 2 should switch the data source to the structured National Treasury transparency / OCDS API.
- Phase 3 should add private-sector and platform-based tender sources.
