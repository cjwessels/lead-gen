import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { callPayFastApi, json } from '../_shared/payfast.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return json({ ok: true }, 200)

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: req.headers.get('Authorization') ?? '',
          },
        },
      },
    )

    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return json({ error: 'Unauthorized' }, 401)

    const service = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? '',
    )

    const { data: subscription, error } = await service
      .from('subscriptions')
      .select('*')
      .eq('user_id', auth.user.id)
      .in('status', ['active', 'past_due', 'on_hold', 'pending', 'cancelled'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) return json({ error: error.message }, 500)
    if (!subscription) return json({ subscription: null, portal: null })

    const paymentUrl = Deno.env.get('PAYFAST_PAYMENT_URL') ?? ''
    const paymentOrigin = paymentUrl ? new URL(paymentUrl).origin : 'https://www.payfast.co.za'
    const isSandbox = paymentOrigin.includes('sandbox')

    const token = subscription.payfast_subscription_token
    const returnUrl = `${Deno.env.get('SITE_URL') ?? ''}/app/billing`
    const portal = token && !isSandbox ? `${paymentOrigin}/eng/recurring/update/${token}?return=${encodeURIComponent(returnUrl)}` : null

    if (req.method === 'GET') {
      return json({ subscription, portal })
    }

    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

    const { action } = await req.json()
    if (!action) return json({ error: 'Action is required' }, 400)
    if (!token && action !== 'get_portal') return json({ error: 'No PayFast subscription token stored yet' }, 400)

    const merchantId = Deno.env.get('PAYFAST_MERCHANT_ID') ?? ''
    const passphrase = Deno.env.get('PAYFAST_PASSPHRASE') ?? ''

    if (action === 'get_portal') {
      return json({ subscription, portal })
    }

    let result: unknown = null
    if (action === 'cancel') {
      result = await callPayFastApi({ method: 'PUT', path: `subscriptions/${token}/cancel`, merchantId, passphrase, testMode: isSandbox })
      await service.from('subscriptions').update({ status: 'cancelled', cancelled_at: new Date().toISOString() }).eq('id', subscription.id)
      await service.from('profiles').update({ plan: 'free', monthly_search_limit: 25 }).eq('id', auth.user.id)
    } else if (action === 'pause') {
      result = await callPayFastApi({ method: 'PUT', path: `subscriptions/${token}/pause`, body: { cycles: 1 }, merchantId, passphrase, testMode: isSandbox })
      await service.from('subscriptions').update({ status: 'on_hold', paused_at: new Date().toISOString() }).eq('id', subscription.id)
      await service.from('profiles').update({ plan: 'free', monthly_search_limit: 25 }).eq('id', auth.user.id)
    } else if (action === 'unpause') {
      result = await callPayFastApi({ method: 'PUT', path: `subscriptions/${token}/unpause`, merchantId, passphrase, testMode: isSandbox })
      await service.from('subscriptions').update({ status: 'active', paused_at: null }).eq('id', subscription.id)
      await service.from('profiles').update({ plan: subscription.plan, monthly_search_limit: subscription.plan === 'pro' ? 100000 : 200 }).eq('id', auth.user.id)
    } else if (action === 'fetch') {
      result = await callPayFastApi({ method: 'GET', path: `subscriptions/${token}/fetch`, merchantId, passphrase, testMode: isSandbox })
    } else {
      return json({ error: 'Unsupported action' }, 400)
    }

    await service.from('billing_events').insert({
      user_id: auth.user.id,
      event_type: `subscription_${action}`,
      event_status: subscription.status,
      payfast_payment_id: subscription.payfast_payment_id,
      payfast_pf_payment_id: subscription.payfast_pf_payment_id,
      payfast_subscription_token: subscription.payfast_subscription_token,
      payload: typeof result === 'object' ? result : { result },
    })

    const { data: refreshed } = await service.from('subscriptions').select('*').eq('id', subscription.id).single()
    return json({ subscription: refreshed, result, portal })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error' }, 500)
  }
})
