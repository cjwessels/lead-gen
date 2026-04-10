import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const bodyText = await req.text()
  const params = new URLSearchParams(bodyText)

  const paymentStatus = params.get('payment_status')
  const merchantId = params.get('merchant_id')
  const merchantKey = params.get('merchant_key')
  const email = params.get('email_address')
  const customStr1 = params.get('custom_str1') // typically your user id
  const amountGross = params.get('amount_gross')

  const expectedMerchantId = Deno.env.get('PAYFAST_MERCHANT_ID')
  const expectedMerchantKey = Deno.env.get('PAYFAST_MERCHANT_KEY')

  if (!expectedMerchantId || !expectedMerchantKey) {
    return new Response('Missing PayFast secrets', { status: 500 })
  }

  if (merchantId !== expectedMerchantId || merchantKey !== expectedMerchantKey) {
    return new Response('Merchant validation failed', { status: 400 })
  }

  // TODO:
  // 1. Verify signature using passphrase if used.
  // 2. Post back to PayFast validation endpoint.
  // 3. On COMPLETE, update subscriptions table for customStr1 user id.
  // 4. Store an audit record in billing_events.
  console.log(JSON.stringify({ paymentStatus, email, customStr1, amountGross }))

  return new Response('OK', { status: 200 })
})
