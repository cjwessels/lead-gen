import { useEffect, useMemo, useState } from 'react'
import { fetchProfile } from '../../services/profile.service'
import { fetchSavedTenders, saveTender, searchTenders, updateTenderStatus } from '../../services/tenders.service'
import type { Profile, Tender, TenderSearchResult, TenderStatus } from '../../types'

const statuses: TenderStatus[] = ['identified', 'reviewing', 'qualifying', 'bid-prep', 'submitted', 'won', 'lost']
const smartSearches = [
  'managed services',
  'office automation',
  'network management',
  'IT support',
  'document management',
  'cybersecurity',
]
const ALL_PROVINCES = 'All provinces'
const PAGE_SIZE = 20

function formatDate(value?: string) {
  if (!value) return 'Not provided'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString()
}

function daysUntil(value?: string) {
  if (!value) return null
  const close = new Date(value)
  if (Number.isNaN(close.getTime())) return null
  const today = new Date()
  close.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  return Math.round((close.getTime() - today.getTime()) / 86400000)
}

function getClosingBadge(days: number | null) {
  if (days === null) return { label: 'Date unclear', className: 'border-slate-400/20 bg-white/5 text-slate-200' }
  if (days < 0) return { label: 'May be closed', className: 'border-rose-400/20 bg-rose-400/10 text-rose-100' }
  if (days <= 7) return { label: 'Closing soon', className: 'border-amber-400/20 bg-amber-400/10 text-amber-100' }
  return { label: 'Open window', className: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100' }
}

export function TendersPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [query, setQuery] = useState('managed services')
  const [results, setResults] = useState<TenderSearchResult[]>([])
  const [savedTenders, setSavedTenders] = useState<Tender[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [selectedProvince, setSelectedProvince] = useState(ALL_PROVINCES)
  const [openOnly, setOpenOnly] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState<number | undefined>(undefined)

  useEffect(() => {
    void fetchProfile().then(setProfile).catch(() => setProfile(null))
    void fetchSavedTenders().then(setSavedTenders).catch(() => setSavedTenders([]))
  }, [])

  const isPro = profile?.plan === 'pro'

  async function runSearch(targetPage: number) {
    if (!isPro) return
    setLoading(true)
    setMessage('')
    try {
      const response = await searchTenders(query, targetPage, PAGE_SIZE)
      setResults(response.results)
      setPage(response.page)
      setHasMore(response.hasMore)
      setTotal(response.total)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Tender search failed')
    } finally {
      setLoading(false)
    }
  }

  async function onSave(tender: TenderSearchResult) {
    try {
      const saved = await saveTender(tender)
      setSavedTenders((current) => {
        const exists = current.some((item) => item.id === saved.id)
        return exists ? current : [saved, ...current]
      })
      setMessage(`Saved tender: ${tender.title}`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save tender')
    }
  }

  async function onStatusChange(id: string, status: TenderStatus) {
    try {
      await updateTenderStatus(id, status)
      setSavedTenders((current) => current.map((item) => (item.id === id ? { ...item, status } : item)))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update tender')
    }
  }

  const provinceOptions = useMemo(() => {
    const set = new Set<string>()
    results.forEach((result) => {
      if (result.province) set.add(result.province)
      if (result.is_national) set.add('National')
    })
    return [ALL_PROVINCES, ...Array.from(set)]
  }, [results])

  const filteredResults = useMemo(() => {
    return results.filter((result) => {
      const closeDays = daysUntil(result.end_date)
      if (openOnly && closeDays !== null && closeDays < 0) return false
      if (selectedProvince === ALL_PROVINCES) return true
      if (selectedProvince === 'National') return !!result.is_national
      return result.province === selectedProvince
    })
  }, [openOnly, results, selectedProvince])

  const grouped = useMemo(
    () => Object.fromEntries(statuses.map((status) => [status, savedTenders.filter((tender) => tender.status === status)])),
    [savedTenders],
  )

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="badge mb-3">Pro feature · Phase 2</div>
            <h1 className="text-2xl font-semibold text-white">Tender search and tender pipeline</h1>
            <p className="mt-2 max-w-3xl text-slate-300">
              Tender search now uses structured procurement data instead of HTML page scraping. That improves relevance,
              lets the search respond properly to your keywords, and adds more reliable pagination.
            </p>
          </div>

          {!isPro ? (
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              Tender search is available to Pro subscribers only. Upgrade on Billing to unlock it.
            </div>
          ) : null}
        </div>

        <div className="mt-5 flex flex-col gap-3 md:flex-row">
          <input
            className="input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tenders e.g. managed services, office automation, network management"
            disabled={!isPro}
          />
          <button
            onClick={() => void runSearch(1)}
            disabled={!isPro}
            className="rounded-2xl bg-sky-400 px-5 py-3 font-medium text-slate-950 hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? 'Searching...' : 'Search tenders'}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {smartSearches.map((value) => (
            <button
              key={value}
              type="button"
              disabled={!isPro}
              onClick={() => setQuery(value)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 hover:bg-white/10 disabled:opacity-40"
            >
              {value}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-medium text-white">Province filter</div>
            <div className="mt-1 text-xs text-slate-400">Use extracted province information to focus on countrywide or specific regional opportunities.</div>
            <div className="mt-4 flex flex-wrap gap-2">
              {provinceOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSelectedProvince(option)}
                  className={`rounded-full border px-3 py-2 text-xs transition ${
                    selectedProvince === option
                      ? 'border-sky-400/40 bg-sky-400/15 text-sky-100'
                      : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-medium text-white">Tender window focus</div>
            <div className="mt-1 text-xs text-slate-400">Hide opportunities that appear to be closed and surface tenders that are still worth reviewing.</div>
            <label className="mt-4 flex items-center gap-3 text-sm text-slate-200">
              <input type="checkbox" checked={openOnly} onChange={(event) => setOpenOnly(event.target.checked)} />
              Show open or undated tenders only
            </label>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
          <span>Structured data source active</span>
          <span>•</span>
          <span>Page {page}</span>
          <span>•</span>
          <span>{typeof total === 'number' ? `${total} candidates scanned` : `${results.length} results returned`}</span>
        </div>

        {message ? <div className="mt-4 text-sm text-slate-300">{message}</div> : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-white">Open tender results</h2>
            <div className="text-sm text-slate-400">{filteredResults.length} matched on this page</div>
          </div>

          {filteredResults.length ? (
            filteredResults.map((tender) => {
              const closeDays = daysUntil(tender.end_date)
              const closeBadge = getClosingBadge(closeDays)

              return (
                <article key={tender.source_id} className="card p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{tender.title}</h3>
                      <div className="mt-1 text-sm text-slate-400">{tender.publisher || 'Official source'}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <div className="badge">Tender score {tender.score}</div>
                      <div className={`badge border ${closeBadge.className}`}>{closeBadge.label}</div>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-300">{tender.summary}</p>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-xs uppercase tracking-wide text-slate-400">Location</div>
                      <div className="mt-2 text-sm text-slate-200">{tender.is_national ? 'National / Countrywide' : tender.province || 'Province not extracted'}</div>
                      <div className="mt-1 text-xs text-slate-400">{tender.location_text || 'Location details not extracted from the source data.'}</div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-xs uppercase tracking-wide text-slate-400">Dates</div>
                      <div className="mt-2 text-sm text-slate-200">Start: {formatDate(tender.start_date)}</div>
                      <div className="mt-1 text-sm text-slate-200">Close: {formatDate(tender.end_date)}</div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-xs uppercase tracking-wide text-slate-400">Qualification / notes</div>
                      <div className="mt-2 text-sm text-slate-200">
                        {tender.qualification_notes || 'Qualification details are not explicit in the current structured record.'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {tender.focus_tags.map((tag) => (
                      <span key={tag} className="badge border border-sky-400/25 bg-sky-400/10 text-sky-100">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => void onSave(tender)}
                      disabled={!isPro}
                      className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-white hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Save to tender pipeline
                    </button>

                    {tender.source_url ? (
                      <a
                        href={tender.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 hover:bg-white/10"
                      >
                        Open source
                      </a>
                    ) : null}
                  </div>
                </article>
              )
            })
          ) : (
            <div className="card p-6 text-slate-400">
              {isPro
                ? 'Search results will appear here. Use a service phrase such as managed services or office automation.'
                : 'Upgrade to Pro to unlock active tender search and tender pipeline management.'}
            </div>
          )}

          {isPro && results.length ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <div className="text-sm text-slate-400">Structured API page {page}</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page === 1 || loading}
                  onClick={() => void runSearch(page - 1)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={!hasMore || loading}
                  onClick={() => void runSearch(page + 1)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Tender pipeline</h2>
          {statuses.map((status) => (
            <div key={status} className="card p-4">
              <div className="mb-3 text-sm font-medium uppercase tracking-wide text-sky-300">{status}</div>
              <div className="space-y-3">
                {(grouped[status] || []).length ? (
                  grouped[status].map((tender) => (
                    <article key={tender.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="font-medium text-white">{tender.title}</div>
                      <div className="mt-1 text-xs text-slate-400">{tender.publisher}</div>
                      <div className="mt-2 text-xs text-slate-300">
                        {tender.is_national ? 'National / Countrywide' : tender.province || 'Province not extracted'}
                      </div>
                      <div className="mt-1 text-xs text-slate-300">Close: {formatDate(tender.end_date)}</div>
                      <select
                        className="input mt-3 w-full"
                        value={tender.status}
                        onChange={(event) => void onStatusChange(tender.id, event.target.value as TenderStatus)}
                      >
                        {statuses.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </article>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 p-4 text-xs text-slate-500">
                    No tenders
                  </div>
                )}
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}
