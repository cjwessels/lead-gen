import type { CheckoutPayload, PlanCode } from '../types'

export async function createCheckoutSession(plan: Exclude<PlanCode, 'free'>): Promise<CheckoutPayload> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) throw new Error('Supabase env vars are required')

  const response = await fetch(`${supabaseUrl}/functions/v1/create-payfast-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify({ plan }),
  })

  const payload = await response.json()
  if (!response.ok) throw new Error(payload.error || 'Could not create checkout session')
  return payload
}

export function submitPayfastForm(checkout: CheckoutPayload) {
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = checkout.paymentUrl
  Object.entries(checkout.formFields).forEach(([key, value]) => {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = key
    input.value = value
    form.appendChild(input)
  })
  document.body.appendChild(form)
  form.submit()
}
