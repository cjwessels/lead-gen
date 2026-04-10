import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../../modules/auth/AuthProvider'

export function SignupPage() {
  const { signUp, user, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  if (!loading && user) {
    return <Navigate to="/app/dashboard" replace />
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setMessage('')
    try {
      await signUp(email, password)
      setMessage('Account created. Check your email if confirmation is enabled.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Sign-up failed')
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="card w-full max-w-md p-8">
        <div className="text-xs uppercase tracking-[0.28em] text-sky-300">SaaSiFy</div>
        <h1 className="mt-2 text-3xl font-semibold text-white">Get Started</h1>
        <p className="mt-2 text-slate-300">Create your account to start using the app area.</p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <input
            className="input"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <input
            className="input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
          />
          <button className="w-full rounded-2xl bg-sky-400 px-5 py-3 font-medium text-slate-950 hover:bg-sky-300">
            Create account
          </button>
        </form>

        {message ? <div className="mt-4 text-sm text-slate-300">{message}</div> : null}

        <div className="mt-5 text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-sky-300">
            Login
          </Link>
        </div>
      </div>
    </div>
  )
}
