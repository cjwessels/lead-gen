import { useEffect, useState } from 'react'
import { addTenderNote, fetchTenderNotes } from '../../services/tender-notes.service'
import type { Tender, TenderNote } from '../../types'
import { DetailModal } from '../ui/DetailModal'
import { NotesPanel } from '../ui/NotesPanel'

function formatDate(value?: string) {
  if (!value) return 'Not provided'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString()
}

export function TenderDetailModal({
  tender,
  open,
  onClose,
}: {
  tender: Tender | null
  open: boolean
  onClose: () => void
}) {
  const [notes, setNotes] = useState<TenderNote[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!tender || !open) return
    setLoading(true)
    setMessage('')
    void fetchTenderNotes(tender.id)
      .then(setNotes)
      .catch((error) => setMessage(error instanceof Error ? error.message : 'Could not load notes'))
      .finally(() => setLoading(false))
  }, [tender, open])

  async function onAdd(note: string) {
    if (!tender) return
    setMessage('')
    try {
      const created = await addTenderNote(tender.id, note)
      setNotes((current) => [created, ...current])
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save note')
    }
  }

  return (
    <DetailModal open={open} title={tender?.title || 'Tender details'} onClose={onClose}>
      {tender ? (
        <div className="space-y-6">
          <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex flex-wrap gap-2">
                <span className="badge border border-sky-400/25 bg-sky-400/10 text-sky-100">{tender.source_label}</span>
                <span className="badge border border-white/10 bg-white/5 text-slate-200">Score {tender.score}</span>
                <span className="badge border border-white/10 bg-white/5 text-slate-200">{tender.status}</span>
              </div>

              <div className="mt-4 grid gap-3 text-sm text-slate-300 md:grid-cols-2">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-400">Publisher</div>
                  <div className="mt-1">{tender.publisher}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-400">Location</div>
                  <div className="mt-1">{tender.is_national ? 'National / Countrywide' : tender.province || 'Not extracted'}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-400">Start date</div>
                  <div className="mt-1">{formatDate(tender.start_date)}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-400">Closing date</div>
                  <div className="mt-1">{formatDate(tender.end_date)}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-400">Contact person</div>
                  <div className="mt-1">{tender.contact_person || 'Not extracted'}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-400">Contact phone</div>
                  <div className="mt-1">{tender.contact_phone || 'Not extracted'}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-xs uppercase tracking-wide text-slate-400">Contact email</div>
                  <div className="mt-1 break-all">{tender.contact_email || 'Not extracted'}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-xs uppercase tracking-wide text-slate-400">Source URL</div>
                  <div className="mt-1 break-all">{tender.source_url && (<a
                    href={tender.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-blue-400 underline hover:text-blue-300"
                  >
                    {tender.source_url}
                  </a>) || 'No source URL returned'}</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-wide text-slate-400">Summary</div>
              <div className="mt-3 text-sm leading-6 text-slate-200">{tender.summary}</div>

              <div className="mt-4 text-xs uppercase tracking-wide text-slate-400">Qualification / notes</div>
              <div className="mt-2 text-sm leading-6 text-slate-300">
                {tender.qualification_notes || 'Qualification details are not explicit in the record.'}
              </div>

              <div className="mt-4 text-xs uppercase tracking-wide text-slate-400">Tender source material</div>
              <div className="mt-2 text-sm leading-6 text-slate-300">
                {tender.source_material || 'No raw source material was stored for this tender.'}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {tender.focus_tags.map((tag) => (
                  <span key={tag} className="badge border border-sky-400/25 bg-sky-400/10 text-sky-100">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {message ? <div className="text-sm text-slate-300">{message}</div> : null}
          <NotesPanel title="Tender notes" notes={notes} onAdd={onAdd} busy={loading} />
        </div>
      ) : null}
    </DetailModal>
  )
}
