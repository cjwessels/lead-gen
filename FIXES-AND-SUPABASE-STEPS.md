# Fixes applied

1. Fixed `0003_dedupe_usage.sql`
   - Adds `city` if missing
   - Removes the incorrect `address` index dependency
   - Rebuilds the unique index using `city`

2. Fixed `places-search`
   - Uses `GOOGLE_API_KEY` correctly
   - Adds CORS preflight support for browser requests
   - Keeps quota enforcement and field mask

3. Fixed `create-payfast-payment`
   - Adds CORS preflight support
   - Sends the browser back to `/app/billing`
   - Keeps payment session creation server-side

4. Cleaned `.env.example`
   - Removed `VITE_PLACES_API_KEY` because Google Places should stay server-side

# What to do in Supabase

## Database
Run:
- `npx supabase db push`

If migration history is already partially applied and still blocks you, paste `0003_dedupe_usage.sql` into Supabase SQL Editor and run it manually.

## Edge Function secrets
Set these secrets in Supabase:
- `GOOGLE_API_KEY`
- `PAYFAST_MERCHANT_ID`
- `PAYFAST_MERCHANT_KEY`
- `PAYFAST_PASSPHRASE`
- `PAYFAST_PAYMENT_URL`
- `SITE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Example:
```bash
npx supabase secrets set GOOGLE_API_KEY=your_google_key
npx supabase secrets set PAYFAST_MERCHANT_ID=your_merchant_id
npx supabase secrets set PAYFAST_MERCHANT_KEY=your_merchant_key
npx supabase secrets set PAYFAST_PASSPHRASE=your_passphrase
npx supabase secrets set PAYFAST_PAYMENT_URL=https://sandbox.payfast.co.za/eng/process
npx supabase secrets set SITE_URL=http://localhost:5173
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Deploy functions
Run:
```bash
npx supabase functions deploy places-search
npx supabase functions deploy create-payfast-payment
npx supabase functions deploy payfast-itn
```

# Google setup
1. In Google Cloud, enable Places API (New)
2. Turn billing on for that project
3. Create an API key
4. Store it only as `GOOGLE_API_KEY` in Supabase secrets

# PayFast setup
1. Use sandbox first
2. Put sandbox merchant ID and key into Supabase secrets
3. Set `PAYFAST_PAYMENT_URL=https://sandbox.payfast.co.za/eng/process`
4. Make sure your `notify_url` is reachable publicly through the deployed Supabase function
5. Test a payment and verify that `subscriptions.status` becomes `active`

# Still not fully production-ready
You still need:
- PayFast ITN signature verification
- PayFast server-to-server validation
- monthly quota reset automation
- billing success/cancel UI states
