import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const PLAN_CONFIG = {
  starter: { amount: '99.00', label: 'SaaSiFy Leads Starter Monthly' },
  pro: { amount: '299.00', label: 'SaaSiFy Leads Pro Monthly' },
} as const

serve(async (req) => {
  try {
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } },
    )

    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return json({ error: 'Unauthorized' }, 401)

    const { plan } = await req.json()
    if (!plan || !(plan in PLAN_CONFIG)) return json({ error: 'Invalid plan' }, 400)

    const siteUrl = Deno.env.get('SITE_URL') ?? 'http://localhost:5173'
    const merchantId = Deno.env.get('PAYFAST_MERCHANT_ID') ?? ''
    const merchantKey = Deno.env.get('PAYFAST_MERCHANT_KEY') ?? ''
    const passphrase = Deno.env.get('PAYFAST_PASSPHRASE') ?? ''
    const paymentUrl = Deno.env.get('PAYFAST_PAYMENT_URL') ?? 'https://sandbox.payfast.co.za/eng/process'

    const chosenPlan = PLAN_CONFIG[plan as keyof typeof PLAN_CONFIG]
    const formFields: Record<string, string> = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: `${siteUrl}/billing?status=success`,
      cancel_url: `${siteUrl}/billing?status=cancelled`,
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
      formFields.signature = await makeSignature(formFields, passphrase)
    }

    const { error } = await supabase.from('subscriptions').insert({
      user_id: auth.user.id,
      plan,
      status: 'pending',
      payfast_payment_id: formFields.m_payment_id,
      amount: Number(chosenPlan.amount),
    })

    if (error) throw error
    return json({ paymentUrl, formFields })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error' }, 500)
  }
})

async function makeSignature(fields: Record<string, string>, passphrase: string) {
  const params = Object.entries(fields)
    .filter(([, value]) => value !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value).replace(/%20/g, '+')}`)
    .join('&') + `&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}`

  const buffer = await crypto.subtle.digest('MD5', new TextEncoder().encode(params))
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
}
