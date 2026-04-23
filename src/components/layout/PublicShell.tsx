import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

function MenuButton({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
      aria-expanded={open}
      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 md:hidden"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        {open ? (
          <>
            <path d="M6 6l12 12" />
            <path d="M18 6L6 18" />
          </>
        ) : (
          <>
            <path d="M4 7h16" />
            <path d="M4 12h16" />
            <path d="M4 17h16" />
          </>
        )}
      </svg>
    </button>
  )
}

export function PublicShell({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : ''

    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <div className="text-xs uppercase tracking-[0.28em] text-sky-300">SaaSiFy</div>
            <div className="text-lg font-semibold text-white sm:text-xl">Leads</div>
          </div>

          <nav className="hidden items-center gap-2 md:flex">
            <Link to="/" className="rounded-full px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10">
              Home
            </Link>
            <Link to="/login" className="rounded-full px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10">
              Login
            </Link>
            <Link to="/signup" className="rounded-full bg-sky-400 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-sky-300">
              Get Started
            </Link>
          </nav>

          <MenuButton open={mobileMenuOpen} onClick={() => setMobileMenuOpen((value) => !value)} />
        </div>
      </header>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-30 bg-slate-950/90 backdrop-blur md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="absolute inset-x-4 top-[4.75rem] rounded-3xl border border-white/10 bg-slate-950/95 p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <nav className="flex flex-col gap-2">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10">
                Home
              </Link>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10">
                Login
              </Link>
              <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="rounded-2xl bg-sky-400 px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-sky-300">
                Get Started
              </Link>
            </nav>
          </div>
        </div>
      ) : null}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  )
}
