import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const bodyText = await req.text()
    const params = new URLSearchParams(bodyText)
    const paymentStatus = params.get('payment_status')
    const merchantId = params.get('merchant_id')
    const merchantKey = params.get('merchant_key')
    const paymentId = params.get('m_payment_id')
    const userId = params.get('custom_str1')
    const plan = params.get('custom_str2')

    if (merchantId !== Deno.env.get('PAYFAST_MERCHANT_ID') || merchantKey !== Deno.env.get('PAYFAST_MERCHANT_KEY')) {
      return new Response('Merchant validation failed', { status: 400 })
    }

    const service = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    if (paymentStatus === 'COMPLETE' && userId && plan) {
      await service.from('subscriptions').update({ status: 'active' }).eq('payfast_payment_id', paymentId)
      await service.from('profiles').update({
        plan,
        monthly_search_limit: plan === 'pro' ? 100000 : 200,
      }).eq('id', userId)
    }

    return new Response('OK', { status: 200 })
  } catch {
    return new Response('Unexpected error', { status: 500 })
  }
})
