import { useEffect, useMemo, useState } from 'react'
import { fetchSavedLeads, updateLeadStatus } from '../../services/leads.service'
import type { Lead, LeadStatus } from '../../types'
import { LeadDetailModal } from '../../components/leads/LeadDetailModal'

const columns: LeadStatus[] = ['new', 'qualified', 'contacted', 'follow-up', 'proposal-sent', 'won', 'lost']

export function PipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [search, setSearch] = useState('')
  const [minScore, setMinScore] = useState(0)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  useEffect(() => {
    void fetchSavedLeads().then(setLeads).catch(() => setLeads([]))
  }, [])

  async function onStatusChange(id: string, status: LeadStatus) {
    await updateLeadStatus(id, status)
    setLeads((current) => current.map((lead) => (lead.id === id ? { ...lead, status } : lead)))
    setSelectedLead((current) => (current && current.id === id ? { ...current, status } : current))
  }

  const filteredLeads = useMemo(() => {
    const term = search.trim().toLowerCase()
    return leads.filter((lead) => {
      if (lead.score < minScore) return false
      if (!term) return true
      const haystack = [lead.name, lead.category, lead.city, lead.website, ...lead.painPoints]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(term)
    })
  }, [leads, minScore, search])

  const grouped = useMemo(
    () => Object.fromEntries(columns.map((column) => [column, filteredLeads.filter((lead) => lead.status === column)])),
    [filteredLeads],
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Leads Pipeline</h1>
          <p className="text-slate-400">Filter, search, and click a card to inspect full lead details and notes.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[560px]">
          <input
            className="input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Quick search across the pipeline..."
          />
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="flex items-center justify-between gap-4 text-sm text-slate-200">
              <span>Minimum score</span>
              <span>{minScore}</span>
            </div>
            <input
              className="mt-3 w-full accent-sky-400"
              type="range"
              min={0}
              max={100}
              step={5}
              value={minScore}
              onChange={(event) => setMinScore(Number(event.target.value))}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-7">
        {columns.map((column) => (
          <section key={column} className="card p-4">
            <div className="mb-4 text-sm font-medium uppercase tracking-wide text-sky-300">{column}</div>
            <div className="space-y-3">
              {(grouped[column] || []).length ? (
                grouped[column].map((lead) => (
                  <article
                    key={lead.id}
                    className="cursor-pointer rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-sky-400/30 hover:bg-white/[0.07]"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <div className="text-sm font-medium text-white">{lead.name}</div>
                    <div className="mt-1 text-xs text-slate-400">{lead.category}</div>
                    <div className="mt-3 text-xs text-slate-300">Score {lead.score}</div>
                    <select
                      className="input mt-3 w-full"
                      value={lead.status}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) => void onStatusChange(lead.id, event.target.value as LeadStatus)}
                    >
                      {columns.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 p-4 text-xs text-slate-500">No leads</div>
              )}
            </div>
          </section>
        ))}
      </div>

      <LeadDetailModal lead={selectedLead} open={!!selectedLead} onClose={() => setSelectedLead(null)} />
    </div>
  )
}
