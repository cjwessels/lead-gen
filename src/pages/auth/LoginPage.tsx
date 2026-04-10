import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../modules/auth/AuthProvider'

export function LoginPage() {
  const navigate = useNavigate()
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setMessage('')
    try {
      if (mode === 'login') {
        await signIn(email, password)
        navigate('/')
      } else {
        await signUp(email, password)
        setMessage('Account created. Check your email if confirmation is enabled.')
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Authentication failed')
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="card w-full max-w-md p-8">
        <div className="text-xs uppercase tracking-[0.28em] text-sky-300">SaaSiFy</div>
        <h1 className="mt-2 text-3xl font-semibold text-white">Leads</h1>
        <p className="mt-2 text-slate-300">Sign in to access your lead search, CRM pipeline, and billing.</p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <input className="input" type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
          <button className="w-full rounded-2xl bg-sky-400 px-5 py-3 font-medium text-slate-950 hover:bg-sky-300">
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        {message ? <div className="mt-4 text-sm text-slate-300">{message}</div> : null}

        <button className="mt-4 text-sm text-sky-300" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
          {mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}
