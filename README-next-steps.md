# Functional rollout steps

## 1. Frontend
Replace your current `src` files with the updated versions in this package.

## 2. Supabase migrations
Apply:
- `0001_init.sql`
- `0002_functional.sql`

## 3. Edge Function secrets
Set:
- `GOOGLE_API_KEY`
- `PAYFAST_MERCHANT_ID`
- `PAYFAST_MERCHANT_KEY`
- `PAYFAST_PASSPHRASE`
- `PAYFAST_PAYMENT_URL`
- `SITE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## 4. Deploy functions
- `places-search`
- `create-payfast-payment`
- `payfast-itn`

## 5. Important note
The PayFast ITN file is functional as a starter, but production hardening still needs:
- signature verification from the incoming ITN payload
- server-to-server validation with PayFast
- recurring subscription handling if you want automated monthly rebilling
