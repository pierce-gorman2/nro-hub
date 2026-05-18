import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { format, isWithinInterval, parseISO, differenceInDays, isPast } from 'date-fns'
import {
  Calendar, Clock, FileText, Bell, MapPin, Users,
  ChevronRight, Flame, TrendingUp, Zap, ArrowRight
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout'

const MARKET_COLORS = {
  Kansas:        { bg: 'rgba(59,130,246,0.12)',  text: '#60A5FA', border: 'rgba(59,130,246,0.25)', dot: '#3B82F6' },
  Nashville:     { bg: 'rgba(234,179,8,0.12)',   text: '#FACC15', border: 'rgba(234,179,8,0.25)',   dot: '#EAB308' },
  'San Antonio': { bg: 'rgba(34,197,94,0.12)',   text: '#4ADE80', border: 'rgba(34,197,94,0.25)',   dot: '#22C55E' },
}

const PHASE_META = {
  travel:        { label: 'Travel',        icon: '✈️', color: '#A78BFA' },
  training:      { label: 'Training',      icon: '📋', color: '#60A5FA' },
  soft_open:     { label: 'Soft Open',     icon: '🔓', color: '#FACC15' },
  grand_opening: { label: 'Grand Opening', icon: '🔥', color: '#E8121A' },
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function getNROStatus(assignments) {
  const now = new Date()
  const active = assignments.find(a => {
    try { return isWithinInterval(now, { start: parseISO(a.start_date), end: parseISO(a.end_date) }) }
    catch { return false }
  })
  const upcoming = assignments
    .filter(a => { try { return parseISO(a.start_date) > now } catch { return false } })
    .sort((a, b) => parseISO(a.start_date) - parseISO(b.start_date))

  return { active, next: upcoming[0], upcomingCount: upcoming.length }
}

/* ── Hero NRO Card ── */
function HeroNROCard({ assignments }) {
  const { active, next } = getNROStatus(assignments)
  const nro = active || next
  if (!nro) return (
    <div className="rounded-2xl p-6 flex items-center gap-4"
      style={{ background: '#1A1A1A', border: '1px solid #2E2E2E' }}>
      <Flame size={28} style={{ color: '#333' }} />
      <p style={{ color: '#555' }} className="text-sm">No NRO assignments scheduled yet.</p>
    </div>
  )

  const mc = MARKET_COLORS[nro.market] || MARKET_COLORS.Kansas
  const pm = PHASE_META[nro.phase] || { label: nro.phase, icon: '📅', color: '#888' }
  const daysUntil = active ? 0 : differenceInDays(parseISO(nro.start_date), new Date())
  const duration = differenceInDays(parseISO(nro.end_date), parseISO(nro.start_date)) + 1

  return (
    <div className="rounded-2xl overflow-hidden relative"
      style={{
        background: 'linear-gradient(135deg, #1A0A0A 0%, #1A1A1A 60%, #111 100%)',
        border: `1px solid ${mc.border}`,
      }}>
      {/* Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${mc.dot}18 0%, transparent 70%)`, transform: 'translate(30%, -30%)' }} />

      <div className="p-5 relative z-10">
        {/* Status row */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {active ? (
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(232,18,26,0.15)', color: '#E8121A', border: '1px solid rgba(232,18,26,0.3)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              Live Now
            </span>
          ) : (
            <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#888', border: '1px solid #2E2E2E' }}>
              In {daysUntil} day{daysUntil !== 1 ? 's' : ''}
            </span>
          )}
          <span className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: `${pm.color}18`, color: pm.color, border: `1px solid ${pm.color}30` }}>
            {pm.icon} {pm.label}
          </span>
        </div>

        {/* Market name */}
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: mc.text }}>
              {nro.team}
            </p>
            <h2 className="text-3xl font-black tracking-tight" style={{ color: '#F5F5F5' }}>
              {nro.market}
            </h2>
            {nro.location && (
              <p className="flex items-center gap-1.5 text-sm mt-1" style={{ color: '#666' }}>
                <MapPin size={12} /> {nro.location}
              </p>
            )}
          </div>

          {/* Date block */}
          <div className="text-right shrink-0">
            <p className="text-sm font-bold" style={{ color: '#F5F5F5' }}>
              {format(parseISO(nro.start_date), 'MMM d')} – {format(parseISO(nro.end_date), 'MMM d')}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#555' }}>
              {duration} day{duration !== 1 ? 's' : ''} · {format(parseISO(nro.start_date), 'yyyy')}
            </p>
          </div>
        </div>

        {/* Progress bar for active NROs */}
        {active && (() => {
          const total = differenceInDays(parseISO(nro.end_date), parseISO(nro.start_date))
          const elapsed = differenceInDays(new Date(), parseISO(nro.start_date))
          const pct = Math.min(100, Math.max(0, (elapsed / total) * 100))
          return (
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1.5" style={{ color: '#555' }}>
                <span>Progress</span>
                <span>{Math.round(pct)}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#222' }}>
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: `linear-gradient(90deg, #E8121A, ${mc.dot})` }} />
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}

/* ── Stat Cards ── */
function StatCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="rounded-xl p-4 flex flex-col gap-2"
      style={{ background: '#1A1A1A', border: '1px solid #2E2E2E' }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#555' }}>{label}</span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `${color}15` }}>
          <Icon size={14} style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-black" style={{ color: '#F5F5F5' }}>{value}</p>
      {sub && <p className="text-xs" style={{ color: '#555' }}>{sub}</p>}
    </div>
  )
}

/* ── Quick Nav ── */
const quickLinks = [
  { to: '/schedule', label: 'Schedule', icon: Calendar, desc: 'Calendar & assignments' },
  { to: '/daily',    label: 'Daily Run', icon: Clock,    desc: 'Run-of-show templates' },
  { to: '/updates',  label: 'Updates',   icon: Bell,     desc: 'Team announcements' },
  { to: '/docs',     label: 'Docs',      icon: FileText, desc: 'Packing lists & more' },
]

/* ── Update Feed ── */
function UpdateItem({ update, isFirst }) {
  return (
    <div className="flex gap-4 items-start">
      {/* Timeline dot */}
      <div className="flex flex-col items-center shrink-0 mt-1">
        <div className="w-2.5 h-2.5 rounded-full border-2"
          style={{ borderColor: isFirst ? '#E8121A' : '#333', background: isFirst ? '#E8121A' : 'transparent' }} />
        <div className="w-px flex-1 mt-1.5" style={{ background: '#1E1E1E', minHeight: '24px' }} />
      </div>
      <div className="pb-4 flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <p className="font-bold text-sm" style={{ color: isFirst ? '#F5F5F5' : '#CCC' }}>{update.title}</p>
          <span className="text-xs shrink-0" style={{ color: '#444' }}>
            {format(new Date(update.created_at), 'MMM d')}
          </span>
        </div>
        <p className="text-sm mt-1 leading-relaxed" style={{ color: '#666' }}>
          {update.body.length > 120 ? update.body.slice(0, 120) + '…' : update.body}
        </p>
      </div>
    </div>
  )
}

/* ── Market Status Row ── */
function MarketRow({ market, assignments }) {
  const now = new Date()
  const active = assignments.find(a => {
    try { return isWithinInterval(now, { start: parseISO(a.start_date), end: parseISO(a.end_date) }) }
    catch { return false }
  })
  const next = !active && assignments
    .filter(a => { try { return parseISO(a.start_date) > now } catch { return false } })
    .sort((a, b) => parseISO(a.start_date) - parseISO(b.start_date))[0]

  const mc = MARKET_COLORS[market]
  const status = active ? 'Active' : next ? `Next: ${format(parseISO(next.start_date), 'MMM d')}` : 'No upcoming'

  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid #1E1E1E' }}>
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full" style={{ background: active ? mc.dot : '#333' }} />
        <span className="text-sm font-semibold" style={{ color: '#D0D0D0' }}>{market}</span>
      </div>
      <span className="text-xs font-medium px-2 py-0.5 rounded"
        style={{
          background: active ? mc.bg : 'transparent',
          color: active ? mc.text : '#555',
        }}>
        {status}
      </span>
    </div>
  )
}

/* ── Main Dashboard ── */
export default function Dashboard() {
  const { profile, isAdmin } = useAuth()
  const [assignments, setAssignments] = useState([])
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: a }, { data: u }] = await Promise.all([
        supabase.from('nro_assignments').select('*').order('start_date'),
        supabase.from('updates').select('*').order('created_at', { ascending: false }).limit(4),
      ])
      setAssignments(a || [])
      setUpdates(u || [])
      setLoading(false)
    }
    load()
  }, [])

  const { active, upcomingCount } = getNROStatus(assignments)
  const markets = ['Kansas', 'Nashville', 'San Antonio']

  return (
    <Layout>
      {loading ? (
        <div className="flex justify-center items-center py-32">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: '#E8121A', borderTopColor: 'transparent' }} />
            <span className="text-xs" style={{ color: '#444' }}>Loading…</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">

          {/* Greeting */}
          <div className="flex items-start justify-between flex-wrap gap-2">
            <div>
              <p className="text-sm" style={{ color: '#555' }}>{getGreeting()}</p>
              <h1 className="text-2xl font-black tracking-tight mt-0.5 flex items-center gap-2" style={{ color: '#F5F5F5' }}>
                {profile?.name || 'Team'}
                <Flame size={20} style={{ color: '#E8121A' }} />
              </h1>
            </div>
            {isAdmin && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(232,18,26,0.1)', color: '#E8121A', border: '1px solid rgba(232,18,26,0.2)' }}>
                Admin
              </span>
            )}
          </div>

          {/* Hero NRO card */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Zap size={13} style={{ color: '#E8121A' }} />
              <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#E8121A' }}>
                What's Happening Now
              </h2>
            </div>
            <HeroNROCard assignments={assignments} />
          </section>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Active NRO" value={active ? '1' : '0'} sub={active ? active.market : 'None running'} icon={Flame} color="#E8121A" />
            <StatCard label="Upcoming" value={upcomingCount} sub="NROs scheduled" icon={TrendingUp} color="#60A5FA" />
          </div>

          {/* Market overview */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={13} style={{ color: '#E8121A' }} />
              <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#E8121A' }}>Markets</h2>
            </div>
            <div className="rounded-xl px-4" style={{ background: '#1A1A1A', border: '1px solid #2E2E2E' }}>
              {markets.map(m => (
                <MarketRow key={m} market={m}
                  assignments={assignments.filter(a => a.market === m)} />
              ))}
            </div>
          </section>

          {/* Quick links */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <ArrowRight size={13} style={{ color: '#E8121A' }} />
              <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#E8121A' }}>Quick Access</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {quickLinks.map(({ to, label, icon: Icon, desc }) => (
                <Link key={to} to={to}
                  className="rounded-xl p-4 flex flex-col gap-3 no-underline group transition-all"
                  style={{ background: '#1A1A1A', border: '1px solid #2E2E2E' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(232,18,26,0.35)'
                    e.currentTarget.style.background = '#1E1010'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '#2E2E2E'
                    e.currentTarget.style.background = '#1A1A1A'
                  }}>
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(232,18,26,0.1)' }}>
                      <Icon size={16} style={{ color: '#E8121A' }} />
                    </div>
                    <ChevronRight size={14} style={{ color: '#333' }} />
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: '#F5F5F5' }}>{label}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#555' }}>{desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Updates feed */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bell size={13} style={{ color: '#E8121A' }} />
                <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#E8121A' }}>
                  Recent Updates
                </h2>
              </div>
              <Link to="/updates"
                className="flex items-center gap-1 text-xs no-underline"
                style={{ color: '#555' }}
                onMouseEnter={e => e.currentTarget.style.color = '#E8121A'}
                onMouseLeave={e => e.currentTarget.style.color = '#555'}>
                All updates <ChevronRight size={11} />
              </Link>
            </div>

            {updates.length === 0 ? (
              <div className="rounded-xl p-6 text-center" style={{ background: '#1A1A1A', border: '1px solid #2E2E2E' }}>
                <Bell size={20} className="mx-auto mb-2" style={{ color: '#2E2E2E' }} />
                <p className="text-sm" style={{ color: '#444' }}>No updates yet.</p>
              </div>
            ) : (
              <div className="rounded-xl p-4" style={{ background: '#1A1A1A', border: '1px solid #2E2E2E' }}>
                {updates.map((u, i) => <UpdateItem key={u.id} update={u} isFirst={i === 0} />)}
              </div>
            )}
          </section>

        </div>
      )}
    </Layout>
  )
}
