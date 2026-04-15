import { useEffect, useMemo, useState } from 'react'
import { searchPlaces } from '../../services/search.service'
import { saveLead } from '../../services/leads.service'
import { getLeadHeatLabel, getLeadScoreBadgeClass } from '../../lib/leadScoring'
import type { Lead } from '../../types'

const ITEMS_PER_PAGE = 8
const ALL_PAIN_POINTS = 'All'

export function SearchPage() {
  const [query, setQuery] = useState('panel beaters Cape Town')
  const [results, setResults] = useState<Lead[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [hotLeadsOnly, setHotLeadsOnly] = useState(false)
  const [minScore, setMinScore] = useState(0)
  const [selectedPainPoints, setSelectedPainPoints] = useState<string[]>([ALL_PAIN_POINTS])
  const [currentPage, setCurrentPage] = useState(1)

  async function onSearch() {
    setLoading(true)
    setMessage('')
    setCurrentPage(1)
    try {
      setResults(await searchPlaces(query))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  async function onSave(lead: Lead) {
    try {
      await saveLead(lead)
      setMessage(`Saved ${lead.name}`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save lead')
    }
  }

  const availablePainPoints = useMemo(() => {
    const values = new Set<string>()
    results.forEach((lead) => lead.painPoints.forEach((painPoint) => values.add(painPoint)))
    return [ALL_PAIN_POINTS, ...Array.from(values).sort((a, b) => a.localeCompare(b))]
  }, [results])

  function togglePainPoint(value: string) {
    setCurrentPage(1)

    if (value === ALL_PAIN_POINTS) {
      setSelectedPainPoints([ALL_PAIN_POINTS])
      return
    }

    setSelectedPainPoints((current) => {
      const withoutAll = current.filter((item) => item !== ALL_PAIN_POINTS)

      if (withoutAll.includes(value)) {
        const next = withoutAll.filter((item) => item !== value)
        return next.length ? next : [ALL_PAIN_POINTS]
      }

      return [...withoutAll, value]
    })
  }

  const filteredResults = useMemo(() => {
    const selectedSpecificPainPoints = selectedPainPoints.filter((item) => item !== ALL_PAIN_POINTS)

    const filtered = results.filter((lead) => {
      if (lead.score < minScore) return false
      if (hotLeadsOnly && lead.score < 80) return false
      if (!selectedSpecificPainPoints.length) return true
      return selectedSpecificPainPoints.some((painPoint) => lead.painPoints.includes(painPoint))
    })

    return [...filtered].sort((a, b) => b.score - a.score)
  }, [hotLeadsOnly, minScore, results, selectedPainPoints])

  const totalPages = Math.max(1, Math.ceil(filteredResults.length / ITEMS_PER_PAGE))

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages))
  }, [totalPages])

  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredResults.slice(start, start + ITEMS_PER_PAGE)
  }, [currentPage, filteredResults])

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Lead search</h1>
            <p className="mt-2 text-slate-300">
              Search South African niches by area, surface the best opportunities first, and save strong prospects to your CRM.
            </p>
          </div>

          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={hotLeadsOnly}
              onChange={(event) => {
                setHotLeadsOnly(event.target.checked)
                setCurrentPage(1)
              }}
            />
            Hot Leads Only
          </label>
        </div>

        <div className="mt-5 flex flex-col gap-3 md:flex-row">
          <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} />
          <button onClick={onSearch} className="rounded-2xl bg-sky-400 px-5 py-3 font-medium text-slate-950 hover:bg-sky-300">
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[1.15fr_1fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-white">Minimum lead strength</div>
                <div className="mt-1 text-xs text-slate-400">
                  Only show leads with a score of {minScore} or higher.
                </div>
              </div>
              <span className={`badge border ${getLeadScoreBadgeClass(minScore)}`}>{getLeadHeatLabel(minScore)}</span>
            </div>

            <input
              className="mt-4 w-full accent-sky-400"
              type="range"
              min={0}
              max={100}
              step={5}
              value={minScore}
              onChange={(event) => {
                setMinScore(Number(event.target.value))
                setCurrentPage(1)
              }}
            />
            <div className="mt-2 flex justify-between text-xs text-slate-500">
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-medium text-white">Pain point focus</div>
            <div className="mt-1 text-xs text-slate-400">
              Multi-select the opportunity themes you want to focus on. All is selected by default.
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {availablePainPoints.map((painPoint) => {
                const active = selectedPainPoints.includes(painPoint)
                return (
                  <button
                    key={painPoint}
                    type="button"
                    onClick={() => togglePainPoint(painPoint)}
                    className={`rounded-full border px-3 py-2 text-xs transition ${
                      active
                        ? 'border-sky-400/40 bg-sky-400/15 text-sky-100'
                        : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {painPoint}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
          <span>{filteredResults.length} lead{filteredResults.length === 1 ? '' : 's'} matched</span>
          <span>•</span>
          <span>Page {currentPage} of {totalPages}</span>
          <span>•</span>
          <span>Sorted by highest score first</span>
        </div>

        {message ? <div className="mt-4 text-sm text-slate-300">{message}</div> : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {paginatedResults.map((lead) => (
          <article key={lead.id} className="card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">{lead.name}</h2>
                <div className="mt-1 text-sm text-slate-400">{lead.category} · {lead.city}</div>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <span className={`badge border ${getLeadScoreBadgeClass(lead.score)}`}>
                  Score {lead.score}
                </span>
                <span className={`badge border ${getLeadScoreBadgeClass(lead.score)}`}>
                  {getLeadHeatLabel(lead.score)}
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm text-slate-300">
              <div>{lead.phone || 'No phone returned'}</div>
              <div className="break-all">{lead.website || 'No website returned'}</div>
              <div>Rating: {lead.rating || '-'} {lead.reviewCount ? `(${lead.reviewCount} reviews)` : ''}</div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {lead.painPoints.map((painPoint) => (
                <span key={painPoint} className="badge border border-slate-400/20 bg-white/5 text-slate-200">
                  {painPoint}
                </span>
              ))}
            </div>

            <button onClick={() => void onSave(lead)} className="mt-5 rounded-2xl bg-white/10 px-4 py-3 text-sm text-white hover:bg-white/15">
              Save lead
            </button>
          </article>
        ))}
        {!paginatedResults.length ? (
          <div className="card p-6 text-slate-400">
            {results.length
              ? 'No leads matched the current strength and pain-point filters. Lower the minimum score or widen your focus.'
              : 'Search results will appear here.'}
          </div>
        ) : null}
      </div>

      {filteredResults.length > ITEMS_PER_PAGE ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
          <div className="text-sm text-slate-400">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredResults.length)} of {filteredResults.length}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <div className="rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2 text-sm text-slate-300">
              {currentPage} / {totalPages}
            </div>

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
