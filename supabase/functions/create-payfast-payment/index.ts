import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { buildPaymentSignature, json } from '../_shared/payfast.ts'

const PLAN_CONFIG = {
  starter: {
    amount: '99.00',
    label: 'SaaSiFy Leads Starter Monthly',
    frequency: '3',
    cycles: '0',
  },
  pro: {
    amount: '299.00',
    label: 'SaaSiFy Leads Pro Monthly',
    frequency: '3',
    cycles: '0',
  },
} as const

serve(async (req) => {
  if (req.method === 'OPTIONS') return json({ ok: true }, 200)
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

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

    const { plan } = await req.json()
    if (!plan || !(plan in PLAN_CONFIG)) return json({ error: 'Invalid plan' }, 400)

    const siteUrl = Deno.env.get('SITE_URL') ?? ''
    const merchantId = Deno.env.get('PAYFAST_MERCHANT_ID') ?? ''
    const merchantKey = Deno.env.get('PAYFAST_MERCHANT_KEY') ?? ''
    const passphrase = Deno.env.get('PAYFAST_PASSPHRASE') ?? ''
    const paymentUrl = Deno.env.get('PAYFAST_PAYMENT_URL') ?? ''

    if (!merchantId) return json({ error: 'PAYFAST_MERCHANT_ID missing' }, 500)
    if (!merchantKey) return json({ error: 'PAYFAST_MERCHANT_KEY missing' }, 500)
    if (!paymentUrl) return json({ error: 'PAYFAST_PAYMENT_URL missing' }, 500)
    if (!siteUrl) return json({ error: 'SITE_URL missing' }, 500)

    const chosenPlan = PLAN_CONFIG[plan as keyof typeof PLAN_CONFIG]
    const paymentId = crypto.randomUUID()

    const formFields: Record<string, string> = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: `${siteUrl}/app/billing?status=success`,
      cancel_url: `${siteUrl}/app/billing?status=cancelled`,
      notify_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/payfast-itn`,
      name_first: auth.user.email?.split('@')[0] || 'Customer',
      email_address: auth.user.email || '',
      m_payment_id: paymentId,
      amount: chosenPlan.amount,
      item_name: chosenPlan.label,
      custom_str1: auth.user.id,
      custom_str2: plan,
      subscription_type: '1',
      billing_date: new Date().toISOString().slice(0, 10),
      recurring_amount: chosenPlan.amount,
      frequency: chosenPlan.frequency,
      cycles: chosenPlan.cycles,
      subscription_notify_buyer: 'true',
      subscription_notify_email: 'true',
    }

    formFields.signature = buildPaymentSignature(formFields, passphrase)

    const { error: insertError } = await supabase.from('subscriptions').insert({
      user_id: auth.user.id,
      plan,
      status: 'pending',
      payfast_payment_id: paymentId,
      amount: Number(chosenPlan.amount),
      recurring_amount: Number(chosenPlan.amount),
      billing_frequency: Number(chosenPlan.frequency),
      billing_cycles: Number(chosenPlan.cycles),
      is_recurring: true,
      metadata: {
        source: 'payfast',
        mode: paymentUrl.includes('sandbox') ? 'sandbox' : 'live',
      },
    })

    if (insertError) {
      return json({ error: insertError.message, code: insertError.code }, 500)
    }

    return json({ paymentUrl, formFields })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error' }, 500)
  }
})
