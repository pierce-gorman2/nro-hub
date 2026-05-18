import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { format, isWithinInterval, parseISO } from 'date-fns'
import { Calendar, Clock, FileText, Bell, MapPin, Users, ChevronRight, Flame } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout'

const MARKET_COLORS = {
  Kansas: { bg: 'rgba(59,130,246,0.15)', text: '#60A5FA', border: 'rgba(59,130,246,0.3)' },
  Nashville: { bg: 'rgba(234,179,8,0.15)', text: '#FACC15', border: 'rgba(234,179,8,0.3)' },
  'San Antonio': { bg: 'rgba(34,197,94,0.15)', text: '#4ADE80', border: 'rgba(34,197,94,0.3)' },
}

const PHASE_LABELS = {
  travel: 'Travel',
  training: 'Training',
  soft_open: 'Soft Open',
  grand_opening: 'Grand Opening',
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function ActiveNROCard({ assignments }) {
  const now = new Date()
  const active = assignments.find(a => {
    try {
      return isWithinInterval(now, { start: parseISO(a.start_date), end: parseISO(a.end_date) })
    } catch { return false }
  })
  const next = !active && assignments
    .filter(a => parseISO(a.start_date) > now)
    .sort((a, b) => parseISO(a.start_date) - parseISO(b.start_date))[0]
  const nro = active || next

  if (!nro) return (
    <div className="rounded-xl p-5" style={{ background: '#1A1A1A', border: '1px solid #2E2E2E' }}>
      <p style={{ color: '#888' }} className="text-sm">No upcoming NRO assignments.</p>
    </div>
  )

  const colors = MARKET_COLORS[nro.market] || MARKET_COLORS.Kansas
  return (
    <div className="rounded-xl p-5" style={{ background: '#1A1A1A', border: `1px solid ${colors.border}` }}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded"
              style={{ background: colors.bg, color: colors.text }}>
              {active ? '🔥 Live now' : 'Up next'}
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded"
              style={{ background: 'rgba(232,18,26,0.1)', color: '#E8121A', border: '1px solid rgba(232,18,26,0.2)' }}>
              {PHASE_LABELS[nro.phase] || nro.phase}
            </span>
          </div>
          <h3 className="text-xl font-bold mt-2" style={{ color: '#F5F5F5' }}>
            {nro.market}
          </h3>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <span className="flex items-center gap-1.5 text-sm" style={{ color: '#888' }}>
              <Users size={13} />
              {nro.team}
            </span>
            <span className="flex items-center gap-1.5 text-sm" style={{ color: '#888' }}>
              <MapPin size={13} />
              {nro.location || nro.market}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold" style={{ color: '#F5F5F5' }}>
            {format(parseISO(nro.start_date), 'MMM d')} – {format(parseISO(nro.end_date), 'MMM d')}
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#888' }}>
            {format(parseISO(nro.start_date), 'yyyy')}
          </p>
        </div>
      </div>
    </div>
  )
}

function UpdateCard({ update }) {
  return (
    <div className="rounded-xl p-4" style={{ background: '#1A1A1A', border: '1px solid #2E2E2E' }}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <h4 className="font-bold text-sm" style={{ color: '#F5F5F5' }}>{update.title}</h4>
        <span className="text-xs shrink-0" style={{ color: '#555' }}>
          {format(new Date(update.created_at), 'MMM d')}
        </span>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: '#888' }}>
        {update.body.length > 160 ? update.body.slice(0, 160) + '…' : update.body}
      </p>
    </div>
  )
}

const quickLinks = [
  { to: '/schedule', label: 'Schedule', icon: Calendar, desc: 'Team assignments & markets' },
  { to: '/daily', label: 'Daily Run', icon: Clock, desc: 'Phase run-of-show templates' },
  { to: '/updates', label: 'Updates', icon: Bell, desc: 'Announcements & posts' },
  { to: '/docs', label: 'Docs', icon: FileText, desc: 'Packing lists, hotel info & more' },
]

export default function Dashboard() {
  const { profile } = useAuth()
  const [assignments, setAssignments] = useState([])
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: a }, { data: u }] = await Promise.all([
        supabase.from('nro_assignments').select('*').order('start_date'),
        supabase.from('updates').select('*').order('created_at', { ascending: false }).limit(5),
      ])
      setAssignments(a || [])
      setUpdates(u || [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <Layout>
      {/* Greeting */}
      <div className="mb-6">
        <p className="text-sm" style={{ color: '#888' }}>{getGreeting()},</p>
        <h1 className="text-2xl font-black tracking-tight mt-0.5" style={{ color: '#F5F5F5' }}>
          {profile?.name || 'Team'}
          <Flame size={22} className="inline ml-2 mb-1" style={{ color: '#E8121A' }} />
        </h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-7 h-7 rounded-full border-2 animate-spin"
            style={{ borderColor: '#E8121A', borderTopColor: 'transparent' }} />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Active NRO */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#E8121A' }}>
              What's Happening Now
            </h2>
            <ActiveNROCard assignments={assignments} />
          </section>

          {/* Quick links */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#E8121A' }}>
              Quick Links
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {quickLinks.map(({ to, label, icon: Icon, desc }) => (
                <Link key={to} to={to}
                  className="rounded-xl p-4 flex flex-col gap-2 no-underline transition-all group"
                  style={{ background: '#1A1A1A', border: '1px solid #2E2E2E' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(232,18,26,0.4)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#2E2E2E' }}
                >
                  <div className="flex items-center justify-between">
                    <Icon size={18} style={{ color: '#E8121A' }} />
                    <ChevronRight size={14} style={{ color: '#555' }} />
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: '#F5F5F5' }}>{label}</p>
                    <p className="text-xs mt-0.5 leading-snug" style={{ color: '#666' }}>{desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Recent updates */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#E8121A' }}>
                Recent Updates
              </h2>
              <Link to="/updates" className="text-xs no-underline flex items-center gap-1"
                style={{ color: '#888' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#E8121A' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#888' }}>
                See all <ChevronRight size={12} />
              </Link>
            </div>
            {updates.length === 0 ? (
              <p className="text-sm" style={{ color: '#555' }}>No updates yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {updates.map(u => <UpdateCard key={u.id} update={u} />)}
              </div>
            )}
          </section>
        </div>
      )}
    </Layout>
  )
}
