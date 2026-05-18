import { useEffect, useState } from 'react'
import { Plus, X, Pencil, Trash2, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout'

const MARKETS = ['General', 'Kansas', 'Nashville', 'San Antonio']
const PHASE_ICONS = {
  'Travel Day': '✈️',
  'Training Day': '📋',
  'Soft Open': '🔓',
  'Grand Opening': '🔥',
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
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

function ScheduleForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || { phase_name: '', market: 'General', content: '' })
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
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#888' }}>Phase Name</label>
        <input value={form.phase_name} onChange={e => set('phase_name', e.target.value)}
          placeholder="e.g. Grand Opening" required
          className="px-3 py-2.5 rounded-lg text-sm outline-none"
          style={{ background: '#222', border: '1px solid #333', color: '#F5F5F5' }}
          onFocus={e => { e.target.style.borderColor = '#E8121A' }}
          onBlur={e => { e.target.style.borderColor = '#333' }} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#888' }}>Market</label>
        <select value={form.market} onChange={e => set('market', e.target.value)}
          className="px-3 py-2.5 rounded-lg text-sm outline-none"
          style={{ background: '#222', border: '1px solid #333', color: '#F5F5F5' }}>
          {MARKETS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#888' }}>
          Run of Show
        </label>
        <p className="text-xs" style={{ color: '#555' }}>Each line = one time block. Format: "6:00 AM — Wake up call"</p>
        <textarea value={form.content} onChange={e => set('content', e.target.value)}
          placeholder={"5:30 AM — Team wake up\n6:00 AM — Hotel checkout\n7:00 AM — Depart for location\n..."}
          rows={10} required
          className="px-3 py-2.5 rounded-lg text-sm outline-none font-mono resize-y"
          style={{ background: '#222', border: '1px solid #333', color: '#F5F5F5' }}
          onFocus={e => { e.target.style.borderColor = '#E8121A' }}
          onBlur={e => { e.target.style.borderColor = '#333' }} />
      </div>
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

function ScheduleCard({ schedule, isAdmin, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const icon = PHASE_ICONS[schedule.phase_name] || '📅'
  const lines = (schedule.content || '').split('\n').filter(Boolean)

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#1A1A1A', border: '1px solid #2E2E2E' }}>
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 cursor-pointer text-left"
        style={{ background: 'transparent', border: 'none' }}>
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <div>
            <p className="font-bold text-sm" style={{ color: '#F5F5F5' }}>{schedule.phase_name}</p>
            <p className="text-xs mt-0.5" style={{ color: '#555' }}>{schedule.market}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: '#555' }}>{lines.length} items</span>
          {expanded ? <ChevronUp size={15} style={{ color: '#555' }} /> : <ChevronDown size={15} style={{ color: '#555' }} />}
        </div>
      </button>

      {expanded && (
        <div style={{ borderTop: '1px solid #222' }}>
          <div className="px-5 py-4">
            <div className="flex flex-col gap-2">
              {lines.map((line, i) => {
                const [time, ...rest] = line.split('—').map(s => s.trim())
                const desc = rest.join('—').trim()
                return (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="flex items-center gap-1 text-xs font-bold shrink-0 pt-0.5"
                      style={{ color: '#E8121A', minWidth: '72px' }}>
                      <Clock size={10} />
                      {time}
                    </span>
                    <span className="text-sm" style={{ color: '#D0D0D0' }}>{desc || time}</span>
                  </div>
                )
              })}
            </div>
          </div>
          {isAdmin && (
            <div className="flex gap-2 px-5 pb-4">
              <button onClick={() => onEdit(schedule)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                style={{ background: '#222', border: '1px solid #333', color: '#F5F5F5' }}>
                <Pencil size={11} /> Edit
              </button>
              <button onClick={() => onDelete(schedule.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                style={{ background: 'rgba(232,18,26,0.1)', border: '1px solid rgba(232,18,26,0.3)', color: '#E8121A' }}>
                <Trash2 size={11} /> Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Daily() {
  const { isAdmin } = useAuth()
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [filterMarket, setFilterMarket] = useState('All')

  useEffect(() => { fetchSchedules() }, [])

  async function fetchSchedules() {
    const { data } = await supabase.from('daily_schedules').select('*').order('phase_name')
    setSchedules(data || [])
    setLoading(false)
  }

  async function handleSave(form) {
    if (editing) {
      await supabase.from('daily_schedules').update(form).eq('id', editing.id)
    } else {
      await supabase.from('daily_schedules').insert([form])
    }
    await fetchSchedules()
    setEditing(null)
  }

  async function handleDelete(id) {
    await supabase.from('daily_schedules').delete().eq('id', id)
    await fetchSchedules()
  }

  const filtered = filterMarket === 'All'
    ? schedules
    : schedules.filter(s => s.market === filterMarket)

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-xl font-black" style={{ color: '#F5F5F5' }}>Daily Run of Show</h1>
        {isAdmin && (
          <button onClick={() => { setEditing(null); setShowForm(true) }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold cursor-pointer"
            style={{ background: '#E8121A', border: 'none', color: '#fff' }}>
            <Plus size={14} /> New Template
          </button>
        )}
      </div>

      {/* Market filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {['All', ...MARKETS].map(m => (
          <button key={m} onClick={() => setFilterMarket(m)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            style={{
              background: filterMarket === m ? '#E8121A' : '#1A1A1A',
              border: filterMarket === m ? 'none' : '1px solid #2E2E2E',
              color: filterMarket === m ? '#fff' : '#888',
            }}>
            {m}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-7 h-7 rounded-full border-2 animate-spin"
            style={{ borderColor: '#E8121A', borderTopColor: 'transparent' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl p-8 text-center" style={{ background: '#1A1A1A', border: '1px solid #2E2E2E' }}>
          <p style={{ color: '#555' }} className="text-sm">No schedule templates yet.</p>
          {isAdmin && <p style={{ color: '#444' }} className="text-xs mt-1">Click "New Template" to add one.</p>}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(s => (
            <ScheduleCard key={s.id} schedule={s} isAdmin={isAdmin}
              onEdit={s => { setEditing(s); setShowForm(true) }}
              onDelete={handleDelete} />
          ))}
        </div>
      )}

      {(showForm || editing) && (
        <Modal title={editing ? 'Edit Template' : 'New Template'}
          onClose={() => { setShowForm(false); setEditing(null) }}>
          <ScheduleForm initial={editing}
            onSave={handleSave}
            onClose={() => { setShowForm(false); setEditing(null) }} />
        </Modal>
      )}
    </Layout>
  )
}
