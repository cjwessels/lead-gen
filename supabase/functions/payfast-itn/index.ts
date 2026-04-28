import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { buildItnSignature, validateItnWithPayFast } from '../_shared/payfast.ts'

function planLimit(plan: string) {
  return plan === 'pro' ? 100000 : 200
}

function normaliseStatus(status: string | null) {
  const value = (status || '').trim().toLowerCase()
  if (value === 'complete') return 'active'
  if (value === 'cancelled') return 'cancelled'
  if (value === 'failed') return 'past_due'
  if (value === 'pending') return 'pending'
  return value || 'pending'
}

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const bodyText = await req.text()
    const params = new URLSearchParams(bodyText)

    const merchantId = params.get('merchant_id')
    const merchantKey = params.get('merchant_key')
    const paymentStatus = params.get('payment_status')
    const paymentId = params.get('m_payment_id')
    const pfPaymentId = params.get('pf_payment_id')
    const subscriptionToken = params.get('token')
    const amountGross = params.get('amount_gross')
    const userId = params.get('custom_str1')
    const plan = params.get('custom_str2')
    const passphrase = Deno.env.get('PAYFAST_PASSPHRASE') ?? ''
    const paymentUrl = Deno.env.get('PAYFAST_PAYMENT_URL') ?? ''

    if (
      merchantId !== Deno.env.get('PAYFAST_MERCHANT_ID') ||
      merchantKey !== Deno.env.get('PAYFAST_MERCHANT_KEY')
    ) {
      return new Response('Merchant validation failed', { status: 400 })
    }

    const providedSignature = params.get('signature')?.toLowerCase() || ''
    const expectedSignature = buildItnSignature(params, passphrase)
    if (!providedSignature || providedSignature !== expectedSignature) {
      return new Response('Signature validation failed', { status: 400 })
    }

    const isValid = await validateItnWithPayFast(bodyText, paymentUrl)
    if (!isValid) {
      return new Response('ITN validation failed', { status: 400 })
    }

    const service = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? '',
    )

    const status = normaliseStatus(paymentStatus)
    const now = new Date().toISOString()

    let subscriptionQuery = service
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)

    if (subscriptionToken) {
      subscriptionQuery = subscriptionQuery.eq('payfast_subscription_token', subscriptionToken)
    } else if (paymentId) {
      subscriptionQuery = subscriptionQuery.eq('payfast_payment_id', paymentId)
    }

    const { data: subscription } = await subscriptionQuery.maybeSingle()

    const failedCount = status === 'past_due' ? (subscription?.failed_payment_count ?? 0) + 1 : 0
    const onHold = failedCount >= 5

    const updatePayload: Record<string, unknown> = {
      status: onHold ? 'on_hold' : status,
      payfast_status: paymentStatus,
      payfast_pf_payment_id: pfPaymentId,
      amount: amountGross ? Number(amountGross) : subscription?.amount ?? null,
      last_payment_status: paymentStatus,
      last_payment_at: now,
      failed_payment_count: failedCount,
      metadata: {
        ...(subscription?.metadata ?? {}),
        last_itn: Object.fromEntries(params.entries()),
      },
    }

    if (subscriptionToken) updatePayload.payfast_subscription_token = subscriptionToken
    if (status === 'active' && !subscription?.started_at) updatePayload.started_at = now
    if (status === 'cancelled') updatePayload.cancelled_at = now

    if (subscription?.id) {
      await service.from('subscriptions').update(updatePayload).eq('id', subscription.id)
    } else if (userId && plan && paymentId) {
      await service.from('subscriptions').insert({
        user_id: userId,
        plan,
        status: onHold ? 'on_hold' : status,
        payfast_payment_id: paymentId,
        payfast_subscription_token: subscriptionToken,
        payfast_pf_payment_id: pfPaymentId,
        amount: amountGross ? Number(amountGross) : null,
        recurring_amount: amountGross ? Number(amountGross) : null,
        is_recurring: true,
        last_payment_status: paymentStatus,
        last_payment_at: now,
        failed_payment_count: failedCount,
        metadata: {
          last_itn: Object.fromEntries(params.entries()),
        },
      })
    }

    if (userId && plan) {
      if (status === 'active') {
        await service
          .from('profiles')
          .update({ plan, monthly_search_limit: planLimit(plan) })
          .eq('id', userId)
      }

      if (status === 'cancelled' || onHold) {
        await service
          .from('profiles')
          .update({ plan: 'free', monthly_search_limit: 25 })
          .eq('id', userId)
      }
    }

    await service.from('billing_events').insert({
      user_id: userId,
      event_type: 'payfast_itn',
      event_status: onHold ? 'on_hold' : status,
      payfast_payment_id: paymentId,
      payfast_pf_payment_id: pfPaymentId,
      payfast_subscription_token: subscriptionToken,
      payload: Object.fromEntries(params.entries()),
    })

    return new Response('OK', { status: 200 })
  } catch (error) {
    return new Response(error instanceof Error ? error.message : 'Unexpected error', { status: 500 })
  }
})
