import { useEffect, useMemo, useState } from 'react'
import { fetchSavedLeads, updateLeadStatus } from '../../services/leads.service'
import { getLeadHeatLabel, getLeadScoreBadgeClass, getLeadStatusBadgeClass } from '../../lib/leadScoring'
import type { Lead, LeadStatus } from '../../types'
import { LeadDetailModal } from '../../components/leads/LeadDetailModal'

const statuses: Array<LeadStatus | 'all'> = ['all', 'new', 'qualified', 'contacted', 'follow-up', 'proposal-sent', 'won', 'lost']

export function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<(typeof statuses)[number]>('all')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  useEffect(() => {
    void loadLeads()
  }, [])

  async function loadLeads() {
    try {
      setLeads(await fetchSavedLeads())
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load leads')
    }
  }

  async function onStatusChange(id: string, status: LeadStatus) {
    try {
      await updateLeadStatus(id, status)
      setLeads((current) => current.map((lead) => (lead.id === id ? { ...lead, status } : lead)))
      setSelectedLead((current) => (current && current.id === id ? { ...current, status } : current))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update lead')
    }
  }

  const orderedLeads = useMemo(() => {
    const term = search.trim().toLowerCase()
    return [...leads]
      .filter((lead) => (statusFilter === 'all' ? true : lead.status === statusFilter))
      .filter((lead) => {
        if (!term) return true
        const haystack = [lead.name, lead.category, lead.city, lead.phone, lead.website, ...lead.painPoints]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return haystack.includes(term)
      })
      .sort((a, b) => b.score - a.score)
  }, [leads, search, statusFilter])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Saved leads</h1>
          <p className="text-slate-400">Prioritised by score so your strongest opportunities stay visible first.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[520px]">
          <input
            className="input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Quick search by name, city, category, phone, website..."
          />
          <select className="input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as (typeof statuses)[number])}>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status === 'all' ? 'All statuses' : status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="text-sm text-slate-400">{orderedLeads.length} lead{orderedLeads.length === 1 ? '' : 's'} matched</div>
      {message ? <div className="text-sm text-slate-300">{message}</div> : null}

      <div className="grid gap-4">
        {orderedLeads.map((lead) => (
          <article
            key={lead.id}
            className="card cursor-pointer p-6 transition hover:border-sky-400/30 hover:bg-white/[0.04]"
            onClick={() => setSelectedLead(lead)}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold text-white">{lead.name}</div>
                <div className="text-sm text-slate-400">{lead.category} · {lead.city}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={`badge border ${getLeadScoreBadgeClass(lead.score)}`}>Score {lead.score}</span>
                  <span className={`badge border ${getLeadScoreBadgeClass(lead.score)}`}>{getLeadHeatLabel(lead.score)}</span>
                  <span className={`badge border ${getLeadStatusBadgeClass(lead.status)}`}>{lead.status}</span>
                </div>
              </div>

              <select
                className="input w-auto"
                value={lead.status}
                onClick={(event) => event.stopPropagation()}
                onChange={(event) => void onStatusChange(lead.id, event.target.value as LeadStatus)}
              >
                {statuses.filter((status): status is LeadStatus => status !== 'all').map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div className="mt-4 grid gap-2 text-sm text-slate-300 md:grid-cols-3">
              <div>{lead.phone || 'No phone'}</div>
              <div className="break-all">{lead.website || 'No website'}</div>
              <div>Rating: {lead.rating || '-'} {lead.reviewCount ? `(${lead.reviewCount} reviews)` : ''}</div>
            </div>
          </article>
        ))}
        {!orderedLeads.length ? <div className="card p-6 text-slate-400">No saved leads matched your current filters.</div> : null}
      </div>

      <LeadDetailModal lead={selectedLead} open={!!selectedLead} onClose={() => setSelectedLead(null)} />
    </div>
  )
}
