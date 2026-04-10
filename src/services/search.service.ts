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
    painPoints: website ? ['Needs stronger lead capture', 'Could use quote automation'] : ['No website', 'Likely manual admin'],
  }

  lead.score = scoreLead(lead)
  return lead
}

export async function searchPlaces(query: string): Promise<Lead[]> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) throw new Error('Supabase env vars are required for live search')

  const response = await fetch(`${supabaseUrl}/functions/v1/places-search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify({ query }),
  })

  const payload = await response.json()
  if (!response.ok) throw new Error(payload.error || 'Search failed')

  const cityHint = query.split(' ').slice(-1)[0] || 'South Africa'
  return (payload.places || []).map((item: SearchResponse['places'][number]) => toLeadModel(item, cityHint))
}
