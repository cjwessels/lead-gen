# Search filters and pagination patch

## Added
- minimum lead strength slider
- multi-select pain point filter with `All` selected by default
- client-side pagination
- increased Google Places request size from 10 to 20 results

## Notes
- Google Places Text Search (New) returns up to 20 results per page in this setup.
- The pagination added here is client-side over the returned results.
- If you want true server-side pagination beyond 20, the next step is to implement `nextPageToken` handling in the Edge Function and frontend.
