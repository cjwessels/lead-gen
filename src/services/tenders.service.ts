import { supabase } from '../lib/supabase'
import type { Tender, TenderSearchResult, TenderStatus } from '../types'

function mapRowToTender(row: any): Tender {
  return {
    id: row.id,
    user_id: row.user_id,
    source_id: row.source_id,
    title: row.title,
    summary: row.summary ?? '',
    publisher: row.publisher ?? '',
    start_date: row.start_date ?? undefined,
    end_date: row.end_date ?? undefined,
    qualification_notes: row.qualification_notes ?? undefined,
    source_url: row.source_url ?? undefined,
    score: row.score ?? 0,
    keywords: row.keywords ?? [],
    focus_tags: row.focus_tags ?? [],
    status: row.status,
    created_at: row.created_at,
  }
}

export async function searchTenders(query: string): Promise<TenderSearchResult[]> {
  if (!supabase) throw new Error('Supabase is not configured')

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) throw sessionError
  if (!session?.access_token) throw new Error('You must be signed in to search tenders')

  const { data, error } = await supabase.functions.invoke('tender-search', {
    body: { query },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  })

  if (error) throw new Error(error.message || 'Tender search failed')
  return ((data?.results as TenderSearchResult[]) || []).sort((a, b) => b.score - a.score)
}

export async function fetchSavedTenders(): Promise<Tender[]> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase.from('tenders').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(mapRowToTender)
}

export async function saveTender(tender: TenderSearchResult): Promise<Tender> {
  if (!supabase) throw new Error('Supabase is not configured')

  const { data: authData } = await supabase.auth.getUser()
  const userId = authData.user?.id
  if (!userId) throw new Error('No authenticated user found')

  const { data: existingRows, error: lookupError } = await supabase
    .from('tenders')
    .select('*')
    .eq('user_id', userId)
    .eq('source_id', tender.source_id)
    .limit(1)

  if (lookupError) throw lookupError

  if (existingRows && existingRows.length > 0) {
    return mapRowToTender(existingRows[0])
  }

  const { data, error } = await supabase
    .from('tenders')
    .insert({
      user_id: userId,
      source_id: tender.source_id,
      title: tender.title,
      summary: tender.summary,
      publisher: tender.publisher,
      start_date: tender.start_date || null,
      end_date: tender.end_date || null,
      qualification_notes: tender.qualification_notes || null,
      source_url: tender.source_url || null,
      score: tender.score,
      keywords: tender.keywords,
      focus_tags: tender.focus_tags,
      status: 'identified',
    })
    .select()
    .single()

  if (error) throw error
  return mapRowToTender(data)
}

export async function updateTenderStatus(id: string, status: TenderStatus): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase.from('tenders').update({ status }).eq('id', id)
  if (error) throw error
}
