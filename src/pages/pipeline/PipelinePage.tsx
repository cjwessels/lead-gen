import { useEffect, useMemo, useState } from 'react'
import { fetchSavedLeads } from '../../services/leads.service'
import type { Lead, LeadStatus } from '../../types'

const columns: LeadStatus[] = ['new', 'qualified', 'contacted', 'follow-up', 'proposal-sent', 'won', 'lost']

export function PipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([])
  useEffect(() => { void fetchSavedLeads().then(setLeads).catch(() => setLeads([])) }, [])

  const grouped = useMemo(
    () => Object.fromEntries(columns.map((column) => [column, leads.filter((lead) => lead.status === column)])),
    [leads],
  )

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-white">Pipeline</h1>
      <div className="grid gap-4 xl:grid-cols-7">
        {columns.map((column) => (
          <section key={column} className="card p-4">
            <div className="mb-4 text-sm font-medium uppercase tracking-wide text-sky-300">{column}</div>
            <div className="space-y-3">
              {(grouped[column] || []).length ? (
                grouped[column].map((lead) => (
                  <article key={lead.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-sm font-medium text-white">{lead.name}</div>
                    <div className="mt-1 text-xs text-slate-400">{lead.category}</div>
                    <div className="mt-3 text-xs text-slate-300">Score {lead.score}</div>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 p-4 text-xs text-slate-500">No leads</div>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
