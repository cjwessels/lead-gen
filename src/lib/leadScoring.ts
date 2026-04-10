import type { Lead } from '../types'

export function scoreLead(input: Partial<Lead>): number {
  let score = 40

  if (!input.website) score += 20
  if ((input.rating ?? 5) < 4) score += 8
  if ((input.reviewCount ?? 0) < 15) score += 10
  if (input.category?.toLowerCase().includes('panel')) score += 6
  if (input.category?.toLowerCase().includes('logistics')) score += 6
  if (input.city?.toLowerCase().includes('cape')) score += 4

  return Math.min(score, 100)
}
