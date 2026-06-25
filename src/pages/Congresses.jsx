import { useState } from 'react'
import { format, parseISO, differenceInDays, isPast } from 'date-fns'
import { MapPin, Calendar, ExternalLink, Plus, Edit2, Trash2, Save, X, Tag } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/layout/Layout'
import Header from '../components/layout/Header'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'

const EMPTY = {
  name: '', location: '', country: '', startDate: '', endDate: '',
  abstractDeadline: '', websiteUrl: '', specialtyTags: '', notes: '',
}

function CongressForm({ initial, onClose, onSave }) {
  const [form, setForm] = useState(initial
    ? { ...initial, specialtyTags: (initial.specialtyTags || []).join(', ') }
    : EMPTY
  )
  const [error, setError] = useState('')
  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function submit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Congress name is required.'); return }
    onSave({
      ...form,
      specialtyTags: form.specialtyTags.split(',').map(t => t.trim()).filter(Boolean),
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <div>
        <label className="label">Congress Name *</label>
        <input className="input-base" value={form.name} onChange={e => set('name', e.target.value)} autoFocus
          placeholder="e.g. World Congress of Neurosurgery" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">City / Location</label>
          <input className="input-base" value={form.location} onChange={e => set('location', e.target.value)}
            placeholder="e.g. Barcelona" />
        </div>
        <div>
          <label className="label">Country</label>
          <input className="input-base" value={form.country} onChange={e => set('country', e.target.value)}
            placeholder="e.g. Spain" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Start Date</label>
          <input type="date" className="input-base" value={form.startDate || ''}
            onChange={e => set('startDate', e.target.value)} />
        </div>
        <div>
          <label className="label">End Date</label>
          <input type="date" className="input-base" value={form.endDate || ''}
            onChange={e => set('endDate', e.target.value)} />
        </div>
      </div>

      <div>
        <label className="label">Abstract Submission Deadline</label>
        <input type="date" className="input-base" value={form.abstractDeadline || ''}
          onChange={e => set('abstractDeadline', e.target.value)} />
      </div>

      <div>
        <label className="label">Website URL</label>
        <input className="input-base" value={form.websiteUrl} onChange={e => set('websiteUrl', e.target.value)}
          placeholder="https://..." />
      </div>

      <div>
        <label className="label">Specialty Tags <span className="text-slate-400 font-normal">(comma-separated)</span></label>
        <input className="input-base" value={form.specialtyTags} onChange={e => set('specialtyTags', e.target.value)}
          placeholder="e.g. neurosurgery, endovascular, stroke" />
      </div>

      <div>
        <label className="label">Notes</label>
        <textarea className="input-base resize-none" rows={2} value={form.notes}
          onChange={e => set('notes', e.target.value)} placeholder="Registration open, virtual option, etc." />
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" icon={Save}>{initial ? 'Save Changes' : 'Add Congress'}</Button>
      </div>
    </form>
  )
}

function statusBadge(c) {
  if (!c.startDate) return { label: 'Date TBD', cls: 'bg-slate-100 text-slate-500' }
  const now = new Date()
  const start = new Date(c.startDate)
  const end   = c.endDate ? new Date(c.endDate) : start
  if (isPast(end))    return { label: 'Past',     cls: 'bg-slate-100 text-slate-400' }
  if (isPast(start))  return { label: 'Ongoing',  cls: 'bg-emerald-100 text-emerald-700' }
  const days = differenceInDays(start, now)
  if (days <= 30)     return { label: `In ${days}d`, cls: 'bg-red-100 text-red-700' }
  if (days <= 90)     return { label: `In ${days}d`, cls: 'bg-amber-100 text-amber-700' }
  return { label: `In ${days}d`, cls: 'bg-indigo-100 text-indigo-700' }
}

function deadlineBadge(deadline) {
  if (!deadline) return null
  const days = differenceInDays(new Date(deadline), new Date())
  if (isPast(new Date(deadline))) return { label: 'Deadline passed', cls: 'text-slate-400' }
  if (days <= 14) return { label: `Abstract due in ${days}d`, cls: 'text-red-600 font-semibold' }
  if (days <= 45) return { label: `Abstract due in ${days}d`, cls: 'text-amber-600 font-medium' }
  return { label: `Abstract due ${format(parseISO(deadline), 'MMM d, yyyy')}`, cls: 'text-slate-500' }
}

export default function Congresses() {
  const { congresses = [], dispatch } = useData()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [showForm,    setShowForm]    = useState(false)
  const [editItem,    setEditItem]    = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [tagFilter,   setTagFilter]   = useState('all')

  const allTags = [...new Set(congresses.flatMap(c => c.specialtyTags || []))].sort()

  const visible = congresses
    .filter(c => tagFilter === 'all' || (c.specialtyTags || []).includes(tagFilter))
    .sort((a, b) => {
      if (!a.startDate && !b.startDate) return 0
      if (!a.startDate) return 1
      if (!b.startDate) return -1
      return new Date(a.startDate) - new Date(b.startDate)
    })

  const now = new Date()
  const upcoming = visible.filter(c => !c.startDate || !isPast(c.endDate ? new Date(c.endDate) : new Date(c.startDate)))
  const past     = visible.filter(c => c.startDate  &&  isPast(c.endDate ? new Date(c.endDate) : new Date(c.startDate)))

  function handleSave(form) {
    if (editItem) {
      dispatch({ type: 'UPDATE_CONGRESS', payload: { ...form, id: editItem.id } })
    } else {
      dispatch({ type: 'ADD_CONGRESS', payload: form })
    }
    setShowForm(false)
    setEditItem(null)
  }

  function CongressCard({ c }) {
    const sb  = statusBadge(c)
    const db  = c.abstractDeadline ? deadlineBadge(c.abstractDeadline) : null
    const isPastEvent = c.startDate && isPast(c.endDate ? new Date(c.endDate) : new Date(c.startDate))

    return (
      <div className={`card p-5 ${isPastEvent ? 'opacity-60' : ''}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">

            {/* Name + status */}
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sb.cls}`}>{sb.label}</span>
              <h3 className="text-sm font-semibold text-slate-800 leading-snug">{c.name}</h3>
            </div>

            {/* Location */}
            {(c.location || c.country) && (
              <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                <MapPin size={11} />
                <span>{[c.location, c.country].filter(Boolean).join(', ')}</span>
              </div>
            )}

            {/* Dates */}
            {c.startDate && (
              <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                <Calendar size={11} />
                <span>
                  {format(parseISO(c.startDate), 'MMM d, yyyy')}
                  {c.endDate && c.endDate !== c.startDate && ` – ${format(parseISO(c.endDate), 'MMM d, yyyy')}`}
                </span>
              </div>
            )}

            {/* Abstract deadline */}
            {db && (
              <p className={`text-xs mt-1.5 ${db.cls}`}>{db.label}</p>
            )}

            {/* Tags */}
            {c.specialtyTags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {c.specialtyTags.map(t => (
                  <span key={t} className="px-2 py-0.5 bg-brand-50 text-brand-600 text-xs rounded-full">{t}</span>
                ))}
              </div>
            )}

            {/* Notes */}
            {c.notes && (
              <p className="text-xs text-slate-400 italic mt-2">"{c.notes}"</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            {c.websiteUrl && (
              <a href={c.websiteUrl} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-brand-500 hover:text-brand-700 font-medium transition-colors">
                <ExternalLink size={12} /> Website
              </a>
            )}
            {isAdmin && (
              <div className="flex gap-1">
                <button onClick={() => { setEditItem(c); setShowForm(true) }}
                  className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-slate-100 transition-colors" title="Edit">
                  <Edit2 size={13} />
                </button>
                <button onClick={() => setDeleteConfirm(c)}
                  className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 transition-colors" title="Delete">
                  <Trash2 size={13} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Layout>
      <Header
        title="Congresses"
        subtitle={`${upcoming.length} upcoming event${upcoming.length !== 1 ? 's' : ''} this year`}
        actions={isAdmin && (
          <Button icon={Plus} size="sm" onClick={() => { setEditItem(null); setShowForm(true) }}>
            Add Congress
          </Button>
        )}
      />

      <div className="p-4 md:p-6 max-w-3xl space-y-5">

        {/* Tag filter */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1 bg-white border border-slate-200 rounded-lg p-1">
            {[['all', 'All'], ...allTags.map(t => [t, t])].map(([val, label]) => (
              <button key={val} onClick={() => setTagFilter(val)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap
                  ${tagFilter === val ? 'bg-brand-500 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Empty state */}
        {congresses.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Calendar size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No congresses added yet</p>
            {isAdmin && <p className="text-sm mt-1">Click "Add Congress" to add the first event.</p>}
          </div>
        ) : (
          <>
            {/* Upcoming */}
            {upcoming.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">Upcoming</h2>
                {upcoming.map(c => <CongressCard key={c.id} c={c} />)}
              </div>
            )}

            {/* Past */}
            {past.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">Past</h2>
                {past.map(c => <CongressCard key={c.id} c={c} />)}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add / Edit modal */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditItem(null) }}
        title={editItem ? 'Edit Congress' : 'Add Congress'}
        size="md"
      >
        <CongressForm
          initial={editItem}
          onClose={() => { setShowForm(false); setEditItem(null) }}
          onSave={handleSave}
        />
      </Modal>

      {/* Delete confirmation */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Congress" size="sm">
        <p className="text-sm text-slate-600 mb-6">
          Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>? This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button variant="danger" icon={Trash2} onClick={() => {
            dispatch({ type: 'DELETE_CONGRESS', payload: { id: deleteConfirm.id } })
            setDeleteConfirm(null)
          }}>Delete</Button>
        </div>
      </Modal>
    </Layout>
  )
}
