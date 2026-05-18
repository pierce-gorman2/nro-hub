import { useEffect, useState } from 'react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, isSameMonth, isToday,
  parseISO, isWithinInterval, addMonths, subMonths
} from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, X, Trash2, Pencil } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout'

const TEAMS = ['Team A', 'Team B', 'Team C']
const MARKETS = ['Kansas', 'Nashville', 'San Antonio']
const PHASES = ['travel', 'training', 'soft_open', 'grand_opening']
const PHASE_LABELS = { travel: 'Travel', training: 'Training', soft_open: 'Soft Open', grand_opening: 'Grand Opening' }

const TEAM_COLORS = {
  'Team A': { bg: 'rgba(232,18,26,0.2)', text: '#FF5C61', border: 'rgba(232,18,26,0.4)' },
  'Team B': { bg: 'rgba(59,130,246,0.2)', text: '#60A5FA', border: 'rgba(59,130,246,0.4)' },
  'Team C': { bg: 'rgba(234,179,8,0.2)', text: '#FACC15', border: 'rgba(234,179,8,0.4)' },
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl p-6"
        style={{ background: '#1A1A1A', border: '1px solid #2E2E2E' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-lg" style={{ color: '#F5F5F5' }}>{title}</h3>
          <button onClick={onClose} className="cursor-pointer rounded-lg p-1"
            style={{ background: 'transparent', border: 'none', color: '#888' }}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function AssignmentForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || {
    team: 'Team A', market: 'Kansas', phase: 'travel',
    start_date: '', end_date: '', location: '',
  })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    await onSave(form)
    setSaving(false)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {[
        { label: 'Team', key: 'team', options: TEAMS },
        { label: 'Market', key: 'market', options: MARKETS },
        { label: 'Phase', key: 'phase', options: PHASES, labelMap: PHASE_LABELS },
      ].map(({ label, key, options, labelMap }) => (
        <div key={key} className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#888' }}>{label}</label>
          <select value={form[key]} onChange={e => set(key, e.target.value)}
            className="px-3 py-2.5 rounded-lg text-sm outline-none"
            style={{ background: '#222', border: '1px solid #333', color: '#F5F5F5' }}>
            {options.map(o => <option key={o} value={o}>{labelMap ? labelMap[o] : o}</option>)}
          </select>
        </div>
      ))}
      {[
        { label: 'Start Date', key: 'start_date', type: 'date' },
        { label: 'End Date', key: 'end_date', type: 'date' },
        { label: 'Location (optional)', key: 'location', type: 'text' },
      ].map(({ label, key, type }) => (
        <div key={key} className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#888' }}>{label}</label>
          <input type={type} value={form[key]} onChange={e => set(key, e.target.value)}
            required={key !== 'location'}
            className="px-3 py-2.5 rounded-lg text-sm outline-none"
            style={{ background: '#222', border: '1px solid #333', color: '#F5F5F5' }}
            onFocus={e => { e.target.style.borderColor = '#E8121A' }}
            onBlur={e => { e.target.style.borderColor = '#333' }} />
        </div>
      ))}
      <div className="flex gap-3 mt-1">
        <button type="button" onClick={onClose}
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold cursor-pointer"
          style={{ background: '#222', border: '1px solid #333', color: '#888' }}>
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="flex-1 py-2.5 rounded-lg text-sm font-bold cursor-pointer"
          style={{ background: '#E8121A', border: 'none', color: '#fff', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}

function DetailModal({ assignment, onClose, onEdit, onDelete, isAdmin }) {
  const colors = TEAM_COLORS[assignment.team] || TEAM_COLORS['Team A']
  return (
    <Modal title="Assignment Details" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wide px-2 py-1 rounded"
            style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}>
            {assignment.team}
          </span>
          <span className="text-xs font-bold uppercase tracking-wide px-2 py-1 rounded"
            style={{ background: 'rgba(232,18,26,0.1)', color: '#E8121A', border: '1px solid rgba(232,18,26,0.2)' }}>
            {PHASE_LABELS[assignment.phase] || assignment.phase}
          </span>
        </div>
        <div>
          <p className="text-lg font-bold" style={{ color: '#F5F5F5' }}>{assignment.market}</p>
          {assignment.location && <p className="text-sm mt-0.5" style={{ color: '#888' }}>{assignment.location}</p>}
        </div>
        <p className="text-sm" style={{ color: '#888' }}>
          {format(parseISO(assignment.start_date), 'MMM d, yyyy')} –{' '}
          {format(parseISO(assignment.end_date), 'MMM d, yyyy')}
        </p>
        {isAdmin && (
          <div className="flex gap-2 mt-2">
            <button onClick={onEdit}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold cursor-pointer"
              style={{ background: '#222', border: '1px solid #333', color: '#F5F5F5' }}>
              <Pencil size={13} /> Edit
            </button>
            <button onClick={onDelete}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold cursor-pointer"
              style={{ background: 'rgba(232,18,26,0.1)', border: '1px solid rgba(232,18,26,0.3)', color: '#E8121A' }}>
              <Trash2 size={13} /> Delete
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}

function getAssignmentsForDay(day, assignments) {
  return assignments.filter(a => {
    try {
      return isWithinInterval(day, { start: parseISO(a.start_date), end: parseISO(a.end_date) })
    } catch { return false }
  })
}

export default function Schedule() {
  const { isAdmin } = useAuth()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(null)

  useEffect(() => { fetchAssignments() }, [])

  async function fetchAssignments() {
    const { data } = await supabase.from('nro_assignments').select('*').order('start_date')
    setAssignments(data || [])
    setLoading(false)
  }

  async function handleSave(form) {
    if (editing) {
      await supabase.from('nro_assignments').update(form).eq('id', editing.id)
    } else {
      await supabase.from('nro_assignments').insert([form])
    }
    await fetchAssignments()
    setEditing(null)
  }

  async function handleDelete(id) {
    await supabase.from('nro_assignments').delete().eq('id', id)
    setSelected(null)
    await fetchAssignments()
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-xl font-black" style={{ color: '#F5F5F5' }}>Schedule</h1>
        <div className="flex items-center gap-2">
          {/* Team legend */}
          <div className="hidden sm:flex items-center gap-3 mr-2">
            {TEAMS.map(t => {
              const c = TEAM_COLORS[t]
              return (
                <span key={t} className="flex items-center gap-1.5 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full" style={{ background: c.text }} />
                  <span style={{ color: '#888' }}>{t}</span>
                </span>
              )
            })}
          </div>
          {isAdmin && (
            <button onClick={() => { setEditing(null); setShowAdd(true) }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold cursor-pointer"
              style={{ background: '#E8121A', border: 'none', color: '#fff' }}>
              <Plus size={14} /> Add
            </button>
          )}
        </div>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrentMonth(m => subMonths(m, 1))}
          className="p-2 rounded-lg cursor-pointer"
          style={{ background: '#1A1A1A', border: '1px solid #2E2E2E', color: '#888' }}>
          <ChevronLeft size={16} />
        </button>
        <h2 className="text-base font-bold" style={{ color: '#F5F5F5' }}>
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button onClick={() => setCurrentMonth(m => addMonths(m, 1))}
          className="p-2 rounded-lg cursor-pointer"
          style={{ background: '#1A1A1A', border: '1px solid #2E2E2E', color: '#888' }}>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #2E2E2E' }}>
        {/* Day headers */}
        <div className="grid grid-cols-7" style={{ background: '#1A1A1A', borderBottom: '1px solid #2E2E2E' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="py-2 text-center text-xs font-bold uppercase tracking-wider"
              style={{ color: '#555' }}>{d}</div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const inMonth = isSameMonth(day, currentMonth)
            const today = isToday(day)
            const dayAssignments = getAssignmentsForDay(day, assignments)

            return (
              <div key={i}
                className="min-h-16 p-1 sm:p-2 cursor-pointer transition-colors"
                style={{
                  background: today ? 'rgba(232,18,26,0.05)' : '#111',
                  borderRight: i % 7 !== 6 ? '1px solid #1E1E1E' : 'none',
                  borderBottom: i < days.length - 7 ? '1px solid #1E1E1E' : 'none',
                  opacity: inMonth ? 1 : 0.35,
                }}
                onClick={() => dayAssignments.length > 0 && setSelected(dayAssignments[0])}
              >
                <span className={`text-xs font-semibold inline-flex items-center justify-center w-6 h-6 rounded-full mb-1 ${today ? 'text-white' : ''}`}
                  style={{
                    color: today ? '#fff' : inMonth ? '#888' : '#444',
                    background: today ? '#E8121A' : 'transparent',
                  }}>
                  {format(day, 'd')}
                </span>
                <div className="flex flex-col gap-0.5">
                  {dayAssignments.slice(0, 2).map(a => {
                    const c = TEAM_COLORS[a.team] || TEAM_COLORS['Team A']
                    return (
                      <div key={a.id}
                        className="rounded text-xs px-1 py-0.5 truncate font-medium hidden sm:block"
                        style={{ background: c.bg, color: c.text }}>
                        {a.team} · {a.market}
                      </div>
                    )
                  })}
                  {dayAssignments.slice(0, 2).map(a => {
                    const c = TEAM_COLORS[a.team] || TEAM_COLORS['Team A']
                    return (
                      <div key={`dot-${a.id}`} className="w-1.5 h-1.5 rounded-full sm:hidden"
                        style={{ background: c.text }} />
                    )
                  })}
                  {dayAssignments.length > 2 && (
                    <span className="text-xs" style={{ color: '#555' }}>+{dayAssignments.length - 2}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modals */}
      {(showAdd || editing) && (
        <Modal title={editing ? 'Edit Assignment' : 'New Assignment'}
          onClose={() => { setShowAdd(false); setEditing(null) }}>
          <AssignmentForm
            initial={editing}
            onSave={handleSave}
            onClose={() => { setShowAdd(false); setEditing(null) }}
          />
        </Modal>
      )}

      {selected && !editing && (
        <DetailModal
          assignment={selected}
          onClose={() => setSelected(null)}
          onEdit={() => { setEditing(selected); setSelected(null) }}
          onDelete={() => handleDelete(selected.id)}
          isAdmin={isAdmin}
        />
      )}
    </Layout>
  )
}
