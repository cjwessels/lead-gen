import { mockLeads } from '../../data/mockLeads'

export function LeadsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-white">Saved leads</h1>
      <div className="grid gap-4">
        {mockLeads.map((lead) => (
          <article key={lead.id} className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-lg font-semibold text-white">{lead.name}</div>
                <div className="text-sm text-slate-400">
                  {lead.category} · {lead.city}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge">{lead.status}</span>
                <span className="badge">Score {lead.score}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
