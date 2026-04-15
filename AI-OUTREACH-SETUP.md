# AI outreach setup

## What was added
- Lead score badges and heat labels across search and saved leads
- Hot Leads Only toggle on the search page
- AI outreach button on the outreach page
- SaaS-focused dashboard card replacement
- New Supabase Edge Function: `generate-outreach`

## Supabase steps
Set this secret:
- `OPENAI_API_KEY`

Deploy the new function:
```bash
npx supabase functions deploy generate-outreach
```

## How the AI outreach works
- If `OPENAI_API_KEY` is set and the function is deployed, the Outreach page can generate AI drafts per saved lead.
- If the AI function is not configured, the page falls back to the built-in local template generator.

## Google and PayFast
No new database migrations are required for this patch.
