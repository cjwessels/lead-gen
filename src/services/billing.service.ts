import { supabase } from '../lib/supabase'
import type { CheckoutPayload, PlanCode, SubscriptionRecord, SubscriptionPortalResponse } from '../types'

function requireSessionToken(sessionToken?: string | null) {
  if (!sessionToken) {
    throw new Error('You must be signed in to continue')
  }

  return sessionToken
}

async function getAccessToken() {
  if (!supabase) throw new Error('Supabase is not configured')

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) throw sessionError
  return requireSessionToken(session?.access_token)
}

export async function createCheckoutSession(plan: Exclude<PlanCode, 'free'>): Promise<CheckoutPayload> {
  const accessToken = await getAccessToken()

  const { data, error } = await supabase!.functions.invoke('create-payfast-payment', {
    body: { plan },
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (error) throw new Error(error.message || 'Could not create checkout session')
  if (!data?.paymentUrl || !data?.formFields || typeof data.paymentUrl !== 'string') {
    throw new Error('Checkout session response is incomplete')
  }

  return data as CheckoutPayload
}

export async function fetchSubscriptionPortal(): Promise<SubscriptionPortalResponse> {
  const accessToken = await getAccessToken()
  const { data, error } = await supabase!.functions.invoke('manage-payfast-subscription', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (error) throw new Error(error.message || 'Could not fetch subscription details')
  return data as SubscriptionPortalResponse
}

export async function manageSubscription(action: 'cancel' | 'pause' | 'unpause' | 'fetch' | 'get_portal'): Promise<SubscriptionPortalResponse> {
  const accessToken = await getAccessToken()
  const { data, error } = await supabase!.functions.invoke('manage-payfast-subscription', {
    body: { action },
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (error) throw new Error(error.message || `Could not ${action} subscription`)
  return data as SubscriptionPortalResponse
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

export function getSubscriptionLabel(subscription: SubscriptionRecord | null) {
  if (!subscription) return 'No active subscription stored yet'
  return `${subscription.plan.toUpperCase()} · ${subscription.status.replace('_', ' ').toUpperCase()}`
}
