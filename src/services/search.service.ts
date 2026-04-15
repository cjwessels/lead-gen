import { supabase } from '../lib/supabase'
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
      ? ['Needs stronger lead capture', 'Could use quote automation']
      : ['No website', 'Likely manual admin'],
  }

  lead.score = scoreLead(lead)
  return lead
}

export async function searchPlaces(query: string): Promise<Lead[]> {
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
    throw new Error('You must be signed in to search')
  }

  const { data, error } = await supabase.functions.invoke('places-search', {
  body: { query },
  headers: {
    Authorization: `Bearer ${session.access_token}`,
  },
})

  if (error) {
    throw new Error(error.message || 'Search failed')
  }

  

  const payload = data as SearchResponse
  const cityHint = query.split(' ').slice(-1)[0] || 'South Africa'

  return (payload.places || []).map((item) => toLeadModel(item, cityHint))
}