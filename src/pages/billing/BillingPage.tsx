import { useState } from 'react'
import { createCheckoutSession, submitPayfastForm } from '../../services/billing.service'

const plans = [
  { code: 'starter', name: 'Starter', price: 'R99 / month', features: ['200 searches / month', 'Lead scoring', 'Pipeline board'] },
  { code: 'pro', name: 'Pro', price: 'R299 / month', features: ['Unlimited saved leads', 'Outreach tools', 'Tender search and tender pipeline', 'Priority support'] },
] as const

export function BillingPage() {
  const [message, setMessage] = useState('')

  async function onSelect(plan: 'starter' | 'pro') {
    setMessage('')
    try {
      const checkout = await createCheckoutSession(plan)
      submitPayfastForm(checkout)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not start checkout')
    }
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-semibold text-white">Billing and subscription plans</h1>
        <p className="mt-2 text-slate-300">Launch checkout through a server-side PayFast payment session.</p>
        {message ? <div className="mt-4 text-sm text-slate-300">{message}</div> : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {plans.map((plan) => (
          <article key={plan.code} className="card p-6">
            <div className="badge">{plan.name}</div>
            <div className="mt-4 text-3xl font-semibold text-white">{plan.price}</div>
            <ul className="mt-4 space-y-2 text-slate-300">
              {plan.features.map((feature) => <li key={feature}>• {feature}</li>)}
            </ul>
            <button onClick={() => void onSelect(plan.code)} className="mt-6 rounded-2xl bg-white/10 px-4 py-3 text-sm text-white hover:bg-white/15">
              Select {plan.name}
            </button>
          </article>
        ))}
      </div>
    </div>
  )
}
