import { useEffect, useMemo, useState } from 'react'
import { archiveLead, deleteLead, fetchSavedLeads, reactivateLead, updateLeadStatus } from '../../services/leads.service'
import { getLeadHeatLabel, getLeadScoreBadgeClass, getLeadStatusBadgeClass } from '../../lib/leadScoring'
import type { Lead, LeadStatus } from '../../types'
import { LeadDetailModal } from '../../components/leads/LeadDetailModal'

const statuses: Array<LeadStatus | 'all'> = ['all', 'new', 'qualified', 'contacted', 'follow-up', 'proposal-sent', 'won', 'lost']
type ViewMode = 'saved' | 'archive'

export function LeadsPage() {
  const [savedLeads, setSavedLeads] = useState<Lead[]>([])
  const [archivedLeads, setArchivedLeads] = useState<Lead[]>([])
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<(typeof statuses)[number]>('all')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('saved')

  useEffect(() => {
    void loadLeads()
  }, [])

  async function loadLeads() {
    try {
      const [saved, archived] = await Promise.all([fetchSavedLeads(false), fetchSavedLeads(true)])
      setSavedLeads(saved)
      setArchivedLeads(archived)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load leads')
    }
  }

  async function onStatusChange(id: string, status: LeadStatus) {
    try {
      await updateLeadStatus(id, status)
      setSavedLeads((current) => current.map((lead) => (lead.id === id ? { ...lead, status } : lead)))
      setArchivedLeads((current) => current.map((lead) => (lead.id === id ? { ...lead, status } : lead)))
      setSelectedLead((current) => (current && current.id === id ? { ...current, status } : current))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update lead')
    }
  }

  async function onArchive(lead: Lead) {
    try {
      await archiveLead(lead.id)
      setSavedLeads((current) => current.filter((item) => item.id !== lead.id))
      setArchivedLeads((current) => [{ ...lead, archived_at: new Date().toISOString() }, ...current])
      setSelectedLead((current) => (current?.id === lead.id ? null : current))
      setMessage(`Archived lead: ${lead.name}`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not archive lead')
    }
  }

  async function onReactivate(lead: Lead) {
    try {
      await reactivateLead(lead.id)
      setArchivedLeads((current) => current.filter((item) => item.id !== lead.id))
      setSavedLeads((current) => [{ ...lead, archived_at: null }, ...current])
      setMessage(`Re-activated lead: ${lead.name}`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not re-activate lead')
    }
  }

  async function onDelete(lead: Lead) {
    if (!window.confirm(`Delete ${lead.name} permanently?`)) return
    try {
      await deleteLead(lead.id)
      setSavedLeads((current) => current.filter((item) => item.id !== lead.id))
      setArchivedLeads((current) => current.filter((item) => item.id !== lead.id))
      setSelectedLead((current) => (current?.id === lead.id ? null : current))
      setMessage(`Deleted lead: ${lead.name}`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not delete lead')
    }
  }

  const orderedLeads = useMemo(() => {
    const source = viewMode === 'saved' ? savedLeads : archivedLeads
    const term = search.trim().toLowerCase()
    return [...source]
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
  }, [archivedLeads, savedLeads, search, statusFilter, viewMode])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Saved leads</h1>
          <p className="text-slate-400">Manage active leads and archived leads separately.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[520px]">
          <input className="input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={viewMode === 'saved' ? 'Quick search saved leads...' : 'Quick search archived leads...'} />
          <select className="input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as (typeof statuses)[number])}>
            {statuses.map((status) => (
              <option key={status} value={status}>{status === 'all' ? 'All statuses' : status}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setViewMode('saved')} className={`rounded-full border px-4 py-2 text-sm ${viewMode === 'saved' ? 'border-sky-400/40 bg-sky-400/15 text-sky-100' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}>Saved ({savedLeads.length})</button>
        <button type="button" onClick={() => setViewMode('archive')} className={`rounded-full border px-4 py-2 text-sm ${viewMode === 'archive' ? 'border-amber-400/40 bg-amber-400/15 text-amber-100' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}>Archive ({archivedLeads.length})</button>
      </div>

      <div className="text-sm text-slate-400">{orderedLeads.length} lead{orderedLeads.length === 1 ? '' : 's'} matched</div>
      {message ? <div className="text-sm text-slate-300">{message}</div> : null}

      {viewMode === 'saved' ? (
        <div className="grid gap-4">
          {orderedLeads.map((lead) => (
            <article key={lead.id} className="card cursor-pointer p-6 transition hover:border-sky-400/30 hover:bg-white/[0.04]" onClick={() => setSelectedLead(lead)}>
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

                <div className="flex flex-wrap items-center gap-3">
                  <select className="input w-auto" value={lead.status} onClick={(event) => event.stopPropagation()} onChange={(event) => void onStatusChange(lead.id, event.target.value as LeadStatus)}>
                    {statuses.filter((status): status is LeadStatus => status !== 'all').map((status) => (<option key={status} value={status}>{status}</option>))}
                  </select>
                  <button type="button" className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100 hover:bg-amber-400/15" onClick={(event) => { event.stopPropagation(); void onArchive(lead) }}>Archive</button>
                </div>
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
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="bg-white/5 text-left text-slate-300">
              <tr>
                <th className="px-4 py-3">Lead</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {orderedLeads.map((lead) => (
                <tr key={lead.id} className="text-slate-200">
                  <td className="px-4 py-3"><div className="font-medium text-white">{lead.name}</div><div className="text-xs text-slate-400">{lead.category}</div></td>
                  <td className="px-4 py-3">{lead.city}</td>
                  <td className="px-4 py-3">{lead.status}</td>
                  <td className="px-4 py-3">{lead.score}</td>
                  <td className="px-4 py-3"><div className="flex flex-wrap justify-end gap-2"><button type="button" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10" onClick={() => setSelectedLead(lead)}>View</button><button type="button" className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-emerald-100 hover:bg-emerald-400/15" onClick={() => void onReactivate(lead)}>Re-Activate</button><button type="button" className="rounded-lg border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-rose-100 hover:bg-rose-400/15" onClick={() => void onDelete(lead)}>Delete</button></div></td>
                </tr>
              ))}
              {!orderedLeads.length ? <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">No archived leads matched your current filters.</td></tr> : null}
            </tbody>
          </table>
        </div>
      )}

      <LeadDetailModal lead={selectedLead} open={!!selectedLead} onClose={() => setSelectedLead(null)} />
    </div>
  )
}
