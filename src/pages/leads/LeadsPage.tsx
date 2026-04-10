import { useEffect, useState } from 'react'
import { fetchSavedLeads, updateLeadStatus } from '../../services/leads.service'
import type { Lead, LeadStatus } from '../../types'

const statuses: LeadStatus[] = ['new', 'qualified', 'contacted', 'follow-up', 'proposal-sent', 'won', 'lost']

export function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [message, setMessage] = useState('')

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
      <h1 className="text-2xl font-semibold text-white">Saved leads</h1>
      {message ? <div className="text-sm text-slate-300">{message}</div> : null}
      <div className="grid gap-4">
        {leads.map((lead) => (
          <article key={lead.id} className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-lg font-semibold text-white">{lead.name}</div>
                <div className="text-sm text-slate-400">{lead.category} · {lead.city}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge">Score {lead.score}</span>
                <select className="input w-auto" value={lead.status} onChange={(e) => void onStatusChange(lead.id, e.target.value as LeadStatus)}>
                  {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>
            </div>
          </article>
        ))}
        {!leads.length ? <div className="card p-6 text-slate-400">No saved leads yet.</div> : null}
      </div>
    </div>
  )
}
