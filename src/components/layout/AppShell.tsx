import { NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../../modules/auth/AuthProvider'
import { useEffect, useMemo, useState } from 'react'
import { fetchProfile } from '../../services/profile.service'
import type { Profile } from '../../types'

const links = [
  { to: '/app/dashboard', label: 'Dashboard' },
  { to: '/app/search', label: 'Lead Search' },
  { to: '/app/leads', label: 'Saved Leads' },
  { to: '/app/pipeline', label: 'Leads Pipeline' },
  { to: '/app/outreach', label: 'Outreach' },
  { to: '/app/tenders', label: 'Tenders' },
  { to: '/app/saved-tenders', label: 'Saved Tenders' },
  { to: '/app/tenders-pipeline', label: 'Tenders Pipeline' },
  { to: '/app/help', label: 'Help & Training' },
  { to: '/app/billing', label: 'Billing' },
]

function MenuButton({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
      aria-expanded={open}
      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 lg:hidden"
    >
      <span className="sr-only">Menu</span>
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

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    void fetchProfile().then(setProfile).catch(() => setProfile(null))
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [user?.email])

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : ''

    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  const accountBlock = useMemo(
    () => (
      <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center lg:justify-end">
        <div className="flex flex-wrap items-center gap-3">
          {profile ? <span className="badge uppercase">{profile.plan}</span> : null}
          <div className="min-w-0 break-all text-sm text-slate-400">{user?.email}</div>
        </div>
        <button
          onClick={() => void signOut()}
          className="rounded-full bg-white/10 px-4 py-3 text-sm text-white transition hover:bg-white/15"
        >
          Sign out
        </button>
      </div>
    ),
    [profile, signOut, user?.email],
  )

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-[0.28em] text-sky-300">SaaSiFy</div>
            <div className="truncate text-lg font-semibold text-white sm:text-xl">Leads</div>
          </div>

          <nav className="hidden flex-1 flex-wrap items-center justify-center gap-2 lg:flex">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm transition ${
                    isActive ? 'bg-sky-500 text-slate-950' : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden lg:flex lg:min-w-[260px] lg:justify-end">{accountBlock}</div>
          <MenuButton open={mobileMenuOpen} onClick={() => setMobileMenuOpen((value) => !value)} />
        </div>
      </header>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-30 bg-slate-950/90 backdrop-blur lg:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="absolute inset-x-4 top-[4.75rem] rounded-3xl border border-white/10 bg-slate-950/95 p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <nav className="flex max-h-[calc(100vh-8rem)] flex-col gap-2 overflow-y-auto">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `rounded-2xl px-4 py-3 text-sm transition ${
                      isActive ? 'bg-sky-500 text-slate-950' : 'bg-white/5 text-slate-200 hover:bg-white/10'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            <div className="mt-4 border-t border-white/10 pt-4">{accountBlock}</div>
          </div>
        </div>
      ) : null}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  )
}
