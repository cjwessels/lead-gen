import { useEffect, useMemo, useState } from 'react'
import { fetchSavedLeads, updateLeadStatus } from '../../services/leads.service'
import { getLeadHeatLabel, getLeadScoreBadgeClass, getLeadStatusBadgeClass } from '../../lib/leadScoring'
import type { Lead, LeadStatus } from '../../types'

const statuses: LeadStatus[] = ['new', 'qualified', 'contacted', 'follow-up', 'proposal-sent', 'won', 'lost']

export function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [message, setMessage] = useState('')
  const orderedLeads = useMemo(() => [...leads].sort((a, b) => b.score - a.score), [leads])

  useEffect(() => { void loadLeads() }, [])

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
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update lead')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Saved leads</h1>
          <p className="text-slate-400">Prioritised by score so your strongest opportunities stay visible first.</p>
        </div>
        <div className="text-sm text-slate-400">{orderedLeads.length} lead{orderedLeads.length === 1 ? '' : 's'} saved</div>
      </div>

      {message ? <div className="text-sm text-slate-300">{message}</div> : null}
      <div className="grid gap-4">
        {orderedLeads.map((lead) => (
          <article key={lead.id} className="card p-6">
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

              <select className="input w-auto" value={lead.status} onChange={(e) => void onStatusChange(lead.id, e.target.value as LeadStatus)}>
                {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>

            <div className="mt-4 grid gap-2 text-sm text-slate-300 md:grid-cols-3">
              <div>{lead.phone || 'No phone'}</div>
              <div className="break-all">{lead.website || 'No website'}</div>
              <div>Rating: {lead.rating || '-'} {lead.reviewCount ? `(${lead.reviewCount} reviews)` : ''}</div>
            </div>
          </article>
        ))}
        {!orderedLeads.length ? <div className="card p-6 text-slate-400">No saved leads yet.</div> : null}
      </div>
    </div>
  )
}
