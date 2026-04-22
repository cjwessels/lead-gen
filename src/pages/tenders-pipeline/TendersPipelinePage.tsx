import { useEffect, useMemo, useState } from 'react'
import { fetchSavedTenders, updateTenderStatus } from '../../services/tenders.service'
import { TenderDetailModal } from '../../components/tenders/TenderDetailModal'
import type { Tender, TenderStatus, TenderSourceType } from '../../types'

const columns: TenderStatus[] = ['identified', 'reviewing', 'qualifying', 'bid-prep', 'submitted', 'won', 'lost']
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

export function TendersPipelinePage() {
  const [tenders, setTenders] = useState<Tender[]>([])
  const [search, setSearch] = useState('')
  const [selectedSource, setSelectedSource] = useState<string>(ALL_SOURCES)
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null)

  useEffect(() => {
    void fetchSavedTenders(false).then(setTenders).catch(() => setTenders([]))
  }, [])

  async function onStatusChange(id: string, status: TenderStatus) {
    await updateTenderStatus(id, status)
    setTenders((current) => current.map((tender) => (tender.id === id ? { ...tender, status } : tender)))
    setSelectedTender((current) => (current && current.id === id ? { ...current, status } : current))
  }

  const sourceOptions = useMemo(() => [ALL_SOURCES, ...Array.from(new Set(tenders.map((tender) => tender.source_type)))], [tenders])

  const filteredTenders = useMemo(() => {
    const term = search.trim().toLowerCase()
    return tenders.filter((tender) => {
      if (selectedSource !== ALL_SOURCES && tender.source_type !== selectedSource) return false
      if (!term) return true
      const haystack = [tender.title, tender.publisher, tender.province, tender.location_text, tender.summary, ...tender.focus_tags]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(term)
    })
  }, [search, selectedSource, tenders])

  const grouped = useMemo(
    () => Object.fromEntries(columns.map((column) => [column, filteredTenders.filter((tender) => tender.status === column)])),
    [filteredTenders],
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Tenders Pipeline</h1>
          <p className="text-slate-400">Filter, search, and click a card to inspect full tender details and notes.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[560px]">
          <input className="input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Quick search across the tenders pipeline..." />
          <select className="input" value={selectedSource} onChange={(event) => setSelectedSource(event.target.value)}>
            <option value={ALL_SOURCES}>All sources</option>
            {sourceOptions.filter((option) => option !== ALL_SOURCES).map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-7">
        {columns.map((column) => (
          <section key={column} className="card p-4">
            <div className="mb-4 text-sm font-medium uppercase tracking-wide text-sky-300">{column}</div>
            <div className="space-y-3">
              {(grouped[column] || []).length ? (
                grouped[column].map((tender) => (
                  <article
                    key={tender.id}
                    className="cursor-pointer rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-sky-400/30 hover:bg-white/[0.07]"
                    onClick={() => setSelectedTender(tender)}
                  >
                    <div className="text-sm font-medium text-white">{tender.title}</div>
                    <div className="mt-1 text-xs text-slate-400">{tender.publisher || 'Official source'}</div>
                    <div className="mt-3 flex flex-wrap gap-2"><span className={`badge border ${getSourceBadge(tender.source_type)}`}>{tender.source_label}</span></div>
                    <div className="mt-3 text-xs text-slate-300">Close {formatDate(tender.end_date)}</div>
                    <select
                      className="input mt-3 w-full"
                      value={tender.status}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) => void onStatusChange(tender.id, event.target.value as TenderStatus)}
                    >
                      {columns.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 p-4 text-xs text-slate-500">No tenders</div>
              )}
            </div>
          </section>
        ))}
      </div>

      <TenderDetailModal tender={selectedTender} open={!!selectedTender} onClose={() => setSelectedTender(null)} />
    </div>
  )
}
