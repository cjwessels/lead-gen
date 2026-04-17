import { supabase } from '../lib/supabase'
import type { LeadNote } from '../types'

function mapRow(row: any): LeadNote {
  return {
    id: row.id,
    lead_id: row.lead_id,
    note_text: row.note_text,
    created_at: row.created_at,
  }
}

export async function fetchLeadNotes(leadId: string): Promise<LeadNote[]> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('lead_notes')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []).map(mapRow)
}

export async function addLeadNote(leadId: string, noteText: string): Promise<LeadNote> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('lead_notes')
    .insert({ lead_id: leadId, note_text: noteText })
    .select()
    .single()

  if (error) throw error
  return mapRow(data)
}
