import { NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../../modules/auth/AuthProvider'
import { useEffect, useState } from 'react'
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

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    void fetchProfile().then(setProfile).catch(() => setProfile(null))
  }, [])

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <div className="text-xs uppercase tracking-[0.28em] text-sky-300">SaaSiFy</div>
            <div className="text-xl font-semibold text-white">Leads</div>
          </div>

          <nav className="flex flex-wrap gap-2">
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

          <div className="flex items-center gap-3">
            {profile ? <span className="badge uppercase">{profile.plan}</span> : null}
            <div className="text-sm text-slate-400">{user?.email}</div>
            <button
              onClick={() => void signOut()}
              className="rounded-full bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  )
}
