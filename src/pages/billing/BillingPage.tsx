import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { createCheckoutSession, fetchSubscriptionPortal, getSubscriptionLabel, manageSubscription, submitPayfastForm } from '../../services/billing.service'
import { fetchProfile } from '../../services/profile.service'
import type { Profile, SubscriptionRecord } from '../../types'

const plans = [
  {
    code: 'starter',
    name: 'Starter',
    price: 'R99 / month',
    features: ['200 searches / month', 'Lead scoring', 'Pipeline board', 'Recurring monthly billing'],
  },
  {
    code: 'pro',
    name: 'Pro',
    price: 'R299 / month',
    features: ['Unlimited saved leads', 'Outreach tools', 'Tender search and tender pipeline', 'Recurring monthly billing'],
  },
] as const

function StatusBanner({ status, profile }: { status: string | null; profile: Profile | null }) {
  if (!status) return null

  const base = 'rounded-2xl p-4 text-sm'
  if (status === 'success') {
    return <div className={`${base} border border-emerald-400/20 bg-emerald-400/10 text-emerald-100`}>PayFast returned the customer to billing successfully. The account only upgrades after the secure ITN confirms the charge. Current detected plan: <span className="font-medium uppercase">{profile?.plan || 'free'}</span>.</div>
  }

  if (status === 'cancelled') {
    return <div className={`${base} border border-amber-400/20 bg-amber-400/10 text-amber-100`}>The checkout was cancelled before completion. No plan change has been applied.</div>
  }

  if (status === 'failed') {
    return <div className={`${base} border border-rose-400/20 bg-rose-400/10 text-rose-100`}>PayFast reported a failed checkout return. Confirm your live credentials, passphrase, recurring billing setting, and ITN endpoint.</div>
  }

  return null
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function SubscriptionPanel({
  subscription,
  portal,
  busy,
  onAction,
}: {
  subscription: SubscriptionRecord | null
  portal: string | null
  busy: boolean
  onAction: (action: 'cancel' | 'pause' | 'unpause' | 'fetch') => Promise<void>
}) {
  return (
    <div className="card p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Subscription controls</h2>
          <p className="mt-2 text-sm text-slate-300">Use these controls to inspect the PayFast subscription, pause it, cancel it, or let the client update their own card details.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">{getSubscriptionLabel(subscription)}</div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="text-xs uppercase tracking-wide text-slate-400">Started</div><div className="mt-2 text-sm text-white">{formatDate(subscription?.started_at || subscription?.created_at)}</div></div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="text-xs uppercase tracking-wide text-slate-400">Last payment</div><div className="mt-2 text-sm text-white">{formatDate(subscription?.last_payment_at)}</div></div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="text-xs uppercase tracking-wide text-slate-400">Failed attempts</div><div className="mt-2 text-sm text-white">{subscription?.failed_payment_count ?? 0}</div></div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="text-xs uppercase tracking-wide text-slate-400">PayFast token</div><div className="mt-2 break-all text-sm text-white">{subscription?.payfast_subscription_token || 'Not stored yet'}</div></div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button onClick={() => void onAction('fetch')} disabled={busy} className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-white hover:bg-white/15 disabled:opacity-50">Refresh from PayFast</button>
        <button onClick={() => void onAction(subscription?.status === 'on_hold' ? 'unpause' : 'pause')} disabled={busy || !subscription?.payfast_subscription_token} className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-white hover:bg-white/15 disabled:opacity-50">{subscription?.status === 'on_hold' ? 'Resume subscription' : 'Pause / hold subscription'}</button>
        <button onClick={() => void onAction('cancel')} disabled={busy || !subscription?.payfast_subscription_token} className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100 hover:bg-rose-400/15 disabled:opacity-50">Cancel subscription</button>
        {portal ? (
          <a href={portal} target="_blank" rel="noreferrer" className="rounded-2xl bg-sky-500 px-4 py-3 text-sm font-medium text-slate-950 hover:bg-sky-400">Update saved card</a>
        ) : (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">Card update links only work once a live subscription token exists.</div>
        )}
      </div>
    </div>
  )
}

export function BillingPage() {
  const [message, setMessage] = useState('')
  const [loadingPlan, setLoadingPlan] = useState<'starter' | 'pro' | null>(null)
  const [portalBusy, setPortalBusy] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(null)
  const [portal, setPortal] = useState<string | null>(null)
  const [searchParams] = useSearchParams()

  const status = searchParams.get('status')

  async function loadBillingState() {
    const [profileData, portalData] = await Promise.all([fetchProfile(), fetchSubscriptionPortal()])
    setProfile(profileData)
    setSubscription(portalData.subscription)
    setPortal(portalData.portal)
  }

  useEffect(() => {
    void loadBillingState().catch((error) => setMessage(error instanceof Error ? error.message : 'Could not load billing data'))
  }, [])

  const currentPlan = useMemo(() => profile?.plan || 'free', [profile])

  async function onSelect(plan: 'starter' | 'pro') {
    setMessage('')
    setLoadingPlan(plan)
    try {
      const checkout = await createCheckoutSession(plan)
      submitPayfastForm(checkout)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not start checkout')
      setLoadingPlan(null)
    }
  }

  async function onSubscriptionAction(action: 'cancel' | 'pause' | 'unpause' | 'fetch') {
    setMessage('')
    setPortalBusy(true)
    try {
      const result = await manageSubscription(action)
      setSubscription(result.subscription)
      setPortal(result.portal)
      setProfile(await fetchProfile())
      setMessage(action === 'fetch' ? 'Subscription status refreshed from PayFast.' : `Subscription ${action.replace('_', ' ')} action completed.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Subscription action failed')
    } finally {
      setPortalBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Billing and recurring subscriptions</h1>
            <p className="mt-2 max-w-3xl text-slate-300">This billing flow is now structured for PayFast recurring billing, ITN-driven activation, self-service card updates, and merchant-side pause or cancellation.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">Current plan: <span className="font-medium uppercase text-white">{currentPlan}</span></div>
        </div>

        <div className="mt-4"><StatusBanner status={status} profile={profile} /></div>
        {message ? <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">{message}</div> : null}
      </div>

      <SubscriptionPanel subscription={subscription} portal={portal} busy={portalBusy} onAction={onSubscriptionAction} />

      <div className="grid gap-4 lg:grid-cols-2">
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.code
          return (
            <article key={plan.code} className="card p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="badge">{plan.name}</div>
                {isCurrent ? <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100">Active</span> : null}
              </div>
              <div className="mt-4 text-3xl font-semibold text-white">{plan.price}</div>
              <ul className="mt-4 space-y-2 text-slate-300">{plan.features.map((feature) => <li key={feature}>• {feature}</li>)}</ul>
              <button onClick={() => void onSelect(plan.code)} disabled={loadingPlan !== null || portalBusy} className="mt-6 rounded-2xl bg-white/10 px-4 py-3 text-sm text-white hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50">{loadingPlan === plan.code ? 'Redirecting to PayFast...' : isCurrent ? `Restart ${plan.name} checkout` : `Select ${plan.name}`}</button>
            </article>
          )
        })}
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white">Operational notes</h2>
        <div className="mt-3 space-y-3 text-sm text-slate-300">
          <p>The database source of truth is the PayFast ITN callback, not the return URL.</p>
          <p>Failed recurring charges are marked past due, and after repeated failures the subscription is moved onto hold in the app. PayFast states that failed subscriptions are retried up to 5 times over 5 days before being locked.</p>
          <p>Sandbox can be used for basic checkout testing, but live recurring token behaviour should be validated with a real recurring-enabled merchant profile before launch.</p>
        </div>
      </div>
    </div>
  )
}
