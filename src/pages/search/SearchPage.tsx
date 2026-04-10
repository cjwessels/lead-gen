import { useState } from 'react'
import { searchPlaces } from '../../services/search.service'
import { saveLead } from '../../services/leads.service'
import type { Lead } from '../../types'

export function SearchPage() {
  const [query, setQuery] = useState('panel beaters Cape Town')
  const [results, setResults] = useState<Lead[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

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

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-semibold text-white">Lead search</h1>
        <p className="mt-2 text-slate-300">Search South African niches by area and save promising leads to your CRM.</p>
        <div className="mt-5 flex flex-col gap-3 md:flex-row">
          <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} />
          <button onClick={onSearch} className="rounded-2xl bg-sky-400 px-5 py-3 font-medium text-slate-950 hover:bg-sky-300">
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
        {message ? <div className="mt-4 text-sm text-slate-300">{message}</div> : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {results.map((lead) => (
          <article key={lead.id} className="card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">{lead.name}</h2>
                <div className="mt-1 text-sm text-slate-400">{lead.category} · {lead.city}</div>
              </div>
              <div className="badge">Score {lead.score}</div>
            </div>
            <div className="mt-4 space-y-2 text-sm text-slate-300">
              <div>{lead.phone || 'No phone returned'}</div>
              <div>{lead.website || 'No website returned'}</div>
              <div>Rating: {lead.rating || '-'} {lead.reviewCount ? `(${lead.reviewCount} reviews)` : ''}</div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {lead.painPoints.map((painPoint) => <span key={painPoint} className="badge">{painPoint}</span>)}
            </div>
            <button onClick={() => void onSave(lead)} className="mt-5 rounded-2xl bg-white/10 px-4 py-3 text-sm text-white hover:bg-white/15">
              Save lead
            </button>
          </article>
        ))}
        {!results.length ? <div className="card p-6 text-slate-400">Search results will appear here.</div> : null}
      </div>
    </div>
  )
}
