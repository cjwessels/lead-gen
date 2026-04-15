import { useMemo, useState } from 'react'
import { searchPlaces } from '../../services/search.service'
import { saveLead } from '../../services/leads.service'
import { getLeadHeatLabel, getLeadScoreBadgeClass } from '../../lib/leadScoring'
import type { Lead } from '../../types'

export function SearchPage() {
  const [query, setQuery] = useState('panel beaters Cape Town')
  const [results, setResults] = useState<Lead[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [hotLeadsOnly, setHotLeadsOnly] = useState(false)

  async function onSearch() {
    setLoading(true)
    setMessage('')
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

  const displayedResults = useMemo(() => {
    const filtered = hotLeadsOnly ? results.filter((lead) => lead.score >= 80) : results
    return [...filtered].sort((a, b) => b.score - a.score)
  }, [hotLeadsOnly, results])

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
              onChange={(event) => setHotLeadsOnly(event.target.checked)}
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

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
          <span>{displayedResults.length} lead{displayedResults.length === 1 ? '' : 's'} shown</span>
          <span>•</span>
          <span>Sorted by highest score first</span>
        </div>

        {message ? <div className="mt-4 text-sm text-slate-300">{message}</div> : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {displayedResults.map((lead) => (
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
        {!displayedResults.length ? (
          <div className="card p-6 text-slate-400">
            {results.length && hotLeadsOnly
              ? 'No hot leads matched this search. Turn off the filter to view all results.'
              : 'Search results will appear here.'}
          </div>
        ) : null}
      </div>
    </div>
  )
}
