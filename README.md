# SaaSiFy Leads Starter

This starter converts the bare Vite repository into a SaaS-ready lead-generation foundation for South African SMEs.

## Included
- Vite + React + TypeScript
- Tailwind CSS v4
- Supabase client setup
- Google Places Edge Function starter
- PayFast ITN function starter
- Lead scoring utility
- Pipeline board starter
- Outreach generator starter
- Billing page starter

## Run locally
```bash
npm install
npm run dev
```

## Supabase
1. Create a Supabase project.
2. Apply `supabase/migrations/0001_init.sql`.
3. Set Edge Function secrets:
   - `GOOGLE_API_KEY`
   - `PAYFAST_MERCHANT_ID`
   - `PAYFAST_MERCHANT_KEY`
   - `PAYFAST_PASSPHRASE`
4. Deploy functions:
```bash
supabase functions deploy places-search
supabase functions deploy payfast-itn
```

## Frontend env
Copy `.env.example` to `.env` and fill in the values.

## Important notes
- The billing flow is intentionally scaffolded, not production-complete. PayFast signature validation and remote validation still need to be completed before launch.
- Search falls back to mock data when Supabase env vars are not present, so the UI can be tested before backend setup.
- Auth screens and usage metering should be added next for full public SaaS rollout.
