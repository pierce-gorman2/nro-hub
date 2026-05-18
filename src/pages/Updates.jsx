import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Plus, X, Pencil, Trash2, Bell } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout'

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl p-6"
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

function UpdateForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || { title: '', body: '' })
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
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#888' }}>Title</label>
        <input value={form.title} onChange={e => set('title', e.target.value)}
          placeholder="Update title…" required
          className="px-3 py-2.5 rounded-lg text-sm outline-none"
          style={{ background: '#222', border: '1px solid #333', color: '#F5F5F5' }}
          onFocus={e => { e.target.style.borderColor = '#E8121A' }}
          onBlur={e => { e.target.style.borderColor = '#333' }} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#888' }}>Body</label>
        <textarea value={form.body} onChange={e => set('body', e.target.value)}
          placeholder="Write your update…" rows={5} required
          className="px-3 py-2.5 rounded-lg text-sm outline-none resize-y"
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
          {saving ? 'Posting…' : 'Post Update'}
        </button>
      </div>
    </form>
  )
}

export default function Updates() {
  const { user, isAdmin } = useAuth()
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)

  useEffect(() => { fetchUpdates() }, [])

  async function fetchUpdates() {
    const { data } = await supabase.from('updates').select('*').order('created_at', { ascending: false })
    setUpdates(data || [])
    setLoading(false)
  }

  async function handleSave(form) {
    if (editing) {
      await supabase.from('updates').update(form).eq('id', editing.id)
    } else {
      await supabase.from('updates').insert([{ ...form, author_id: user.id }])
    }
    await fetchUpdates()
    setEditing(null)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this update?')) return
    await supabase.from('updates').delete().eq('id', id)
    await fetchUpdates()
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-xl font-black" style={{ color: '#F5F5F5' }}>Updates</h1>
        {isAdmin && (
          <button onClick={() => { setEditing(null); setShowForm(true) }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold cursor-pointer"
            style={{ background: '#E8121A', border: 'none', color: '#fff' }}>
            <Plus size={14} /> Post Update
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-7 h-7 rounded-full border-2 animate-spin"
            style={{ borderColor: '#E8121A', borderTopColor: 'transparent' }} />
        </div>
      ) : updates.length === 0 ? (
        <div className="rounded-xl p-10 text-center" style={{ background: '#1A1A1A', border: '1px solid #2E2E2E' }}>
          <Bell size={28} className="mx-auto mb-3" style={{ color: '#333' }} />
          <p style={{ color: '#555' }} className="text-sm">No updates posted yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {updates.map((u, i) => (
            <div key={u.id} className="rounded-xl p-5"
              style={{ background: '#1A1A1A', border: '1px solid #2E2E2E' }}>
              {/* New badge on the latest */}
              {i === 0 && (
                <span className="inline-block text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded mb-3"
                  style={{ background: 'rgba(232,18,26,0.1)', color: '#E8121A', border: '1px solid rgba(232,18,26,0.2)' }}>
                  Latest
                </span>
              )}
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <h3 className="font-bold text-base" style={{ color: '#F5F5F5' }}>{u.title}</h3>
                <span className="text-xs shrink-0" style={{ color: '#555' }}>
                  {format(new Date(u.created_at), 'MMM d, yyyy · h:mm a')}
                </span>
              </div>
              <p className="text-sm mt-3 leading-relaxed whitespace-pre-wrap" style={{ color: '#AAA' }}>{u.body}</p>
              {isAdmin && (
                <div className="flex gap-2 mt-4">
                  <button onClick={() => { setEditing(u); setShowForm(true) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                    style={{ background: '#222', border: '1px solid #333', color: '#888' }}>
                    <Pencil size={11} /> Edit
                  </button>
                  <button onClick={() => handleDelete(u.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                    style={{ background: 'rgba(232,18,26,0.08)', border: '1px solid rgba(232,18,26,0.2)', color: '#E8121A' }}>
                    <Trash2 size={11} /> Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {(showForm || editing) && (
        <Modal title={editing ? 'Edit Update' : 'New Update'}
          onClose={() => { setShowForm(false); setEditing(null) }}>
          <UpdateForm initial={editing}
            onSave={handleSave}
            onClose={() => { setShowForm(false); setEditing(null) }} />
        </Modal>
      )}
    </Layout>
  )
}
