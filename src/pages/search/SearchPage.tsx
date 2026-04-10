import { useState } from 'react'
import { searchPlaces } from '../../services/search.service'
import type { Lead } from '../../types'

export function SearchPage() {
  const [query, setQuery] = useState('panel beaters Cape Town')
  const [results, setResults] = useState<Lead[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSearch() {
    setLoading(true)
    setError('')
    try {
      const data = await searchPlaces(query)
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-semibold text-white">Lead search</h1>
        <p className="mt-2 text-slate-300">
          Use a niche plus area, for example: panel beaters Cape Town, wholesalers Johannesburg, or
          engineering firms Durban.
        </p>

        <div className="mt-5 flex flex-col gap-3 md:flex-row">
          <input
            className="input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search query"
          />
          <button
            onClick={onSearch}
            className="rounded-2xl bg-sky-400 px-5 py-3 font-medium text-slate-950 hover:bg-sky-300"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {error ? <div className="mt-4 text-sm text-rose-300">{error}</div> : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {results.map((lead) => (
          <article key={lead.id} className="card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">{lead.name}</h2>
                <div className="mt-1 text-sm text-slate-400">
                  {lead.category} · {lead.city}
                </div>
              </div>
              <div className="badge">Score {lead.score}</div>
            </div>

            <div className="mt-4 space-y-2 text-sm text-slate-300">
              <div>{lead.phone || 'No phone returned'}</div>
              <div>{lead.website || 'No website returned'}</div>
              <div>
                Rating: {lead.rating || '-'} {lead.reviewCount ? `(${lead.reviewCount} reviews)` : ''}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {lead.painPoints.map((painPoint) => (
                <span key={painPoint} className="badge">
                  {painPoint}
                </span>
              ))}
            </div>
          </article>
        ))}

        {!results.length ? (
          <div className="card p-6 text-slate-400">
            Search results will appear here. Without Supabase env vars, the page uses mock data so you
            can verify the UX first.
          </div>
        ) : null}
      </div>
    </div>
  )
}
