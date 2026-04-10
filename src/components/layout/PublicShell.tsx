import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
          <div>
            <div className="text-xs uppercase tracking-[0.28em] text-sky-300">SaaSiFy</div>
            <div className="text-xl font-semibold text-white">Leads</div>
          </div>

          <nav className="flex items-center gap-2">
            <Link to="/" className="rounded-full px-4 py-2 text-sm text-slate-300 hover:bg-white/10">
              Home
            </Link>
            <Link to="/login" className="rounded-full px-4 py-2 text-sm text-slate-300 hover:bg-white/10">
              Login
            </Link>
            <Link to="/signup" className="rounded-full bg-sky-400 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-300">
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  )
}
