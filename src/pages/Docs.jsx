import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Plus, X, Trash2, ExternalLink, FileText, Link as LinkIcon } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout'

const MARKETS = ['General', 'Kansas', 'Nashville', 'San Antonio']

const MARKET_COLORS = {
  General: { bg: 'rgba(156,163,175,0.1)', text: '#9CA3AF', border: 'rgba(156,163,175,0.2)' },
  Kansas: { bg: 'rgba(59,130,246,0.1)', text: '#60A5FA', border: 'rgba(59,130,246,0.2)' },
  Nashville: { bg: 'rgba(234,179,8,0.1)', text: '#FACC15', border: 'rgba(234,179,8,0.2)' },
  'San Antonio': { bg: 'rgba(34,197,94,0.1)', text: '#4ADE80', border: 'rgba(34,197,94,0.2)' },
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

function DocForm({ onSave, onClose }) {
  const [form, setForm] = useState({ title: '', url: '', market: 'General' })
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
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#888' }}>Document Title</label>
        <input value={form.title} onChange={e => set('title', e.target.value)}
          placeholder="Packing List — Nashville" required
          className="px-3 py-2.5 rounded-lg text-sm outline-none"
          style={{ background: '#222', border: '1px solid #333', color: '#F5F5F5' }}
          onFocus={e => { e.target.style.borderColor = '#E8121A' }}
          onBlur={e => { e.target.style.borderColor = '#333' }} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#888' }}>URL / Link</label>
        <input value={form.url} onChange={e => set('url', e.target.value)}
          placeholder="https://drive.google.com/…" required type="url"
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
      <div className="flex gap-3 mt-1">
        <button type="button" onClick={onClose}
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold cursor-pointer"
          style={{ background: '#222', border: '1px solid #333', color: '#888' }}>
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="flex-1 py-2.5 rounded-lg text-sm font-bold cursor-pointer"
          style={{ background: '#E8121A', border: 'none', color: '#fff', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Adding…' : 'Add Document'}
        </button>
      </div>
    </form>
  )
}

function DocItem({ doc, isAdmin, onDelete }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3"
      style={{ borderBottom: '1px solid #222' }}>
      <div className="flex items-start gap-3 min-w-0">
        <div className="mt-0.5 p-2 rounded-lg shrink-0"
          style={{ background: '#222' }}>
          <FileText size={14} style={{ color: '#888' }} />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate" style={{ color: '#F5F5F5' }}>{doc.title}</p>
          <p className="text-xs mt-0.5 truncate" style={{ color: '#555' }}>
            {new URL(doc.url).hostname}
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#444' }}>
            Added {format(new Date(doc.created_at), 'MMM d, yyyy')}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <a href={doc.url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold no-underline"
          style={{ background: '#222', border: '1px solid #333', color: '#F5F5F5' }}>
          <ExternalLink size={11} />
          Open
        </a>
        {isAdmin && (
          <button onClick={() => onDelete(doc.id)}
            className="p-1.5 rounded-lg cursor-pointer"
            style={{ background: 'rgba(232,18,26,0.08)', border: '1px solid rgba(232,18,26,0.2)', color: '#E8121A' }}>
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </div>
  )
}

export default function Docs() {
  const { isAdmin } = useAuth()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [activeMarket, setActiveMarket] = useState('All')

  useEffect(() => { fetchDocs() }, [])

  async function fetchDocs() {
    const { data } = await supabase.from('documents').select('*').order('created_at', { ascending: false })
    setDocs(data || [])
    setLoading(false)
  }

  async function handleSave(form) {
    await supabase.from('documents').insert([form])
    await fetchDocs()
  }

  async function handleDelete(id) {
    if (!confirm('Remove this document?')) return
    await supabase.from('documents').delete().eq('id', id)
    await fetchDocs()
  }

  const grouped = MARKETS.reduce((acc, m) => {
    acc[m] = docs.filter(d => d.market === m)
    return acc
  }, {})

  const marketsToShow = activeMarket === 'All' ? MARKETS : [activeMarket]

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-xl font-black" style={{ color: '#F5F5F5' }}>Documents</h1>
        {isAdmin && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold cursor-pointer"
            style={{ background: '#E8121A', border: 'none', color: '#fff' }}>
            <Plus size={14} /> Add Document
          </button>
        )}
      </div>

      {/* Market tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['All', ...MARKETS].map(m => {
          const c = MARKET_COLORS[m] || { bg: 'rgba(232,18,26,0.1)', text: '#E8121A' }
          return (
            <button key={m} onClick={() => setActiveMarket(m)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              style={{
                background: activeMarket === m ? (m === 'All' ? '#E8121A' : c.bg) : '#1A1A1A',
                border: activeMarket === m ? 'none' : '1px solid #2E2E2E',
                color: activeMarket === m ? (m === 'All' ? '#fff' : c.text) : '#888',
              }}>
              {m}
              {m !== 'All' && (
                <span className="ml-1.5 opacity-60">
                  {grouped[m]?.length || 0}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-7 h-7 rounded-full border-2 animate-spin"
            style={{ borderColor: '#E8121A', borderTopColor: 'transparent' }} />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {marketsToShow.map(market => {
            const marketDocs = grouped[market] || []
            if (activeMarket === 'All' && marketDocs.length === 0) return null
            const c = MARKET_COLORS[market]

            return (
              <div key={market} className="rounded-xl overflow-hidden"
                style={{ background: '#1A1A1A', border: '1px solid #2E2E2E' }}>
                <div className="flex items-center gap-3 px-5 py-3"
                  style={{ borderBottom: '1px solid #222' }}>
                  <span className="text-xs font-bold uppercase tracking-widest px-2 py-1 rounded"
                    style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
                    {market}
                  </span>
                  <span className="text-xs" style={{ color: '#555' }}>{marketDocs.length} doc{marketDocs.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="px-5">
                  {marketDocs.length === 0 ? (
                    <div className="py-6 text-center">
                      <LinkIcon size={18} className="mx-auto mb-2" style={{ color: '#333' }} />
                      <p className="text-sm" style={{ color: '#444' }}>No documents yet.</p>
                    </div>
                  ) : (
                    marketDocs.map(doc => (
                      <DocItem key={doc.id} doc={doc} isAdmin={isAdmin} onDelete={handleDelete} />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <Modal title="Add Document" onClose={() => setShowForm(false)}>
          <DocForm onSave={handleSave} onClose={() => setShowForm(false)} />
        </Modal>
      )}
    </Layout>
  )
}
