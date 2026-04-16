import md5 from 'https://esm.sh/blueimp-md5@2.19.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const PLAN_CONFIG = {
  starter: { amount: '99.00', label: 'SaaSiFy Leads Starter Monthly' },
  pro: { amount: '299.00', label: 'SaaSiFy Leads Pro Monthly' },
} as const

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return json({ ok: true }, 200)
  }

  try {
    if (req.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405)
    }

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
    if (!auth.user) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const { plan } = await req.json()
    if (!plan || !(plan in PLAN_CONFIG)) {
      return json({ error: 'Invalid plan' }, 400)
    }

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

    const formFields: Record<string, string> = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: `${siteUrl}/app/billing?status=success`,
      cancel_url: `${siteUrl}/app/billing?status=cancelled`,
      notify_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/payfast-itn`,
      name_first: auth.user.email?.split('@')[0] || 'Customer',
      email_address: auth.user.email || '',
      m_payment_id: crypto.randomUUID(),
      amount: chosenPlan.amount,
      item_name: chosenPlan.label,
      custom_str1: auth.user.id,
      custom_str2: plan,
    }

    if (passphrase) {
      formFields.signature = makeSignature(formFields, passphrase)
    }

    const { error: insertError } = await supabase.from('subscriptions').insert({
      user_id: auth.user.id,
      plan,
      status: 'pending',
      payfast_payment_id: formFields.m_payment_id,
      amount: Number(chosenPlan.amount),
    })

    if (insertError) {
      return json(
        {
          error: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code,
        },
        500,
      )
    }

    return json({
      paymentUrl,
      formFields,
    })
  } catch (error) {
    return json(
      {
        error: error instanceof Error ? error.message : 'Unexpected error',
      },
      500,
    )
  }
})

function payfastEncode(value: string) {
  return encodeURIComponent(value)
    .replace(/%20/g, '+')
    .replace(/%[0-9a-f]{2}/g, (match) => match.toUpperCase())
}

function makeSignature(fields: Record<string, string>, passphrase: string) {
  const paramString = Object.entries(fields)
    .filter(([, value]) => value !== '' && value !== undefined && value !== null)
    .map(([key, value]) => `${key}=${payfastEncode(String(value).trim())}`)
    .join('&')

  const signingString = passphrase
    ? `${paramString}&passphrase=${payfastEncode(passphrase.trim())}`
    : paramString

  return md5(signingString).toLowerCase()
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
  })
}