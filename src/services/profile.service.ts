import { supabase } from '../lib/supabase'
import type { Profile } from '../types'

export async function fetchProfile(): Promise<Profile | null> {
  if (!supabase) throw new Error('Supabase is not configured')

  const { data: authData } = await supabase.auth.getUser()
  const userId = authData.user?.id
  if (!userId) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, plan, monthly_searches_used, monthly_search_limit')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}
