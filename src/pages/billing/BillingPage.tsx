const plans = [
  {
    code: 'free',
    name: 'Free',
    price: 'R0',
    features: ['20 searches / month', '20 saved leads', 'Manual outreach'],
  },
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
    features: ['Unlimited saved leads', 'Outreach tools', 'Priority support'],
  },
]

export function BillingPage() {
  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-semibold text-white">Billing and subscription plans</h1>
        <p className="mt-2 text-slate-300">
          PayFast should be handled through a server-side create-payment endpoint and an ITN verification
          function. The starter below includes the webhook skeleton.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <article key={plan.code} className="card p-6">
            <div className="badge">{plan.name}</div>
            <div className="mt-4 text-3xl font-semibold text-white">{plan.price}</div>
            <ul className="mt-4 space-y-2 text-slate-300">
              {plan.features.map((feature) => (
                <li key={feature}>• {feature}</li>
              ))}
            </ul>
            <button className="mt-6 rounded-2xl bg-white/10 px-4 py-3 text-sm text-white hover:bg-white/15">
              Select {plan.name}
            </button>
          </article>
        ))}
      </div>
    </div>
  )
}
