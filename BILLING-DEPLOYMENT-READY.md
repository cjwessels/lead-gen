# Billing deployment-ready patch

## What this patch adds
- Billing page success / cancelled / failed return-state handling
- clear user messaging for payment return states
- safer billing UX for first public deployment
- stronger frontend validation of checkout session response
- `payfast-itn` updated to use `SERVICE_ROLE_KEY`

## Routes handled
- `/app/billing?status=success`
- `/app/billing?status=cancelled`
- `/app/billing?status=failed`

## What to do after copying the patch
1. Redeploy `payfast-itn`
   - `npx supabase functions deploy payfast-itn --no-verify-jwt`
2. Confirm your secret exists
   - `SERVICE_ROLE_KEY`
3. Test sandbox end to end

## Important note
The billing page now shows safer deployment-ready user messaging, but plan activation should still depend on the PayFast ITN callback, not the browser return URL.
