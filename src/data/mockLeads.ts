import type { Lead } from '../types'

export const mockLeads: Lead[] = [
  {
    id: '1',
    name: 'Cape Industrial Fasteners',
    category: 'Industrial Supplier',
    city: 'Cape Town',
    phone: '+27 21 555 0123',
    website: 'https://example.com',
    rating: 4.1,
    reviewCount: 19,
    score: 78,
    status: 'qualified',
    painPoints: ['Outdated website', 'No quote capture', 'No CRM handoff'],
  },
  {
    id: '2',
    name: 'QuickTow Logistics',
    category: 'Logistics',
    city: 'Johannesburg',
    phone: '+27 11 444 8899',
    website: '',
    rating: 3.8,
    reviewCount: 7,
    score: 86,
    status: 'new',
    painPoints: ['No website', 'Manual WhatsApp orders', 'No lead tracking'],
  },
  {
    id: '3',
    name: 'West Coast Panel Works',
    category: 'Panel Beater',
    city: 'Cape Town',
    phone: '+27 21 444 3333',
    website: 'https://example.org',
    rating: 4.6,
    reviewCount: 41,
    score: 72,
    status: 'proposal-sent',
    painPoints: ['No online booking', 'Weak mobile UX'],
  }
]
