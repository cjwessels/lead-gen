const KNOWN_MULTI_WORD_CITIES = [
  'Cape Town',
  'Port Elizabeth',
  'East London',
  'Pietermaritzburg',
  'North West',
  'KwaZulu-Natal',
]

export interface StructuredSearchQuery {
  raw: string
  freeText: string
  text: string
  city?: string
  province?: string
  keyword?: string
  service?: string
  category?: string
  source?: string
  custom?: string
  terms: string[]
}

const FIELD_ALIASES: Record<string, keyof StructuredSearchQuery> = {
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

export function parseStructuredSearch(input: string): StructuredSearchQuery {
  const raw = input.trim()
  const query: StructuredSearchQuery = {
    raw,
    freeText: raw,
    text: '',
    terms: [],
  }

  let working = raw
  const matches = [...raw.matchAll(/(\w+):(?:"([^"]+)"|(\S+))/g)]

  for (const match of matches) {
    const fieldName = match[1]?.toLowerCase()
    const value = (match[2] || match[3] || '').trim()
    const mapped = fieldName ? FIELD_ALIASES[fieldName] : undefined

    if (mapped && value) {
      ;(query[mapped] as string | undefined) = value
    }

    working = working.replace(match[0], ' ')
  }

  const quotedPhrases = [...working.matchAll(/"([^"]+)"/g)].map((match) => match[1].trim()).filter(Boolean)
  quotedPhrases.forEach((phrase) => {
    if (!query.city && looksLikeLocationPhrase(phrase)) query.city = phrase
    working = working.replace(`"${phrase}"`, ' ')
  })

  working = working.replace(/\s+/g, ' ').trim()
  query.freeText = working

  const parts = [query.keyword, query.service, query.category, query.custom, query.freeText].filter(Boolean) as string[]
  query.text = parts.join(' ').replace(/\s+/g, ' ').trim()
  query.terms = Array.from(new Set(parts.flatMap((part) => part.split(/\s+/)).filter(Boolean)))

  if (!query.city) {
    const inferred = inferCityFromText(raw)
    if (inferred) query.city = inferred
  }

  return query
}

export function buildLeadSearchText(query: StructuredSearchQuery) {
  return [query.keyword, query.service, query.category, query.custom, query.freeText, query.city, query.province]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function buildTenderSearchText(query: StructuredSearchQuery) {
  return [query.keyword, query.service, query.category, query.custom, query.freeText]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function inferCityFromText(text: string) {
  const lower = text.toLowerCase()

  for (const city of KNOWN_MULTI_WORD_CITIES) {
    if (lower.includes(city.toLowerCase())) return city
  }

  const patterns = [
    /(?:^|\s)(cape town)(?:\s|$)/i,
    /(?:^|\s)(port elizabeth)(?:\s|$)/i,
    /(?:^|\s)(east london)(?:\s|$)/i,
    /(?:^|\s)(pietermaritzburg)(?:\s|$)/i,
    /(?:^|\s)(johannesburg)(?:\s|$)/i,
    /(?:^|\s)(pretoria)(?:\s|$)/i,
    /(?:^|\s)(durban)(?:\s|$)/i,
    /(?:^|\s)(bloemfontein)(?:\s|$)/i,
    /(?:^|\s)(polokwane)(?:\s|$)/i,
    /(?:^|\s)(nelspruit|mbombela)(?:\s|$)/i,
    /(?:^|\s)(kimberley)(?:\s|$)/i,
    /(?:^|\s)(stellenbosch)(?:\s|$)/i,
    /(?:^|\s)(george)(?:\s|$)/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) return titleCase(match[1])
  }

  return undefined
}

export function inferCityFromAddress(address?: string, preferredCity?: string) {
  if (preferredCity) return preferredCity
  if (!address) return 'South Africa'

  const inferred = inferCityFromText(address)
  if (inferred) return inferred

  const segments = address.split(',').map((item) => item.trim()).filter(Boolean)
  for (const segment of segments) {
    if (/south africa/i.test(segment)) continue
    if (segment.length > 2 && /^[A-Za-z\s-]+$/.test(segment)) return segment
  }

  return 'South Africa'
}

function looksLikeLocationPhrase(value: string) {
  return /(?:cape town|johannesburg|pretoria|durban|port elizabeth|east london|bloemfontein|polokwane|mbombela|nelspruit|kimberley|stellenbosch|george|gauteng|western cape|eastern cape|kwazul[ -]?natal|north west)/i.test(value)
}

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}
