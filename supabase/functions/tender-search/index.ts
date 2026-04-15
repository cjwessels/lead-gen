import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const OCDS_API_BASE = 'https://ocds-api.etenders.gov.za/api/OCDSReleases'

const SMART_KEYWORDS: Record<string, string[]> = {
  'managed services': ['managed services', 'outsourcing', 'support services', 'maintenance and support', 'service desk'],
  'office automation': ['office automation', 'copiers', 'printers', 'multifunction', 'document management', 'print services'],
  'network management': ['network management', 'network monitoring', 'lan', 'wan', 'switching', 'routing', 'wifi'],
  'it support': ['it support', 'helpdesk', 'desktop support', 'technical support', 'ict support'],
  cybersecurity: ['cybersecurity', 'security operations', 'soc', 'endpoint security', 'firewall', 'managed detection'],
  'document management': ['document management', 'records management', 'digitisation', 'scanning', 'ecm'],
}

const PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
  'Western Cape',
]

interface TenderResult {
  source_id: string
  title: string
  summary: string
  publisher: string
  province?: string
  location_text?: string
  is_national?: boolean
  start_date?: string
  end_date?: string
  qualification_notes?: string
  source_url?: string
  score: number
  keywords: string[]
  focus_tags: string[]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
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
    if (!auth.user) return json({ error: 'Unauthorized' }, 401)

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', auth.user.id)
      .single()

    if (!profile || profile.plan !== 'pro') {
      return json({ error: 'Tender search is available to Pro subscribers only' }, 403)
    }

    const { query, page = 1, pageSize = 20 } = await req.json()
    if (!query || typeof query !== 'string') return json({ error: 'Invalid query' }, 400)

    const keywords = expandKeywords(query)
    const raw = await fetchStructuredReleases(Number(page), Number(pageSize))
    const rows = extractRows(raw)

    const scored = rows
      .map((row) => toTenderResult(row, keywords))
      .filter((item): item is TenderResult => !!item)
      .sort((a, b) => b.score - a.score)

    const filtered = scored.filter((item) => item.score >= 18)

    const total = Number(
      raw?.TotalRecords ??
      raw?.totalRecords ??
      raw?.Total ??
      raw?.total ??
      raw?.Count ??
      filtered.length
    )

    const hasMore = inferHasMore(raw, Number(page), Number(pageSize), filtered.length, total)

    return json({
      results: filtered,
      page: Number(page),
      pageSize: Number(pageSize),
      hasMore,
      total,
      source: 'ocds_api',
    })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error' }, 500)
  }
})

async function fetchStructuredReleases(page: number, pageSize: number) {
  const now = new Date()
  const dateTo = now.toISOString().slice(0, 10)
  const dateFrom = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const url = `${OCDS_API_BASE}?PageNumber=${page}&PageSize=${pageSize}&dateFrom=${dateFrom}&dateTo=${dateTo}`
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 SaaSiFyLeads/1.0',
    },
  })

  if (!response.ok) {
    throw new Error('Could not load structured tender data')
  }

  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json') && !contentType.includes('text/json')) {
    const text = await response.text()
    throw new Error(`Unexpected tender API response: ${text.slice(0, 120)}`)
  }

  return await response.json()
}

function extractRows(raw: any): any[] {
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw?.results)) return raw.results
  if (Array.isArray(raw?.data)) return raw.data
  if (Array.isArray(raw?.releases)) return raw.releases
  if (Array.isArray(raw?.records)) return raw.records
  if (Array.isArray(raw?.value)) return raw.value
  if (Array.isArray(raw?.items)) return raw.items
  return []
}

function expandKeywords(query: string) {
  const raw = query
    .toLowerCase()
    .split(/[;,]+/)
    .map((item) => item.trim())
    .filter(Boolean)

  const expanded = new Set<string>(raw)
  raw.forEach((term) => {
    expanded.add(term)
    for (const [key, synonyms] of Object.entries(SMART_KEYWORDS)) {
      if (term.includes(key) || key.includes(term)) {
        synonyms.forEach((value) => expanded.add(value))
      }
    }
  })

  return Array.from(expanded)
}

function toTenderResult(row: any, keywords: string[]): TenderResult | null {
  const title =
    pickString(
      row?.tender?.title,
      row?.title,
      row?.TenderNotice,
      row?.description,
      row?.tender?.description
    ) || ''

  const description = pickString(
    row?.tender?.description,
    row?.description,
    row?.summary,
    row?.tender?.items?.[0]?.description
  ) || ''

  const publisher =
    pickString(
      row?.buyer?.name,
      row?.procuringEntity,
      row?.publisher,
      findPartyNameByRole(row?.parties, ['buyer', 'procuringEntity']),
      row?.tender?.procuringEntity?.name
    ) || 'Official eTender source'

  const combined = `${title} ${description} ${publisher} ${serializeNestedText(row)}`.replace(/\s+/g, ' ').trim()
  if (!combined || combined.length < 20) return null

  const score = scoreTenderText(combined, keywords)
  const summary = combined.slice(0, 520)

  const tenderPeriod = row?.tender?.tenderPeriod ?? row?.tenderPeriod ?? {}
  const start_date = normalizeDate(pickString(tenderPeriod?.startDate, row?.date, row?.publishedDate))
  const end_date = normalizeDate(pickString(tenderPeriod?.endDate, row?.closingDate, row?.closeDate, row?.tender?.closingDate))

  const location = extractLocation(combined)
  const qualification_notes = inferQualification(combined)
  const source_id = pickString(row?.ocid, row?.id, row?.releaseID, row?.releaseId) || slugify(`${title}-${publisher}-${end_date || ''}`)
  const source_url =
    pickString(
      row?.url,
      row?.uri,
      row?.tender?.documents?.[0]?.url,
      row?.documents?.[0]?.url
    ) || 'https://www.etenders.gov.za/'

  const focus_tags = keywords.filter((keyword) => combined.toLowerCase().includes(keyword)).slice(0, 6)

  return {
    source_id,
    title: title.slice(0, 220),
    summary,
    publisher,
    province: location.province,
    location_text: location.location_text,
    is_national: location.is_national,
    start_date,
    end_date,
    qualification_notes,
    source_url,
    score,
    keywords,
    focus_tags,
  }
}

function scoreTenderText(text: string, keywords: string[]) {
  const normalized = text.toLowerCase()
  let score = 0

  keywords.forEach((keyword) => {
    if (normalized.includes(keyword)) score += keyword.length > 12 ? 18 : 10
  })

  if (/ict|information technology|network|office automation|managed services|support|software|automation/i.test(text)) score += 14
  if (/closing date|compulsory briefing|cidb|csd|tax clearance|briefing session|briefing meeting|sbd|functionality/i.test(text)) score += 8
  if (/rfq|rfp|bid|quotation|tender|proposal/i.test(text)) score += 8
  if (/national|countrywide|all provinces/i.test(normalized)) score += 6
  if (PROVINCES.some((province) => normalized.includes(province.toLowerCase()))) score += 4

  return Math.min(score, 100)
}

function extractLocation(text: string) {
  const normalized = text.toLowerCase()
  const is_national = /national|countrywide|all provinces|nationwide/.test(normalized)
  const province = PROVINCES.find((item) => normalized.includes(item.toLowerCase()))
  const cityMatch = text.match(/(?:in|at|for)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\s+(?:Municipality|Province|District|Metro|Region)?/)
  const location_text = is_national ? 'National / Countrywide' : province || cityMatch?.[1]

  return {
    province,
    location_text,
    is_national,
  }
}

function inferQualification(text: string) {
  const matches = [
    ...extractPhrase(text, /(?:qualification|requirements?|eligibility|mandatory|compulsory)[\s\S]{0,220}/i),
    ...extractPhrase(text, /(?:cidb|csd|tax clearance|briefing session|briefing meeting|sbd forms?|b-bbee|company registration)[\s\S]{0,220}/i),
  ]
  return matches[0] || ''
}

function extractPhrase(text: string, pattern: RegExp) {
  const match = text.match(pattern)
  return match ? [match[0].replace(/\s+/g, ' ').trim().slice(0, 220)] : []
}

function findPartyNameByRole(parties: any[] | undefined, roles: string[]) {
  if (!Array.isArray(parties)) return undefined
  const found = parties.find((party) => Array.isArray(party?.roles) && party.roles.some((role: string) => roles.includes(role)))
  return found?.name
}

function pickString(...values: any[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return undefined
}

function serializeNestedText(input: any): string {
  if (!input) return ''
  if (typeof input === 'string') return input
  if (typeof input === 'number' || typeof input === 'boolean') return String(input)
  if (Array.isArray(input)) return input.map(serializeNestedText).join(' ')
  if (typeof input === 'object') return Object.values(input).map(serializeNestedText).join(' ')
  return ''
}

function normalizeDate(value?: string) {
  if (!value) return undefined
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10)
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined
  return date.toISOString().slice(0, 10)
}

function inferHasMore(raw: any, page: number, pageSize: number, returnedCount: number, total: number) {
  if (typeof raw?.HasMore === 'boolean') return raw.HasMore
  if (typeof raw?.hasMore === 'boolean') return raw.hasMore
  if (typeof total === 'number' && total > 0) return page * pageSize < total
  return returnedCount >= pageSize
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 120)
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}
