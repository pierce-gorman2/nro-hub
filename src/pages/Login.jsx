import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flame, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await signIn(email, password)
    if (err) {
      setError(err.message)
      setLoading(false)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #0D0D0D 0%, #1A0A0A 100%)' }}>

      {/* Subtle flame glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-5 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #E8121A 0%, transparent 70%)' }} />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'rgba(232,18,26,0.12)', border: '1px solid rgba(232,18,26,0.3)' }}>
            <Flame size={32} style={{ color: '#E8121A' }} />
          </div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: '#F5F5F5' }}>
            NRO Hub
          </h1>
          <p className="text-sm mt-1" style={{ color: '#888' }}>
            Dave's Hot Chicken Operations
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6"
          style={{ background: '#1A1A1A', border: '1px solid #2E2E2E' }}>
          <h2 className="text-lg font-bold mb-5" style={{ color: '#F5F5F5' }}>
            Sign in
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#888' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                style={{
                  background: '#222',
                  border: '1px solid #333',
                  color: '#F5F5F5',
                }}
                onFocus={e => { e.target.style.borderColor = '#E8121A' }}
                onBlur={e => { e.target.style.borderColor = '#333' }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#888' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                style={{
                  background: '#222',
                  border: '1px solid #333',
                  color: '#F5F5F5',
                }}
                onFocus={e => { e.target.style.borderColor = '#E8121A' }}
                onBlur={e => { e.target.style.borderColor = '#333' }}
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg text-sm"
                style={{ background: 'rgba(232,18,26,0.1)', border: '1px solid rgba(232,18,26,0.3)', color: '#FF5C61' }}>
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-sm font-bold tracking-wide transition-all cursor-pointer mt-1"
              style={{
                background: loading ? '#555' : '#E8121A',
                color: '#fff',
                border: 'none',
                opacity: loading ? 0.7 : 1,
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#FF2B32' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#E8121A' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: '#555' }}>
          Contact your admin if you need access.
        </p>
      </div>
    </div>
  )
}
