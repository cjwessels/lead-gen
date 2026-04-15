export type PlanCode = 'free' | 'starter' | 'pro'
export type LeadStatus = 'new' | 'qualified' | 'contacted' | 'follow-up' | 'proposal-sent' | 'won' | 'lost'
export type LeadHeat = 'hot' | 'warm' | 'cool' | 'low'

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
