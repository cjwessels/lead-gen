import type { Lead, LeadHeat } from '../types'

export function scoreLead(input: Partial<Lead>): number {
  let score = 0

  if (!input.website) score += 40
  if (input.phone && !input.website) score += 20
  if ((input.rating ?? 5) < 4) score += 18
  if ((input.reviewCount ?? 0) < 10) score += 16
  else if ((input.reviewCount ?? 0) < 30) score += 8

  if (input.category?.toLowerCase().includes('panel')) score += 8
  if (input.category?.toLowerCase().includes('logistics')) score += 8
  if (input.category?.toLowerCase().includes('plumb')) score += 8
  if (input.category?.toLowerCase().includes('elect')) score += 8
  if (input.city?.toLowerCase().includes('cape')) score += 4

  if (input.website) score -= 10
  if ((input.rating ?? 0) >= 4.5 && (input.reviewCount ?? 0) > 50) score -= 18
  if (!input.phone && !input.website) score -= 6

  return Math.max(0, Math.min(score, 100))
}

export function getLeadHeat(score: number): LeadHeat {
  if (score >= 80) return 'hot'
  if (score >= 60) return 'warm'
  if (score >= 40) return 'cool'
  return 'low'
}

export function getLeadHeatLabel(score: number): string {
  const heat = getLeadHeat(score)
  if (heat === 'hot') return 'Hot Lead'
  if (heat === 'warm') return 'Warm Lead'
  if (heat === 'cool') return 'Promising'
  return 'Low Priority'
}

export function getLeadScoreBadgeClass(score: number): string {
  const heat = getLeadHeat(score)

  if (heat === 'hot') {
    return 'border-rose-400/30 bg-rose-400/15 text-rose-200'
  }
  if (heat === 'warm') {
    return 'border-amber-400/30 bg-amber-400/15 text-amber-200'
  }
  if (heat === 'cool') {
    return 'border-sky-400/30 bg-sky-400/15 text-sky-200'
  }

  return 'border-slate-400/25 bg-slate-400/10 text-slate-300'
}

export function getLeadStatusBadgeClass(status: Lead['status']): string {
  switch (status) {
    case 'won':
      return 'border-emerald-400/30 bg-emerald-400/15 text-emerald-200'
    case 'proposal-sent':
      return 'border-violet-400/30 bg-violet-400/15 text-violet-200'
    case 'contacted':
    case 'follow-up':
      return 'border-amber-400/30 bg-amber-400/15 text-amber-200'
    case 'qualified':
      return 'border-sky-400/30 bg-sky-400/15 text-sky-200'
    case 'lost':
      return 'border-rose-400/30 bg-rose-400/15 text-rose-200'
    default:
      return 'border-slate-400/25 bg-slate-400/10 text-slate-300'
  }
}
