import { useMemo, useState } from 'react'
import { mockLeads } from '../../data/mockLeads'
import { generateOutreachPack } from '../../services/outreach.service'

export function OutreachPage() {
  const [leadId, setLeadId] = useState(mockLeads[0]?.id ?? '')
  const selectedLead = mockLeads.find((lead) => lead.id === leadId) ?? mockLeads[0]
  const copy = useMemo(() => generateOutreachPack(selectedLead), [selectedLead])

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-semibold text-white">Outreach generator</h1>
        <p className="mt-2 text-slate-300">
          Starter content generator for cold email, WhatsApp, and call openers. You can later replace
          this with an AI-backed Edge Function.
        </p>

        <select
          className="input mt-4"
          value={leadId}
          onChange={(event) => setLeadId(event.target.value)}
        >
          {mockLeads.map((lead) => (
            <option key={lead.id} value={lead.id}>
              {lead.name}
            </option>
          ))}
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
