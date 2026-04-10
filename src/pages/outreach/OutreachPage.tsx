import { useEffect, useMemo, useState } from 'react'
import { fetchSavedLeads } from '../../services/leads.service'
import { generateOutreachPack } from '../../services/outreach.service'
import type { Lead } from '../../types'

export function OutreachPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [leadId, setLeadId] = useState('')

  useEffect(() => {
    void fetchSavedLeads().then((data) => {
      setLeads(data)
      setLeadId(data[0]?.id ?? '')
    }).catch(() => setLeads([]))
  }, [])

  const selectedLead = leads.find((lead) => lead.id === leadId) ?? leads[0]
  const copy = useMemo(
    () => selectedLead ? generateOutreachPack(selectedLead) : { emailSubject: '', emailBody: '', whatsappBody: '', callOpener: '' },
    [selectedLead],
  )

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-semibold text-white">Outreach generator</h1>
        <p className="mt-2 text-slate-300">Generate outreach copy from saved leads.</p>
        <select className="input mt-4" value={leadId} onChange={(e) => setLeadId(e.target.value)}>
          {leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.name}</option>)}
        </select>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <article className="card p-6">
          <div className="text-sm text-slate-400">Email subject</div>
          <div className="mt-3 font-medium text-white">{copy.emailSubject}</div>
          <pre className="mt-4 whitespace-pre-wrap text-sm text-slate-300">{copy.emailBody}</pre>
        </article>
        <article className="card p-6">
          <div className="text-sm text-slate-400">WhatsApp</div>
          <pre className="mt-4 whitespace-pre-wrap text-sm text-slate-300">{copy.whatsappBody}</pre>
        </article>
        <article className="card p-6">
          <div className="text-sm text-slate-400">Call opener</div>
          <pre className="mt-4 whitespace-pre-wrap text-sm text-slate-300">{copy.callOpener}</pre>
        </article>
      </div>
    </div>
  )
}
