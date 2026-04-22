import { useEffect, useMemo, useState } from 'react'
import { archiveTender, deleteTender, fetchSavedTenders, reactivateTender, updateTenderStatus } from '../../services/tenders.service'
import { TenderDetailModal } from '../../components/tenders/TenderDetailModal'
import type { Tender, TenderStatus, TenderSourceType } from '../../types'

const statuses: Array<TenderStatus | 'all'> = ['all', 'identified', 'reviewing', 'qualifying', 'bid-prep', 'submitted', 'won', 'lost']
type ViewMode = 'saved' | 'archive'
const ALL_SOURCES = 'all'

function formatDate(value?: string) {
  if (!value) return 'Not provided'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString()
}

function getSourceBadge(type: TenderSourceType) {
  switch (type) {
    case 'government':
      return 'border-sky-400/20 bg-sky-400/10 text-sky-100'
    case 'platform':
      return 'border-fuchsia-400/20 bg-fuchsia-400/10 text-fuchsia-100'
    case 'private_sector':
      return 'border-violet-400/20 bg-violet-400/10 text-violet-100'
    default:
      return 'border-slate-400/20 bg-white/5 text-slate-200'
  }
}

export function SavedTendersPage() {
  const [savedTenders, setSavedTenders] = useState<Tender[]>([])
  const [archivedTenders, setArchivedTenders] = useState<Tender[]>([])
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<(typeof statuses)[number]>('all')
  const [sourceFilter, setSourceFilter] = useState<string>(ALL_SOURCES)
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('saved')

  useEffect(() => {
    void loadTenders()
  }, [])

  async function loadTenders() {
    try {
      const [saved, archived] = await Promise.all([fetchSavedTenders(false), fetchSavedTenders(true)])
      setSavedTenders(saved)
      setArchivedTenders(archived)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load tenders')
    }
  }

  async function onStatusChange(id: string, status: TenderStatus) {
    try {
      await updateTenderStatus(id, status)
      setSavedTenders((current) => current.map((tender) => (tender.id === id ? { ...tender, status } : tender)))
      setArchivedTenders((current) => current.map((tender) => (tender.id === id ? { ...tender, status } : tender)))
      setSelectedTender((current) => (current && current.id === id ? { ...current, status } : current))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update tender')
    }
  }

  async function onArchive(tender: Tender) {
    try {
      await archiveTender(tender.id)
      setSavedTenders((current) => current.filter((item) => item.id !== tender.id))
      setArchivedTenders((current) => [{ ...tender, archived_at: new Date().toISOString() }, ...current])
      setSelectedTender((current) => (current?.id === tender.id ? null : current))
      setMessage(`Archived tender: ${tender.title}`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not archive tender')
    }
  }

  async function onReactivate(tender: Tender) {
    try {
      await reactivateTender(tender.id)
      setArchivedTenders((current) => current.filter((item) => item.id !== tender.id))
      setSavedTenders((current) => [{ ...tender, archived_at: null }, ...current])
      setMessage(`Re-activated tender: ${tender.title}`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not re-activate tender')
    }
  }

  async function onDelete(tender: Tender) {
    if (!window.confirm(`Delete ${tender.title} permanently?`)) return
    try {
      await deleteTender(tender.id)
      setSavedTenders((current) => current.filter((item) => item.id !== tender.id))
      setArchivedTenders((current) => current.filter((item) => item.id !== tender.id))
      setSelectedTender((current) => (current?.id === tender.id ? null : current))
      setMessage(`Deleted tender: ${tender.title}`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not delete tender')
    }
  }

  const sourceOptions = useMemo(() => {
    const values = new Set<string>()
    ;[...savedTenders, ...archivedTenders].forEach((tender) => values.add(tender.source_type))
    return [ALL_SOURCES, ...Array.from(values)]
  }, [archivedTenders, savedTenders])

  const orderedTenders = useMemo(() => {
    const source = viewMode === 'saved' ? savedTenders : archivedTenders
    const term = search.trim().toLowerCase()
    return [...source]
      .filter((tender) => (statusFilter === 'all' ? true : tender.status === statusFilter))
      .filter((tender) => (sourceFilter === ALL_SOURCES ? true : tender.source_type === sourceFilter))
      .filter((tender) => {
        if (!term) return true
        const haystack = [
          tender.title,
          tender.publisher,
          tender.province,
          tender.location_text,
          tender.summary,
          tender.contact_person,
          tender.contact_email,
          tender.contact_phone,
          ...tender.focus_tags,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return haystack.includes(term)
      })
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
  }, [archivedTenders, savedTenders, search, sourceFilter, statusFilter, viewMode])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Saved Tenders</h1>
          <p className="text-slate-400">Manage active tenders and archived tenders separately.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[760px]">
          <input className="input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={viewMode === 'saved' ? 'Quick search saved tenders...' : 'Quick search archived tenders...'} />
          <select className="input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as (typeof statuses)[number])}>
            {statuses.map((status) => (
              <option key={status} value={status}>{status === 'all' ? 'All statuses' : status}</option>
            ))}
          </select>
          <select className="input" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
            <option value={ALL_SOURCES}>All sources</option>
            {sourceOptions.filter((option) => option !== ALL_SOURCES).map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setViewMode('saved')} className={`rounded-full border px-4 py-2 text-sm ${viewMode === 'saved' ? 'border-sky-400/40 bg-sky-400/15 text-sky-100' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}>Saved ({savedTenders.length})</button>
        <button type="button" onClick={() => setViewMode('archive')} className={`rounded-full border px-4 py-2 text-sm ${viewMode === 'archive' ? 'border-amber-400/40 bg-amber-400/15 text-amber-100' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}>Archive ({archivedTenders.length})</button>
      </div>

      <div className="text-sm text-slate-400">{orderedTenders.length} tender{orderedTenders.length === 1 ? '' : 's'} matched</div>
      {message ? <div className="text-sm text-slate-300">{message}</div> : null}

      {viewMode === 'saved' ? (
        <div className="grid gap-4">
          {orderedTenders.map((tender) => (
            <article key={tender.id} className="card cursor-pointer p-6 transition hover:border-sky-400/30 hover:bg-white/[0.04]" onClick={() => setSelectedTender(tender)}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold text-white">{tender.title}</div>
                  <div className="text-sm text-slate-400">{tender.publisher || 'Official source'} · {tender.is_national ? 'National / Countrywide' : tender.province || 'Province not extracted'}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className={`badge border ${getSourceBadge(tender.source_type)}`}>{tender.source_label}</span>
                    <span className="badge border border-white/10 bg-white/5 text-slate-200">{tender.status}</span>
                    <span className="badge border border-white/10 bg-white/5 text-slate-200">Close {formatDate(tender.end_date)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <select className="input w-auto" value={tender.status} onClick={(event) => event.stopPropagation()} onChange={(event) => void onStatusChange(tender.id, event.target.value as TenderStatus)}>
                    {statuses.filter((status): status is TenderStatus => status !== 'all').map((status) => (<option key={status} value={status}>{status}</option>))}
                  </select>
                  <button type="button" className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100 hover:bg-amber-400/15" onClick={(event) => { event.stopPropagation(); void onArchive(tender) }}>Archive</button>
                </div>
              </div>

              <div className="mt-4 grid gap-2 text-sm text-slate-300 md:grid-cols-3">
                <div>{tender.contact_person || 'No contact person'}</div>
                <div className="break-all">{tender.contact_email || tender.contact_phone || 'No contact details'}</div>
                <div>{tender.source_url ? <a className="text-sky-300 underline-offset-2 hover:underline" href={tender.source_url} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>Open source</a> : 'No source URL'}</div>
              </div>
            </article>
          ))}
          {!orderedTenders.length ? <div className="card p-6 text-slate-400">No saved tenders matched your current filters.</div> : null}
        </div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="bg-white/5 text-left text-slate-300">
              <tr>
                <th className="px-4 py-3">Tender</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Close</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {orderedTenders.map((tender) => (
                <tr key={tender.id} className="text-slate-200">
                  <td className="px-4 py-3"><div className="font-medium text-white">{tender.title}</div><div className="text-xs text-slate-400">{tender.publisher}</div></td>
                  <td className="px-4 py-3">{tender.source_label}</td>
                  <td className="px-4 py-3">{tender.status}</td>
                  <td className="px-4 py-3">{formatDate(tender.end_date)}</td>
                  <td className="px-4 py-3"><div className="flex flex-wrap justify-end gap-2"><button type="button" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10" onClick={() => setSelectedTender(tender)}>View</button><button type="button" className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-emerald-100 hover:bg-emerald-400/15" onClick={() => void onReactivate(tender)}>Re-Activate</button><button type="button" className="rounded-lg border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-rose-100 hover:bg-rose-400/15" onClick={() => void onDelete(tender)}>Delete</button></div></td>
                </tr>
              ))}
              {!orderedTenders.length ? <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">No archived tenders matched your current filters.</td></tr> : null}
            </tbody>
          </table>
        </div>
      )}

      <TenderDetailModal tender={selectedTender} open={!!selectedTender} onClose={() => setSelectedTender(null)} />
    </div>
  )
}
