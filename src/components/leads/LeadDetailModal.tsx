import { useEffect, useState } from 'react'
import { getLeadHeatLabel, getLeadScoreBadgeClass, getLeadStatusBadgeClass } from '../../lib/leadScoring'
import { addLeadNote, fetchLeadNotes } from '../../services/lead-notes.service'
import type { Lead, LeadNote } from '../../types'
import { DetailModal } from '../ui/DetailModal'
import { NotesPanel } from '../ui/NotesPanel'

export function LeadDetailModal({
  lead,
  open,
  onClose,
}: {
  lead: Lead | null
  open: boolean
  onClose: () => void
}) {
  const [notes, setNotes] = useState<LeadNote[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!lead || !open) return
    setLoading(true)
    setMessage('')
    void fetchLeadNotes(lead.id)
      .then(setNotes)
      .catch((error) => setMessage(error instanceof Error ? error.message : 'Could not load notes'))
      .finally(() => setLoading(false))
  }, [lead, open])

  async function onAdd(note: string) {
    if (!lead) return
    setMessage('')
    try {
      const created = await addLeadNote(lead.id, note)
      setNotes((current) => [created, ...current])
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save note')
    }
  }

  return (
    <DetailModal open={open} title={lead?.name || 'Lead details'} onClose={onClose}>
      {lead ? (
        <div className="space-y-6">
          <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex flex-wrap gap-2">
                <span className={`badge border ${getLeadScoreBadgeClass(lead.score)}`}>Score {lead.score}</span>
                <span className={`badge border ${getLeadScoreBadgeClass(lead.score)}`}>{getLeadHeatLabel(lead.score)}</span>
                <span className={`badge border ${getLeadStatusBadgeClass(lead.status)}`}>{lead.status}</span>
              </div>

              <div className="mt-4 grid gap-3 text-sm text-slate-300 md:grid-cols-2">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-400">Category</div>
                  <div className="mt-1">{lead.category}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-400">City</div>
                  <div className="mt-1">{lead.city}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-400">Phone</div>
                  <div className="mt-1">{lead.phone || 'No phone returned'}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-400">Website</div>
                  <div className="mt-1 break-all">{lead.website || 'No website returned'}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-400">Rating</div>
                  <div className="mt-1">{lead.rating || '-'} {lead.reviewCount ? `(${lead.reviewCount} reviews)` : ''}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-400">Saved</div>
                  <div className="mt-1">{lead.created_at ? new Date(lead.created_at).toLocaleString() : 'Unknown'}</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-wide text-slate-400">Pain points</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {lead.painPoints.length ? (
                  lead.painPoints.map((painPoint) => (
                    <span key={painPoint} className="badge border border-sky-400/25 bg-sky-400/10 text-sky-100">
                      {painPoint}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">No pain points identified.</span>
                )}
              </div>
            </div>
          </section>

          {message ? <div className="text-sm text-slate-300">{message}</div> : null}
          <NotesPanel title="Lead notes" notes={notes} onAdd={onAdd} busy={loading} />
        </div>
      ) : null}
    </DetailModal>
  )
}
