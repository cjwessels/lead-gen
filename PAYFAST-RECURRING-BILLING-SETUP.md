# PayFast recurring billing rollout for this app

## What this patch changes

This patch converts the current once-off PayFast flow into a recurring subscription-oriented flow with:

- PayFast subscription checkout fields
- secure ITN signature validation
- PayFast server-side ITN validation callback
- Supabase subscription state tracking
- billing events audit trail
- client-facing billing controls for:
  - signup / upgrade
  - refresh subscription status
  - pause / hold
  - cancel
  - update saved card (live only, after token exists)

## 1) What to do inside your PayFast account

1. Log in to your PayFast Dashboard.
2. Complete merchant verification first if not already verified.
3. Go to **Settings > Developer Settings** and set a **Security Passphrase**.
4. Go to **Settings > Recurring Billing** and enable **Subscriptions / Recurring Billing**.
5. Confirm that **Credit Card** payments are enabled, because recurring billing is card-based.
6. In your integration settings, keep your **Merchant ID** and **Merchant Key** ready.
7. Decide whether you are testing or going live:
   - sandbox payment URL: use your sandbox process URL
   - live payment URL: use the live PayFast process URL
8. For merchant-side subscription management later, use **Transactions > Customer Subscriptions**.
9. For manual pause, cancel, edit, and review of locked subscriptions, that same subscriptions area is your backstop if the app UI ever fails.

## 2) Important behavioural notes from PayFast

- PayFast subscriptions automatically renew according to the configured frequency and cycles.
- Buyers can update their saved card details when you provide the recurring card-update link.
- Merchants can edit, pause and cancel subscriptions via dashboard or API.
- PayFast indicates that when a subscriber is out of funds, recurring collections are retried **5 times over 5 days**, after which the subscription becomes locked and needs merchant intervention. In this patch that condition is surfaced as **on_hold** in your app and logged to billing events.

## 3) Supabase secrets you must set

Set these in Supabase Edge Functions secrets:

- `SITE_URL`
- `PAYFAST_MERCHANT_ID`
- `PAYFAST_MERCHANT_KEY`
- `PAYFAST_PASSPHRASE`
- `PAYFAST_PAYMENT_URL`
- `SERVICE_ROLE_KEY`

Recommended values:

- `SITE_URL=https://your-app-domain.co.za`
- `PAYFAST_PAYMENT_URL=https://sandbox.payfast.co.za/eng/process` for sandbox
- `PAYFAST_PAYMENT_URL=https://www.payfast.co.za/eng/process` for live

## 4) Database rollout

Run your Supabase migration so that `0010_payfast_recurring_billing.sql` is applied.

This adds:

- extra subscription tracking fields
- `billing_events` audit table
- support for `on_hold` status

## 5) Edge Functions to deploy

Deploy these functions:

- `create-payfast-payment`
- `payfast-itn`
- `manage-payfast-subscription`

Also deploy the shared helper folder under `supabase/functions/_shared` with the functions.

## 6) ITN setup

Use this as the PayFast notify endpoint:

`https://YOUR-PROJECT.supabase.co/functions/v1/payfast-itn`

This function now does:

1. merchant validation
2. signature validation using your passphrase
3. PayFast validation POST-back to `/eng/query/validate`
4. subscription table update
5. profile plan update
6. billing event logging

## 7) Front-end pages and flows included

The billing page now supports:

- start recurring checkout
- inspect current subscription record
- refresh from PayFast API
- pause / hold subscription
- cancel subscription
- open the PayFast card update link in a new tab when a live token exists

## 8) Client signup flow

The client flow is now:

1. user signs in
2. user opens Billing
3. user selects Starter or Pro
4. app creates a PayFast recurring payment payload server-side
5. user completes initial PayFast card payment and 3DS
6. PayFast sends ITN
7. app activates plan only after ITN succeeds

## 9) Cancellation behaviour in this patch

This patch downgrades the profile to `free` immediately when cancel or hold is applied.

That is the safest behaviour with the current app because your existing feature gating uses only `profiles.plan`. If you want **end-of-billing-period cancellation** instead, the next iteration should add a `plan_valid_until` or `cancel_at_period_end` model and gate the app on subscription dates instead of only on `profiles.plan`.

## 10) Testing checklist

### Sandbox

- start a checkout
- confirm redirect to PayFast works
- confirm return URL works
- confirm `subscriptions` gets a pending row
- confirm ITN hits Supabase
- confirm `billing_events` records the callback

### Live recurring validation

Because recurring token/card update behaviour is only meaningful on a recurring-enabled live merchant profile, validate these on live with a controlled real subscription:

- token stored on subscription after first successful payment
- billing page shows token
- update card link opens
- cancel action works
- pause action works
- fetch action returns PayFast API data

## 11) Suggested next phase

For a more polished SaaS billing system, the next patch should add:

- end-of-term cancellation instead of immediate downgrade
- in-app invoices / payment history page
- email notifications through your chosen mail provider
- webhook replay protection and duplicate event handling
- grace period rules for `past_due`
- admin billing dashboard
