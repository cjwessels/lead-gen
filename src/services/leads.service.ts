import { supabase } from '../lib/supabase'
import type { Lead, LeadStatus } from '../types'

function mapRowToLead(row: any): Lead {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    category: row.category,
    city: row.city,
    phone: row.phone ?? '',
    website: row.website ?? '',
    rating: row.rating ?? 0,
    reviewCount: row.review_count ?? 0,
    score: row.score ?? 0,
    status: row.status,
    painPoints: row.pain_points ?? [],
    created_at: row.created_at,
  }
}

function normalizeWebsite(value?: string) {
  return (value || '').trim().toLowerCase()
}

function normalizePhone(value?: string) {
  return (value || '').replace(/\D/g, '')
}

export async function fetchSavedLeads(): Promise<Lead[]> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(mapRowToLead)
}

export async function saveLead(lead: Lead): Promise<Lead> {
  if (!supabase) throw new Error('Supabase is not configured')

  const { data: authData } = await supabase.auth.getUser()
  const userId = authData.user?.id
  if (!userId) throw new Error('No authenticated user found')

  const websiteKey = normalizeWebsite(lead.website)
  const phoneKey = normalizePhone(lead.phone)

  let query = supabase
    .from('leads')
    .select('*')
    .eq('user_id', userId)
    .eq('name', lead.name)
    .eq('city', lead.city)
    .limit(1)

  if (websiteKey) {
    query = query.eq('website_normalized', websiteKey)
  }

  const { data: existingRows, error: existingError } = await query
  if (existingError) throw existingError

  if (existingRows && existingRows.length > 0) {
    const existing = existingRows[0]
    const mergedPainPoints = Array.from(new Set([...(existing.pain_points || []), ...lead.painPoints]))

    const { data, error } = await supabase
      .from('leads')
      .update({
        category: lead.category,
        phone: lead.phone || existing.phone || null,
        phone_normalized: phoneKey || existing.phone_normalized || null,
        website: lead.website || existing.website || null,
        website_normalized: websiteKey || existing.website_normalized || null,
        rating: lead.rating || existing.rating || null,
        review_count: lead.reviewCount || existing.review_count || 0,
        score: Math.max(existing.score || 0, lead.score),
        pain_points: mergedPainPoints,
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) throw error
    return mapRowToLead(data)
  }

  const { data, error } = await supabase
    .from('leads')
    .insert({
      user_id: userId,
      name: lead.name,
      category: lead.category,
      city: lead.city,
      phone: lead.phone || null,
      phone_normalized: phoneKey || null,
      website: lead.website || null,
      website_normalized: websiteKey || null,
      rating: lead.rating || null,
      review_count: lead.reviewCount || 0,
      score: lead.score,
      status: lead.status,
      pain_points: lead.painPoints,
    })
    .select()
    .single()

  if (error) throw error
  return mapRowToLead(data)
}

export async function updateLeadStatus(id: string, status: LeadStatus): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase.from('leads').update({ status }).eq('id', id)
  if (error) throw error
}
