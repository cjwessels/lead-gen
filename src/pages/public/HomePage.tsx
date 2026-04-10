import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../../modules/auth/AuthProvider'

const features = [
  'Search South African business niches by area',
  'Save and score leads for follow-up',
  'Track progress in a simple sales pipeline',
  'Launch subscription billing with PayFast',
]

export function HomePage() {
  const { user, loading } = useAuth()

  if (!loading && user) {
    return <Navigate to="/app/dashboard" replace />
  }

  return (
    <div className="space-y-10">
      <section className="card overflow-hidden p-8 md:p-12">
        <div className="badge mb-4">Lead generation SaaS</div>
        <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-white md:text-6xl">
          Find South African business leads and move them into paying opportunities.
        </h1>
        <p className="mt-5 max-w-3xl text-lg text-slate-300">
          SaaSiFy Leads helps you search, qualify, save, and manage prospects in one place,
          with billing support designed for South African SaaS rollout.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/signup"
            className="rounded-2xl bg-sky-400 px-5 py-3 font-medium text-slate-950 hover:bg-sky-300"
          >
            Get Started
          </Link>
          <Link
            to="/login"
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-medium text-white hover:bg-white/10"
          >
            Login
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {features.map((feature) => (
          <article key={feature} className="card p-6 text-slate-300">
            {feature}
          </article>
        ))}
      </section>
    </div>
  )
}
