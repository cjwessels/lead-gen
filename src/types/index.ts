export type PlanCode = 'free' | 'starter' | 'pro'
export type LeadStatus = 'new' | 'qualified' | 'contacted' | 'follow-up' | 'proposal-sent' | 'won' | 'lost'
export type LeadHeat = 'hot' | 'warm' | 'cool' | 'low'
export type TenderStatus = 'identified' | 'reviewing' | 'qualifying' | 'bid-prep' | 'submitted' | 'won' | 'lost'
export type TenderSourceType = 'government' | 'platform' | 'private_sector'

export interface Lead {
  id: string
  user_id?: string
  name: string
  category: string
  city: string
  phone?: string
  website?: string
  rating?: number
  reviewCount?: number
  score: number
  status: LeadStatus
  painPoints: string[]
  created_at?: string
}

export interface LeadNote {
  id: string
  lead_id: string
  note_text: string
  created_at: string
}

export interface SearchResponse {
  places: Array<{
    id?: string
    displayName?: { text?: string }
    formattedAddress?: string
    websiteUri?: string
    nationalPhoneNumber?: string
    rating?: number
    userRatingCount?: number
    primaryTypeDisplayName?: { text?: string }
  }>
}

export interface CheckoutPayload {
  paymentUrl: string
  formFields: Record<string, string>
}

export interface Profile {
  id: string
  email: string
  full_name?: string
  plan: PlanCode
  monthly_searches_used: number
  monthly_search_limit: number
}

export interface OutreachPack {
  emailSubject: string
  emailBody: string
  whatsappBody: string
  callOpener: string
  source: 'local' | 'ai'
}

export interface TenderSearchResult {
  source_id: string
  source_type: TenderSourceType
  source_label: string
  title: string
  summary: string
  publisher: string
  province?: string
  location_text?: string
  is_national?: boolean
  start_date?: string
  end_date?: string
  qualification_notes?: string
  source_url?: string
  score: number
  keywords: string[]
  focus_tags: string[]
}

export interface TenderSearchResponse {
  results: TenderSearchResult[]
  page: number
  pageSize: number
  hasMore: boolean
  total?: number
  source: 'multi_source'
}

export interface Tender {
  id: string
  user_id?: string
  source_id: string
  source_type: TenderSourceType
  source_label: string
  title: string
  summary: string
  publisher: string
  province?: string
  location_text?: string
  is_national?: boolean
  start_date?: string
  end_date?: string
  qualification_notes?: string
  source_url?: string
  score: number
  keywords: string[]
  focus_tags: string[]
  status: TenderStatus
  created_at?: string
}

export interface TenderNote {
  id: string
  tender_id: string
  note_text: string
  created_at: string
}
