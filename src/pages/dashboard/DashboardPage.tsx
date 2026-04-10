const stats = [
  { label: 'Monthly searches used', value: '42 / 200' },
  { label: 'Qualified leads', value: '18' },
  { label: 'Pipeline value', value: 'R78,500' },
  { label: 'Win rate', value: '23%' },
]

export function DashboardPage() {
  return (
    <div className="space-y-8">
      <section className="card overflow-hidden p-8">
        <div className="badge mb-4">SaaS foundation</div>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white">
          Find South African business leads, qualify them, and move them through a sales pipeline.
        </h1>
        <p className="mt-4 max-w-3xl text-slate-300">
          This starter is structured for Supabase, Google Places via Edge Functions, a PayFast billing
          path, and public SaaS rollout under SaaSiFy.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article key={stat.label} className="card p-6">
            <div className="text-sm text-slate-400">{stat.label}</div>
            <div className="mt-3 text-3xl font-semibold text-white">{stat.value}</div>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <article className="card p-6">
          <h2 className="text-xl font-semibold text-white">Recommended next rollout steps</h2>
          <ol className="mt-4 space-y-3 text-slate-300">
            <li>1. Create the Supabase project and apply the SQL migration.</li>
            <li>2. Add the Edge Function secrets and deploy functions.</li>
            <li>3. Connect PayFast sandbox and validate the ITN flow.</li>
            <li>4. Add auth and row-level security for multi-tenant SaaS usage.</li>
          </ol>
        </article>

        <article className="card p-6">
          <h2 className="text-xl font-semibold text-white">Product positioning</h2>
          <p className="mt-4 text-slate-300">
            A niche fit for engineering firms, wholesalers, food suppliers, logistics businesses, panel
            beaters, and other SMEs that still rely on manual lead capture or quote handling.
          </p>
        </article>
      </section>
    </div>
  )
}
