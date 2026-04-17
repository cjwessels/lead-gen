import { supabase } from '../lib/supabase'
import type { TenderNote } from '../types'

function mapRow(row: any): TenderNote {
  return {
    id: row.id,
    tender_id: row.tender_id,
    note_text: row.note_text,
    created_at: row.created_at,
  }
}

export async function fetchTenderNotes(tenderId: string): Promise<TenderNote[]> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('tender_notes')
    .select('*')
    .eq('tender_id', tenderId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []).map(mapRow)
}

export async function addTenderNote(tenderId: string, noteText: string): Promise<TenderNote> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('tender_notes')
    .insert({ tender_id: tenderId, note_text: noteText })
    .select()
    .single()

  if (error) throw error
  return mapRow(data)
}
