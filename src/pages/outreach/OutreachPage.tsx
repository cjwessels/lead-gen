import { useEffect, useMemo, useState } from 'react'
import { fetchSavedLeads } from '../../services/leads.service'
import { generateAiOutreachPack, generateOutreachPack } from '../../services/outreach.service'
import { getLeadHeatLabel, getLeadScoreBadgeClass } from '../../lib/leadScoring'
import type { Lead, OutreachPack } from '../../types'

const emptyPack: OutreachPack = {
  emailSubject: '',
  emailBody: '',
  whatsappBody: '',
  callOpener: '',
  source: 'local',
}

export function OutreachPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [leadId, setLeadId] = useState('')
  const [pack, setPack] = useState<OutreachPack>(emptyPack)
  const [loadingAi, setLoadingAi] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    void fetchSavedLeads().then((data) => {
      const ordered = [...data].sort((a, b) => b.score - a.score)
      setLeads(ordered)
      setLeadId(ordered[0]?.id ?? '')
    }).catch(() => setLeads([]))
  }, [])

  const selectedLead = useMemo(
    () => leads.find((lead) => lead.id === leadId) ?? leads[0],
    [leadId, leads],
  )

  useEffect(() => {
    if (!selectedLead) {
      setPack(emptyPack)
      return
    }
    setPack(generateOutreachPack(selectedLead))
    setMessage('')
  }, [selectedLead])

  async function onGenerateAi() {
    if (!selectedLead) return
    setLoadingAi(true)
    setMessage('')
    try {
      const aiPack = await generateAiOutreachPack(selectedLead)
      setPack(aiPack)
      setMessage(aiPack.source === 'ai' ? 'AI outreach generated.' : 'AI not configured yet, so the local template was used.')
    } catch (error) {
      setPack(generateOutreachPack(selectedLead))
      setMessage(error instanceof Error ? error.message : 'Could not generate AI outreach')
    } finally {
      setLoadingAi(false)
    }
  }

  async function copyText(value: string, label: string) {
    await navigator.clipboard.writeText(value)
    setMessage(`${label} copied to clipboard`)
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Outreach generator</h1>
            <p className="mt-2 text-slate-300">
              Generate tailored outreach for saved leads. Use the AI button when your OpenAI key is configured.
            </p>
          </div>

          {selectedLead ? (
            <div className="flex flex-wrap gap-2">
              <span className={`badge border ${getLeadScoreBadgeClass(selectedLead.score)}`}>Score {selectedLead.score}</span>
              <span className={`badge border ${getLeadScoreBadgeClass(selectedLead.score)}`}>{getLeadHeatLabel(selectedLead.score)}</span>
              <span className="badge border border-white/10 bg-white/5 text-slate-200">
                {pack.source === 'ai' ? 'AI Draft' : 'Template Draft'}
              </span>
            </div>
          ) : null}
        </div>

        <select className="input mt-4" value={leadId} onChange={(e) => setLeadId(e.target.value)}>
          {leads.map((lead) => (
            <option key={lead.id} value={lead.id}>
              {lead.name} · Score {lead.score}
            </option>
          ))}
        </select>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={() => void onGenerateAi()}
            disabled={!selectedLead || loadingAi}
            className="rounded-2xl bg-sky-400 px-5 py-3 font-medium text-slate-950 hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingAi ? 'Generating AI outreach...' : 'Generate AI outreach'}
          </button>

          <button
            onClick={() => selectedLead && setPack(generateOutreachPack(selectedLead))}
            disabled={!selectedLead}
            className="rounded-2xl bg-white/10 px-5 py-3 font-medium text-white hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Reset to template
          </button>
        </div>

        {message ? <div className="mt-4 text-sm text-slate-300">{message}</div> : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <article className="card p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-slate-400">Email subject + body</div>
            <button onClick={() => void copyText(`${pack.emailSubject}\n\n${pack.emailBody}`, 'Email draft')} className="text-xs text-sky-300">
              Copy
            </button>
          </div>
          <div className="mt-3 font-medium text-white">{pack.emailSubject}</div>
          <pre className="mt-4 whitespace-pre-wrap text-sm text-slate-300">{pack.emailBody}</pre>
        </article>

        <article className="card p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-slate-400">WhatsApp</div>
            <button onClick={() => void copyText(pack.whatsappBody, 'WhatsApp draft')} className="text-xs text-sky-300">
              Copy
            </button>
          </div>
          <pre className="mt-4 whitespace-pre-wrap text-sm text-slate-300">{pack.whatsappBody}</pre>
        </article>

        <article className="card p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-slate-400">Call opener</div>
            <button onClick={() => void copyText(pack.callOpener, 'Call opener')} className="text-xs text-sky-300">
              Copy
            </button>
          </div>
          <pre className="mt-4 whitespace-pre-wrap text-sm text-slate-300">{pack.callOpener}</pre>
        </article>
      </div>
    </div>
  )
}
