import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { createCheckoutSession, submitPayfastForm } from '../../services/billing.service'
import { fetchProfile } from '../../services/profile.service'
import type { Profile } from '../../types'

const plans = [
  {
    code: 'starter',
    name: 'Starter',
    price: 'R99 / month',
    features: ['200 searches / month', 'Lead scoring', 'Pipeline board'],
  },
  {
    code: 'pro',
    name: 'Pro',
    price: 'R299 / month',
    features: ['Unlimited saved leads', 'Outreach tools', 'Tender search and tender pipeline', 'Priority support'],
  },
] as const

function StatusBanner({
  status,
  profile,
}: {
  status: string | null
  profile: Profile | null
}) {
  if (!status) return null

  if (status === 'success') {
    return (
      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
        <div className="font-medium">Payment return received</div>
        <div className="mt-2">
          Your payment has returned from PayFast. Your account will only be treated as upgraded once the secure
          PayFast notification updates your subscription in the database.
        </div>
        <div className="mt-2 text-emerald-200/90">
          Current detected plan: <span className="font-medium uppercase">{profile?.plan || 'free'}</span>
        </div>
      </div>
    )
  }

  if (status === 'cancelled') {
    return (
      <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
        <div className="font-medium">Payment was cancelled</div>
        <div className="mt-2">
          No subscription change has been applied. You can choose a plan again whenever you are ready.
        </div>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-100">
        <div className="font-medium">Payment failed</div>
        <div className="mt-2">
          PayFast did not complete the transaction. Check your sandbox/live credentials and try again.
        </div>
      </div>
    )
  }

  return null
}

export function BillingPage() {
  const [message, setMessage] = useState('')
  const [loadingPlan, setLoadingPlan] = useState<'starter' | 'pro' | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [searchParams] = useSearchParams()

  const status = searchParams.get('status')

  useEffect(() => {
    void fetchProfile().then(setProfile).catch(() => setProfile(null))
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

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Billing and subscription plans</h1>
            <p className="mt-2 max-w-3xl text-slate-300">
              Start checkout through a secure server-side PayFast payment session. The app only treats a plan as active
              once the PayFast notification updates your account.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
            Current plan: <span className="font-medium uppercase text-white">{currentPlan}</span>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-medium text-white">Success return</div>
            <div className="mt-2 text-sm text-slate-300">
              <code className="text-sky-300">/app/billing?status=success</code>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-medium text-white">Cancelled return</div>
            <div className="mt-2 text-sm text-slate-300">
              <code className="text-sky-300">/app/billing?status=cancelled</code>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-medium text-white">Recommended failure route</div>
            <div className="mt-2 text-sm text-slate-300">
              <code className="text-sky-300">/app/billing?status=failed</code>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <StatusBanner status={status} profile={profile} />
        </div>

        {message ? <div className="mt-4 text-sm text-slate-300">{message}</div> : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.code

          return (
            <article key={plan.code} className="card p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="badge">{plan.name}</div>
                {isCurrent ? (
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100">
                    Active
                  </span>
                ) : null}
              </div>

              <div className="mt-4 text-3xl font-semibold text-white">{plan.price}</div>
              <ul className="mt-4 space-y-2 text-slate-300">
                {plan.features.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>

              <button
                onClick={() => void onSelect(plan.code)}
                disabled={loadingPlan !== null}
                className="mt-6 rounded-2xl bg-white/10 px-4 py-3 text-sm text-white hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingPlan === plan.code ? 'Redirecting to PayFast...' : `Select ${plan.name}`}
              </button>
            </article>
          )
        })}
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white">Deployment readiness notes</h2>
        <div className="mt-3 space-y-3 text-sm text-slate-300">
          <p>
            The billing page route is now ready to handle success, cancelled, and failure return states through the
            query string.
          </p>
          <p>
            The real source of truth remains the PayFast ITN callback. Do not unlock paid features purely from the
            return URL.
          </p>
          <p>
            Before public launch, confirm that the PayFast ITN updates both <code className="text-sky-300">subscriptions</code> and
            <code className="ml-1 text-sky-300">profiles</code> correctly.
          </p>
        </div>
      </div>
    </div>
  )
}
