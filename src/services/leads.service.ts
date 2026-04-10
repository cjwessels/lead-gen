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

  const { data, error } = await supabase
    .from('leads')
    .insert({
      user_id: userId,
      name: lead.name,
      category: lead.category,
      city: lead.city,
      phone: lead.phone || null,
      website: lead.website || null,
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
