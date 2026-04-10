import { useEffect, useMemo, useState } from 'react'
import { fetchSavedLeads } from '../../services/leads.service'
import { fetchProfile } from '../../services/profile.service'
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

  const usagePercent = profile && profile.monthly_search_limit > 0
    ? Math.min(100, Math.round((profile.monthly_searches_used / profile.monthly_search_limit) * 100))
    : 0

  return (
    <div className="space-y-8">
      <section className="card overflow-hidden p-8">
        <div className="badge mb-4">SaaS dashboard</div>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white">
          Track your plan, search usage, and lead pipeline in one place.
        </h1>
        <p className="mt-4 max-w-3xl text-slate-300">
          The dashboard now reads your live profile and lead data from Supabase.
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
          <h2 className="text-xl font-semibold text-white">Recommended next steps</h2>
          <ol className="mt-4 space-y-3 text-slate-300">
            <li>1. Connect Google Places and confirm live search is working.</li>
            <li>2. Complete PayFast recurring subscription validation.</li>
            <li>3. Add a monthly reset process for search usage.</li>
            <li>4. Add billing success and cancellation states in the UI.</li>
          </ol>
        </article>
      </section>
    </div>
  )
}
