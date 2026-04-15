import { useEffect, useMemo, useState } from 'react'
import { fetchSavedLeads } from '../../services/leads.service'
import { fetchProfile } from '../../services/profile.service'
import { getLeadHeatLabel, getLeadScoreBadgeClass } from '../../lib/leadScoring'
import type { Lead, Profile } from '../../types'

export function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])

  useEffect(() => {
    void fetchProfile().then(setProfile).catch(() => setProfile(null))
    void fetchSavedLeads().then(setLeads).catch(() => setLeads([]))
  }, [])

  const qualifiedCount = useMemo(
    () => leads.filter((lead) => ['qualified', 'contacted', 'follow-up', 'proposal-sent'].includes(lead.status)).length,
    [leads],
  )

  const wonCount = useMemo(() => leads.filter((lead) => lead.status === 'won').length, [leads])

  const averageScore = useMemo(() => {
    if (!leads.length) return 0
    return Math.round(leads.reduce((sum, lead) => sum + lead.score, 0) / leads.length)
  }, [leads])

  const topLead = useMemo(() => {
    if (!leads.length) return null
    return [...leads].sort((a, b) => b.score - a.score)[0]
  }, [leads])

  const searchesRemaining = Math.max(
    0,
    (profile?.monthly_search_limit ?? 20) - (profile?.monthly_searches_used ?? 0),
  )

  const usagePercent =
    profile && profile.monthly_search_limit > 0
      ? Math.min(100, Math.round((profile.monthly_searches_used / profile.monthly_search_limit) * 100))
      : 0

  return (
    <div className="space-y-8">
      <section className="card overflow-hidden p-8">
        <div className="badge mb-4">SaaS dashboard</div>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white">
          Track your plan, lead quality, and activity from one operating view.
        </h1>
        <p className="mt-4 max-w-3xl text-slate-300">
          Use the dashboard to monitor how much quota remains, where your strongest leads are sitting, and what to work next.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="card p-6">
          <div className="text-sm text-slate-400">Current plan</div>
          <div className="mt-3 text-3xl font-semibold uppercase text-white">{profile?.plan || 'free'}</div>
        </article>

        <article className="card p-6">
          <div className="text-sm text-slate-400">Monthly searches used</div>
          <div className="mt-3 text-3xl font-semibold text-white">
            {profile?.monthly_searches_used ?? 0} / {profile?.monthly_search_limit ?? 20}
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/5">
            <div className="h-full rounded-full bg-sky-400" style={{ width: `${usagePercent}%` }} />
          </div>
        </article>

        <article className="card p-6">
          <div className="text-sm text-slate-400">Saved leads</div>
          <div className="mt-3 text-3xl font-semibold text-white">{leads.length}</div>
        </article>

        <article className="card p-6">
          <div className="text-sm text-slate-400">Won leads</div>
          <div className="mt-3 text-3xl font-semibold text-white">{wonCount}</div>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <article className="card p-6">
          <h2 className="text-xl font-semibold text-white">Pipeline snapshot</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-slate-400">New</div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {leads.filter((lead) => lead.status === 'new').length}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-slate-400">Active</div>
              <div className="mt-2 text-2xl font-semibold text-white">{qualifiedCount}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-slate-400">Lost</div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {leads.filter((lead) => lead.status === 'lost').length}
              </div>
            </div>
          </div>
        </article>

        <article className="card p-6">
          <h2 className="text-xl font-semibold text-white">Workspace health</h2>
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-slate-400">Searches remaining this month</div>
              <div className="mt-2 text-2xl font-semibold text-white">{searchesRemaining}</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-slate-400">Average lead score</div>
              <div className="mt-2 text-2xl font-semibold text-white">{averageScore}</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-slate-400">Best lead in pipeline</div>
              {topLead ? (
                <div className="mt-2">
                  <div className="font-medium text-white">{topLead.name}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className={`badge border ${getLeadScoreBadgeClass(topLead.score)}`}>Score {topLead.score}</span>
                    <span className={`badge border ${getLeadScoreBadgeClass(topLead.score)}`}>{getLeadHeatLabel(topLead.score)}</span>
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-slate-300">No saved leads yet.</div>
              )}
            </div>
          </div>
        </article>
      </section>
    </div>
  )
}
