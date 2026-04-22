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
  source_type: 'government' | 'platform' | 'private_sector'
  source_label: string
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
  source_material?: string
  contact_person?: string
  contact_email?: string
  contact_phone?: string
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

    const parsed = parseStructuredSearch(query)
    const keywords = expandKeywords(buildTenderSearchText(parsed))
    const [governmentSource, platformResults] = await Promise.all([
      fetchStructuredGovernmentSource(Number(page), Number(pageSize), keywords),
      fetchPlatformSources(keywords),
    ])

    const merged = dedupeResults([
      ...governmentSource.results,
      ...platformResults,
    ]).filter((item) => matchesStructuredFilters(item, parsed))
      .sort((a, b) => b.score - a.score)

    const pageStart = (Number(page) - 1) * Number(pageSize)
    const pageEnd = pageStart + Number(pageSize)
    const paged = merged.slice(pageStart, pageEnd)
    const total = merged.length
    const hasMore = pageEnd < total

    return json({
      results: paged,
      page: Number(page),
      pageSize: Number(pageSize),
      hasMore,
      total,
      source: 'multi_source',
    })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error' }, 500)
  }
})

async function fetchStructuredGovernmentSource(page: number, pageSize: number, keywords: string[]) {
  const now = new Date()
  const dateTo = now.toISOString().slice(0, 10)
  const dateFrom = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const apiPageSize = Math.max(pageSize * 3, 60)

  const url = `${OCDS_API_BASE}?PageNumber=${page}&PageSize=${apiPageSize}&dateFrom=${dateFrom}&dateTo=${dateTo}`
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 SaaSiFyLeads/1.0',
    },
  })

  if (!response.ok) {
    throw new Error('Could not load structured tender data')
  }

  const raw = await response.json()
  const rows = extractRows(raw)

  const results = rows
    .map((row) => toGovernmentTenderResult(row, keywords))
    .filter((item): item is TenderResult => !!item)
    .filter((item) => item.score >= 18)

  return { results }
}

async function fetchPlatformSources(keywords: string[]) {
  const urls = inferPlatformUrls(keywords)

  const settled = await Promise.allSettled(
    urls.map(async (source) => {
      const response = await fetch(source.url, {
        headers: {
          'Accept': 'text/html,application/xhtml+xml',
          'User-Agent': 'Mozilla/5.0 SaaSiFyLeads/1.0',
        },
      })
      if (!response.ok) return []
      const html = await response.text()
      return extractPlatformCandidates(html, source.label, source.type, source.url, keywords)
    }),
  )

  return settled.flatMap((item) => (item.status === 'fulfilled' ? item.value : []))
}

function inferPlatformUrls(keywords: string[]) {
  const normalized = keywords.join(' ').toLowerCase()
  const sources: Array<{ label: string; type: 'platform' | 'private_sector'; url: string }> = []

  sources.push({ label: 'OnlineTenders IT & Telecoms', type: 'platform', url: 'https://www.onlinetenders.co.za/tenders/south-africa/it-and-telecoms' })
  sources.push({ label: 'TenderAlerts Private Sector', type: 'private_sector', url: 'https://tenderalerts.co.za/issuer/other-private-sector' })

  if (/office automation|document management|printer|copier|multifunction/.test(normalized)) {
    sources.push({ label: 'TenderAlerts Office Equipment', type: 'platform', url: 'https://tenderalerts.co.za/categories/view/34/Office-equipment-and-stationery' })
    sources.push({ label: 'TenderBulletins Office Equipment', type: 'platform', url: 'https://tenderbulletins.co.za/tender-category/office-equipment/' })
  }

  if (/network|managed services|it support|cybersecurity|ict/.test(normalized)) {
    sources.push({ label: 'TenderAlerts IT Networking', type: 'platform', url: 'https://tenderalerts.co.za/categories/view/28/IT-networking-and-telecommunications' })
    sources.push({ label: 'TenderBulletins ICT Support', type: 'platform', url: 'https://tenderbulletins.co.za/tender-category/ict-hardware-software-and-network-support-services/' })
  }

  if (/automation/.test(normalized)) {
    sources.push({ label: 'OnlineTenders Electrical & Automation', type: 'platform', url: 'https://www.onlinetenders.co.za/tenders/south-africa/electrical-and-automation' })
  }

  const deduped = new Map<string, { label: string; type: 'platform' | 'private_sector'; url: string }>()
  sources.forEach((item) => deduped.set(item.url, item))
  return Array.from(deduped.values())
}

function extractPlatformCandidates(
  html: string,
  sourceLabel: string,
  sourceType: 'platform' | 'private_sector',
  sourceUrl: string,
  keywords: string[],
): TenderResult[] {
  const blocks = [
    ...(html.match(/<article[\s\S]*?<\/article>/gi) || []),
    ...(html.match(/<li[\s\S]*?<\/li>/gi) || []),
    ...(html.match(/<div[\s\S]*?class=["'][^"']*(?:tender|result|listing|item|card)[^"']*["'][\s\S]*?<\/div>/gi) || []),
  ]

  const seen = new Set<string>()
  const results: TenderResult[] = []

  for (const block of blocks) {
    const text = clean(block)
    if (!text || text.length < 60) continue
    const score = scoreTenderText(text, keywords)
    if (score < 16) continue

    const title = inferTitle(text)
    if (!title || seen.has(title)) continue
    seen.add(title)

    const dates = detectDates(text)
    const location = extractLocation(text)
    const publisher = inferPublisher(text) || sourceLabel
    const qualification_notes = inferQualification(text)
    const contact = extractContactDetails(text)
    const focus_tags = keywords.filter((keyword) => text.toLowerCase().includes(keyword)).slice(0, 6)

    results.push({
      source_id: slugify(`${sourceLabel}-${title}-${dates.end_date || ''}`),
      source_type: sourceType,
      source_label: sourceLabel,
      title,
      summary: text.slice(0, 520),
      publisher,
      province: location.province,
      location_text: location.location_text,
      is_national: location.is_national,
      start_date: dates.start_date,
      end_date: dates.end_date,
      qualification_notes,
      source_url: sourceUrl,
      source_material: text.slice(0, 1200),
      contact_person: contact.contact_person,
      contact_email: contact.contact_email,
      contact_phone: contact.contact_phone,
      score: Math.min(score + (sourceType === 'private_sector' ? 4 : 0), 100),
      keywords,
      focus_tags,
    })
  }

  return results.slice(0, 18)
}

function toGovernmentTenderResult(row: any, keywords: string[]): TenderResult | null {
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
  const contact = extractGovernmentContact(row, combined)
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
    source_type: 'government',
    source_label: 'Official eTender / OCDS',
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
    source_material: combined.slice(0, 1200),
    contact_person: contact.contact_person,
    contact_email: contact.contact_email,
    contact_phone: contact.contact_phone,
    score,
    keywords,
    focus_tags,
  }
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

function dedupeResults(results: TenderResult[]) {
  const map = new Map<string, TenderResult>()
  for (const item of results) {
    const key = item.source_id || slugify(`${item.title}-${item.publisher}`)
    const existing = map.get(key)
    if (!existing || item.score > existing.score) {
      map.set(key, item)
    }
  }
  return Array.from(map.values())
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

function inferTitle(text: string) {
  const line = text
    .split(/(?<=[.!?])\s+|\s{2,}/)
    .map((item) => item.trim())
    .find((item) => item.length > 18)

  if (!line) return ''
  return line.slice(0, 180)
}

function detectDates(text: string) {
  const iso = [...text.matchAll(/\b(\d{4}-\d{2}-\d{2})\b/g)].map((match) => match[1])
  const slash = [...text.matchAll(/\b(\d{2}\/\d{2}\/\d{4})\b/g)].map((match) => toIsoDate(match[1]))
  const written = [...text.matchAll(/\b(\d{1,2}\s+(?:Jan|January|Feb|February|Mar|March|Apr|April|May|Jun|June|Jul|July|Aug|August|Sep|September|Oct|October|Nov|November|Dec|December)\s+\d{4})\b/gi)].map((match) => fromWrittenDate(match[1]))
  const dates = [...iso, ...slash, ...written].filter(Boolean) as string[]
  dates.sort()
  return {
    start_date: dates[0],
    end_date: dates[1] || dates[0],
  }
}

function extractLocation(text: string) {
  const normalized = text.toLowerCase()
  const is_national = /national|countrywide|all provinces|nationwide/.test(normalized)
  const province = PROVINCES.find((item) => normalized.includes(item.toLowerCase()))
  const cityMatch = text.match(/(?:in|at|for)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\s+(?:Municipality|Province|District|Metro|Region)?/)
  const location_text = is_national ? 'National / Countrywide' : province || cityMatch?.[1]
  return { province, location_text, is_national }
}

function inferQualification(text: string) {
  const matches = [
    ...extractPhrase(text, /(?:qualification|requirements?|eligibility|mandatory|compulsory)[\s\S]{0,220}/i),
    ...extractPhrase(text, /(?:cidb|csd|tax clearance|briefing session|briefing meeting|sbd forms?|b-bbee|company registration)[\s\S]{0,220}/i),
  ]
  return matches[0] || ''
}

function extractContactDetails(text: string) {
  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
  const phoneMatch = text.match(/(?:\+27|0)(?:\s|[-()]|\d){8,16}\d/)
  const personMatch = text.match(/(?:contact|enquiries?|attention|attn|for more information(?: contact)?)[\s:,-]{0,6}([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z.'-]+){0,3})/i)

  return {
    contact_person: personMatch?.[1]?.trim(),
    contact_email: sanitizeEmail(emailMatch?.[0]),
    contact_phone: sanitizePhone(phoneMatch?.[0]),
  }
}

function extractGovernmentContact(row: any, combined: string) {
  const contactFromText = extractContactDetails(combined)
  const contactPoint = row?.buyer?.contactPoint || row?.tender?.procuringEntity?.contactPoint || row?.contactPoint || {}
  const parties = Array.isArray(row?.parties) ? row.parties : []
  const partyContact = parties.find((party: any) => party?.contactPoint)?.contactPoint || {}

  return {
    contact_person: pickString(
      contactFromText.contact_person,
      contactPoint?.name,
      partyContact?.name,
    ),
    contact_email: sanitizeEmail(pickString(
      contactFromText.contact_email,
      contactPoint?.email,
      partyContact?.email,
    )),
    contact_phone: sanitizePhone(pickString(
      contactFromText.contact_phone,
      contactPoint?.telephone,
      partyContact?.telephone,
    )),
  }
}

function sanitizeEmail(value?: string) {
  if (!value) return undefined
  return value.replace(/[.,;:]+$/, '').trim()
}

function sanitizePhone(value?: string) {
  if (!value) return undefined
  return value.replace(/\s+/g, ' ').replace(/[.,;:]+$/, '').trim()
}

function extractPhrase(text: string, pattern: RegExp) {
  const match = text.match(pattern)
  return match ? [match[0].replace(/\s+/g, ' ').trim().slice(0, 220)] : []
}

function inferPublisher(text: string) {
  const match = text.match(/(?:municipality|department|board|agency|soc|city of|council|university|commission|pty ltd|limited|group)[\w\s\-&,]{0,80}/i)
  return match ? match[0].trim() : ''
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

function clean(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

function toIsoDate(value: string) {
  const [day, month, year] = value.split('/')
  if (!day || !month || !year) return undefined
  return `${year}-${month}-${day}`
}

function fromWrittenDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined
  return date.toISOString().slice(0, 10)
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 120)
}

const FIELD_ALIASES = {
  city: 'city',
  town: 'city',
  location: 'city',
  province: 'province',
  keyword: 'keyword',
  keywords: 'keyword',
  service: 'service',
  category: 'category',
  source: 'source',
  custom: 'custom',
  text: 'custom',
  q: 'custom',
}

function parseStructuredSearch(input: string) {
  const query = {
    raw: (input || '').trim(),
    freeText: (input || '').trim(),
    city: undefined,
    province: undefined,
    keyword: undefined,
    service: undefined,
    category: undefined,
    source: undefined,
    custom: undefined,
  }

  let working = query.raw
  const matches = [...query.raw.matchAll(/(\w+):(?:"([^"]+)"|(\S+))/g)]

  for (const match of matches) {
    const key = match[1]?.toLowerCase()
    const value = (match[2] || match[3] || '').trim()
    const mapped = key ? FIELD_ALIASES[key] : undefined
    if (mapped && value) query[mapped] = value
    working = working.replace(match[0], ' ')
  }

  working = working.replace(/\s+/g, ' ').trim()
  query.freeText = working
  return query
}

function buildTenderSearchText(query) {
  return [query.keyword, query.service, query.category, query.custom, query.freeText]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function matchesStructuredFilters(item: TenderResult, query) {
  if (query.source) {
    const source = query.source.toLowerCase()
    if (
      item.source_type.toLowerCase() !== source &&
      item.source_label.toLowerCase() !== source &&
      !item.source_label.toLowerCase().includes(source)
    ) {
      return false
    }
  }

  if (query.province) {
    const province = query.province.toLowerCase()
    if ((item.province || '').toLowerCase() !== province) return false
  }

  if (query.city) {
    const city = query.city.toLowerCase()
    const haystack = `${item.location_text || ''} ${item.summary} ${item.title}`.toLowerCase()
    if (!haystack.includes(city)) return false
  }

  return true
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

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}
