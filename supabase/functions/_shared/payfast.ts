import md5 from 'https://esm.sh/blueimp-md5@2.19.0'

export const PAYFAST_API_URL = 'https://api.payfast.co.za'
export const PAYFAST_API_VERSION = 'v1'

export function payfastEncode(value: string) {
  return encodeURIComponent(value)
    .replace(/%20/g, '+')
    .replace(/%[0-9a-f]{2}/g, (match) => match.toUpperCase())
}

export function buildPaymentSignature(fields: Record<string, string>, passphrase: string) {
  const allowedFields = [
    'merchant_id',
    'merchant_key',
    'return_url',
    'cancel_url',
    'notify_url',
    'notify_method',
    'name_first',
    'name_last',
    'email_address',
    'cell_number',
    'm_payment_id',
    'amount',
    'item_name',
    'item_description',
    'custom_int1',
    'custom_int2',
    'custom_int3',
    'custom_int4',
    'custom_int5',
    'custom_str1',
    'custom_str2',
    'custom_str3',
    'custom_str4',
    'custom_str5',
    'email_confirmation',
    'confirmation_address',
    'currency',
    'payment_method',
    'subscription_type',
    'billing_date',
    'recurring_amount',
    'frequency',
    'cycles',
    'subscription_notify_email',
    'subscription_notify_webhook',
    'subscription_notify_buyer',
  ]

  const ordered: string[] = []
  for (const key of allowedFields) {
    const value = fields[key]
    if (value !== '' && value !== undefined && value !== null) {
      ordered.push(`${key}=${payfastEncode(String(value).trim())}`)
    }
  }

  if (passphrase) {
    ordered.push(`passphrase=${payfastEncode(passphrase.trim())}`)
  }

  return md5(ordered.join('&')).toLowerCase()
}

export function buildItnSignature(params: URLSearchParams, passphrase: string) {
  const pairs: string[] = []

  for (const [key, value] of params.entries()) {
    if (key === 'signature') continue
    if (value === '') continue
    pairs.push(`${key}=${payfastEncode(value.trim())}`)
  }

  if (passphrase) {
    pairs.push(`passphrase=${payfastEncode(passphrase.trim())}`)
  }

  return md5(pairs.join('&')).toLowerCase()
}

export async function validateItnWithPayFast(bodyText: string, paymentBaseUrl: string) {
  const origin = new URL(paymentBaseUrl).origin
  const validateUrl = `${origin}/eng/query/validate`

  const response = await fetch(validateUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'SaaSiFy-PayFast-ITN-Validator',
    },
    body: bodyText,
  })

  const text = (await response.text()).trim().toUpperCase()
  return response.ok && text.includes('VALID')
}

export function buildApiSignature(input: Record<string, string | number | boolean>, passphrase: string) {
  const payload: Record<string, string> = {}

  for (const [key, value] of Object.entries(input)) {
    payload[key] = String(value)
  }

  if (passphrase) payload.passphrase = passphrase

  const ordered = Object.keys(payload)
    .sort((a, b) => a.localeCompare(b))
    .filter((key) => key !== 'signature')
    .map((key) => `${key}=${encodeURIComponent(payload[key])}`)
    .join('&')

  return md5(ordered).toLowerCase()
}

export async function callPayFastApi({
  method,
  path,
  query = {},
  body,
  merchantId,
  passphrase,
  testMode,
}: {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH'
  path: string
  query?: Record<string, string>
  body?: Record<string, unknown>
  merchantId: string
  passphrase: string
  testMode: boolean
}) {
  const timestamp = new Date().toISOString().replace('Z', '+0000')
  const effectiveQuery = { ...query }
  if (testMode) effectiveQuery.testing = 'true'

  const signature = buildApiSignature(
    {
      merchant-id: merchantId,
      version: PAYFAST_API_VERSION,
      timestamp,
      ...effectiveQuery,
      ...(body ?? {}),
    } as Record<string, string | number | boolean>,
    passphrase,
  )

  const url = new URL(`${PAYFAST_API_URL}/${path.replace(/^\//, '')}`)
  for (const [key, value] of Object.entries(effectiveQuery)) {
    url.searchParams.set(key, value)
  }

  const response = await fetch(url, {
    method,
    headers: {
      'merchant-id': merchantId,
      version: PAYFAST_API_VERSION,
      timestamp,
      signature,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  const responseText = await response.text()
  let responseData: unknown = null

  try {
    responseData = responseText ? JSON.parse(responseText) : null
  } catch {
    responseData = responseText
  }

  if (!response.ok) {
    throw new Error(typeof responseData === 'string' ? responseData : JSON.stringify(responseData))
  }

  return responseData
}

export function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    },
  })
}
