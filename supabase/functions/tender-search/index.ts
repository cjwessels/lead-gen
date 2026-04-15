import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const OFFICIAL_URL = 'https://admin.etenders.gov.za/Home/opportunities?id=1'

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

    const { query } = await req.json()
    if (!query || typeof query !== 'string') return json({ error: 'Invalid query' }, 400)

    const expandedKeywords = expandKeywords(query)
    const html = await fetchOfficialHtml()
    const results = extractTenderCandidates(html, expandedKeywords)

    return json({ results })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error' }, 500)
  }
})

async function fetchOfficialHtml() {
  const response = await fetch(OFFICIAL_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 SaaSiFyLeads/1.0',
      'Accept': 'text/html,application/xhtml+xml',
    },
  })

  if (!response.ok) {
    throw new Error('Could not load active tender opportunities')
  }

  return await response.text()
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

function extractTenderCandidates(html: string, keywords: string[]): TenderResult[] {
  const rows = [
    ...(html.match(/<tr[\s\S]*?<\/tr>/gi) || []),
    ...(html.match(/<article[\s\S]*?<\/article>/gi) || []),
    ...(html.match(/<div[\s\S]*?class=["'][^"']*(?:result|card|tender)[^"']*["'][\s\S]*?<\/div>/gi) || []),
    ...(html.match(/<li[\s\S]*?<\/li>/gi) || []),
  ]

  const seen = new Set<string>()
  const results: TenderResult[] = []

  for (const row of rows) {
    const text = clean(row)
    if (!text || text.length < 80) continue

    const score = scoreTenderText(text, keywords)
    if (score < 25) continue

    const title = inferTitle(text)
    if (!title || seen.has(title)) continue
    seen.add(title)

    const dates = detectDates(text)
    const location = extractLocation(text)
    const summary = text.slice(0, 520)
    const qualification_notes = inferQualification(text)
    const publisher = inferPublisher(text)
    const focus_tags = keywords.filter((keyword) => text.toLowerCase().includes(keyword)).slice(0, 6)

    results.push({
      source_id: slugify(`${title}-${dates.start_date || ''}-${dates.end_date || ''}-${publisher}`),
      title,
      summary,
      publisher,
      province: location.province,
      location_text: location.location_text,
      is_national: location.is_national,
      start_date: dates.start_date,
      end_date: dates.end_date,
      qualification_notes,
      source_url: OFFICIAL_URL,
      score,
      keywords,
      focus_tags,
    })
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 30)
}

function scoreTenderText(text: string, keywords: string[]) {
  const normalized = text.toLowerCase()
  let score = 0

  keywords.forEach((keyword) => {
    if (normalized.includes(keyword)) score += keyword.length > 12 ? 18 : 10
  })

  if (/ict|information technology|network|office automation|managed services|support/i.test(text)) score += 16
  if (/closing date|compulsory briefing|cidb|csd|tax clearance|briefing session|briefing meeting|sbd/i.test(text)) score += 10
  if (/open|advertised|rfq|rfp|bid|quotation|tender/i.test(text)) score += 6
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
  const location_text = is_national
    ? 'National / Countrywide'
    : province
      ? province
      : cityMatch?.[1]

  return {
    province,
    location_text,
    is_national,
  }
}

function inferQualification(text: string) {
  const matches = [
    ...extractPhrase(text, /(?:qualification|requirements?|eligibility|mandatory|compulsory)[\s\S]{0,240}/i),
    ...extractPhrase(text, /(?:cidb|csd|tax clearance|briefing session|briefing meeting|sbd forms?|b-bbee|company registration)[\s\S]{0,240}/i),
  ]
  return matches[0] || ''
}

function inferPublisher(text: string) {
  const match = text.match(/(?:municipality|department|board|agency|soc|city of|council|university|commission)[\w\s\-&,]{0,80}/i)
  return match ? match[0].trim() : 'Official eTender source'
}

function extractPhrase(text: string, pattern: RegExp) {
  const match = text.match(pattern)
  return match ? [match[0].replace(/\s+/g, ' ').trim().slice(0, 240)] : []
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

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 120)
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

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}
