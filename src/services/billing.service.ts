import { supabase } from '../lib/supabase'
import type { CheckoutPayload, PlanCode } from '../types'

export async function createCheckoutSession(plan: Exclude<PlanCode, 'free'>): Promise<CheckoutPayload> {
  if (!supabase) {
    throw new Error('Supabase is not configured')
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) {
    throw sessionError
  }

  if (!session?.access_token) {
    throw new Error('You must be signed in to start checkout')
  }

  const { data, error } = await supabase.functions.invoke('create-payfast-payment', {
    body: { plan },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  })

  if (error) {
    throw new Error(error.message || 'Could not create checkout session')
  }

  if (!data?.paymentUrl || !data?.formFields || typeof data.paymentUrl !== 'string') {
    throw new Error('Checkout session response is incomplete')
  }

  return data as CheckoutPayload
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
