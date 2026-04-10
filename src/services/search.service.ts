import { mockLeads } from '../data/mockLeads'
import { scoreLead } from '../lib/leadScoring'
import type { Lead, SearchResponse } from '../types'

function toLeadModel(item: SearchResponse['places'][number], cityHint: string): Lead {
  const category = item.primaryTypeDisplayName?.text || 'Business'
  const website = item.websiteUri || ''
  const reviewCount = item.userRatingCount || 0
  const lead: Lead = {
    id: item.id || crypto.randomUUID(),
    name: item.displayName?.text || 'Unnamed business',
    category,
    city: cityHint,
    phone: item.nationalPhoneNumber || '',
    website,
    rating: item.rating || 0,
    reviewCount,
    score: 0,
    status: 'new',
    painPoints: website
      ? ['Likely needs quote automation', 'Needs better lead capture']
      : ['No website', 'Likely manual lead process'],
  }
  lead.score = scoreLead(lead)
  return lead
}

export async function searchPlaces(query: string): Promise<Lead[]> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return mockLeads.filter((lead) =>
      `${lead.name} ${lead.category} ${lead.city}`.toLowerCase().includes(query.toLowerCase()),
    )
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/places-search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify({ query }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'Search failed')
  }

  const data = (await response.json()) as SearchResponse
  const cityHint = query.split(' ').slice(-1)[0] || 'South Africa'
  return (data.places || []).map((item) => toLeadModel(item, cityHint))
}
