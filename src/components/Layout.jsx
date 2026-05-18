import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard, Calendar, Clock, Bell, FileText,
  LogOut, Menu, X, Flame
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/schedule', label: 'Schedule', icon: Calendar },
  { to: '/daily', label: 'Daily Run', icon: Clock },
  { to: '/updates', label: 'Updates', icon: Bell },
  { to: '/docs', label: 'Docs', icon: FileText },
]

export default function Layout({ children }) {
  const { profile, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#111' }}>
      {/* Top nav */}
      <header style={{ background: '#1A1A1A', borderBottom: '1px solid #2E2E2E' }}
        className="sticky top-0 z-50 px-4 py-3 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2 no-underline">
          <Flame size={22} style={{ color: '#E8121A' }} />
          <span className="font-bold text-lg tracking-tight" style={{ color: '#F5F5F5' }}>
            NRO Hub
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to
            return (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors no-underline"
                style={{
                  color: active ? '#E8121A' : '#888',
                  background: active ? 'rgba(232,18,26,0.08)' : 'transparent',
                }}
              >
                <Icon size={15} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden md:block text-sm" style={{ color: '#888' }}>
            {profile?.name}
          </span>
          <button
            onClick={handleSignOut}
            className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
            style={{ color: '#888', background: 'transparent', border: 'none' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#E8121A' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#888' }}
          >
            <LogOut size={15} />
            Sign out
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="md:hidden p-2 rounded-md cursor-pointer"
            style={{ background: 'transparent', border: 'none', color: '#888' }}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-40 pt-16"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setMenuOpen(false)}>
          <div
            className="absolute top-16 left-0 right-0 p-4 flex flex-col gap-1"
            style={{ background: '#1A1A1A', borderBottom: '1px solid #2E2E2E' }}
            onClick={e => e.stopPropagation()}
          >
            {navItems.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium no-underline"
                  style={{
                    color: active ? '#E8121A' : '#F5F5F5',
                    background: active ? 'rgba(232,18,26,0.08)' : 'transparent',
                  }}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              )
            })}
            <div style={{ borderTop: '1px solid #2E2E2E' }} className="pt-3 mt-2 flex items-center justify-between px-4">
              <span className="text-sm" style={{ color: '#888' }}>{profile?.name}</span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-sm cursor-pointer"
                style={{ color: '#888', background: 'transparent', border: 'none' }}
              >
                <LogOut size={15} />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page content */}
      <main className="flex-1 px-4 py-6 max-w-6xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
