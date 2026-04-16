# Advanced search suggestions patch

## What this adds
- dropdown suggestions for common cities in Leads
- dropdown suggestions for provinces, cities, keywords, and tender sources in Tenders
- quick-pick suggestion chips under supported fields
- custom typing still works alongside suggestions

## Files changed
- `src/components/search/AdvancedSearchBuilder.tsx`
- `src/pages/search/SearchPage.tsx`
- `src/pages/tenders/TendersPage.tsx`

## Apply
Copy the patched files into your project and restart the app:

```bash
npm run dev
```

No migration or function redeploy is required for this patch.
