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

interface TenderResult {
  source_id: string
  title: string
  summary: string
  publisher: string
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
  ]

  const seen = new Set<string>()
  const results: TenderResult[] = []

  for (const row of rows) {
    const text = clean(row)
    if (!text || text.length < 60) continue

    const score = scoreTenderText(text, keywords)
    if (score < 25) continue

    const title = inferTitle(text)
    if (!title || seen.has(title)) continue
    seen.add(title)

    const dates = [...text.matchAll(/\b(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})\b/g)].map((match) => toIsoDate(match[1]))
    const summary = text.slice(0, 420)
    const qualification_notes = inferQualification(text)
    const publisher = inferPublisher(text)
    const focus_tags = keywords.filter((keyword) => text.toLowerCase().includes(keyword)).slice(0, 6)

    results.push({
      source_id: slugify(`${title}-${dates.join('-') || publisher}`),
      title,
      summary,
      publisher,
      start_date: dates[0],
      end_date: dates[1],
      qualification_notes,
      source_url: OFFICIAL_URL,
      score,
      keywords,
      focus_tags,
    })
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 24)
}

function scoreTenderText(text: string, keywords: string[]) {
  const normalized = text.toLowerCase()
  let score = 0

  keywords.forEach((keyword) => {
    if (normalized.includes(keyword)) score += keyword.length > 12 ? 18 : 10
  })

  if (/ict|information technology|network|office automation|managed services|support/i.test(text)) score += 16
  if (/closing date|compulsory briefing|cidb|sbd|tax clearance|csd/i.test(text)) score += 10
  if (/open|advertised|rfq|rfp|bid/i.test(text)) score += 6

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

function inferQualification(text: string) {
  const matches = [
    ...extractPhrase(text, /(?:qualification|requirements?|eligibility|mandatory|compulsory)[\s\S]{0,220}/i),
    ...extractPhrase(text, /(?:cidb|csd|tax clearance|briefing session|briefing meeting|sbd forms?)[\s\S]{0,220}/i),
  ]

  return matches[0] || ''
}

function inferPublisher(text: string) {
  const match = text.match(/(?:municipality|department|board|agency|soc|city of|council|university|commission)[\w\s\-&,]{0,80}/i)
  return match ? match[0].trim() : 'Official eTender source'
}

function extractPhrase(text: string, pattern: RegExp) {
  const match = text.match(pattern)
  return match ? [match[0].replace(/\s+/g, ' ').trim().slice(0, 220)] : []
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
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const [day, month, year] = value.split('/')
  if (!day || !month || !year) return undefined
  return `${year}-${month}-${day}`
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
