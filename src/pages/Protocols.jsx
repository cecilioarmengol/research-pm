import { useState } from 'react'
import { Plus, Edit2, Trash2, AlertTriangle, CheckCircle, Clock, FileText, Save, X } from 'lucide-react'
import { differenceInDays, parseISO, format } from 'date-fns'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/layout/Layout'
import Header from '../components/layout/Header'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'

const EMPTY = {
  title: '', protocolNumber: '', projectId: '', piId: '',
  ethicsCommittee: '', submissionDate: '', expirationDate: '',
  approvalNumber: '', notes: '',
}

function expirationInfo(dateStr) {
  if (!dateStr) return null
  const days = differenceInDays(parseISO(dateStr), new Date())
  if (days < 0)  return { label: 'Expired',             color: 'text-red-600',    bg: 'bg-red-50 border-red-200',    icon: 'red'    }
  if (days <= 30) return { label: `Expires in ${days}d`, color: 'text-red-500',    bg: 'bg-red-50 border-red-200',    icon: 'red'    }
  if (days <= 60) return { label: `Expires in ${days}d`, color: 'text-amber-500',  bg: 'bg-amber-50 border-amber-200',icon: 'amber'  }
  return           { label: `Valid — ${days}d left`,     color: 'text-emerald-600',bg: 'bg-emerald-50 border-emerald-200', icon: 'green' }
}

function ProtocolForm({ initial, onClose, onSave, saving, projects, users }) {
  const [form, setForm] = useState(initial || EMPTY)
  const [error, setError] = useState('')
  const pis = users.filter(u => ['pi', 'admin', 'research_fellow'].includes(u.role))

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function submit(e) {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required.'); return }
    onSave(form)
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label">Protocol Title *</label>
          <input className="input-base" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Full protocol title" autoFocus />
        </div>

        <div>
          <label className="label">Protocol Number</label>
          <input className="input-base" value={form.protocolNumber} onChange={e => set('protocolNumber', e.target.value)} placeholder="e.g. CEI-2024-001" />
        </div>

        <div>
          <label className="label">Approval Number</label>
          <input className="input-base" value={form.approvalNumber} onChange={e => set('approvalNumber', e.target.value)} placeholder="Assigned upon approval" />
        </div>

        <div>
          <label className="label">Principal Investigator</label>
          <select className="input-base" value={form.piId} onChange={e => set('piId', e.target.value)}>
            <option value="">Select PI…</option>
            {pis.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Linked Project</label>
          <select className="input-base" value={form.projectId} onChange={e => set('projectId', e.target.value)}>
            <option value="">None</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="label">Ethics Committee</label>
          <input className="input-base" value={form.ethicsCommittee} onChange={e => set('ethicsCommittee', e.target.value)} placeholder="e.g. Hospital IRB, National Ethics Committee" />
        </div>

        <div>
          <label className="label">Submission Date</label>
          <input type="date" className="input-base" value={form.submissionDate} onChange={e => set('submissionDate', e.target.value)} />
        </div>

        <div>
          <label className="label">Expiration Date</label>
          <input type="date" className="input-base" value={form.expirationDate} onChange={e => set('expirationDate', e.target.value)} />
        </div>

        <div className="sm:col-span-2">
          <label className="label">Notes</label>
          <textarea className="input-base resize-none" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Conditions, observations, amendments…" />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
        <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button type="submit" icon={Save} disabled={saving}>{saving ? 'Saving…' : 'Save Protocol'}</Button>
      </div>
    </form>
  )
}

export default function Protocols() {
  const { protocols, projects, users, dispatch } = useData()
  const { user } = useAuth()
  const [showForm, setShowForm]       = useState(false)
  const [editProto, setEditProto]     = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [saving, setSaving]           = useState(false)
  const [filter, setFilter]           = useState('all') // all | expiring | expired

  const canManage = ['admin', 'pi', 'research_fellow'].includes(user?.role)

  const filtered = protocols
    .filter(p => {
      if (filter === 'expired')  return p.expirationDate && differenceInDays(parseISO(p.expirationDate), new Date()) < 0
      if (filter === 'expiring') return p.expirationDate && differenceInDays(parseISO(p.expirationDate), new Date()) >= 0 && differenceInDays(parseISO(p.expirationDate), new Date()) <= 60
      return true
    })
    .sort((a, b) => {
      if (!a.expirationDate) return 1
      if (!b.expirationDate) return -1
      return differenceInDays(parseISO(a.expirationDate), new Date()) - differenceInDays(parseISO(b.expirationDate), new Date())
    })

  async function handleSave(form) {
    setSaving(true)
    if (editProto) {
      dispatch({ type: 'UPDATE_PROTOCOL', payload: { ...form, id: editProto.id } })
    } else {
      dispatch({ type: 'ADD_PROTOCOL', payload: { ...form, createdBy: user.id } })
    }
    setSaving(false)
    setShowForm(false)
    setEditProto(null)
  }

  function handleDelete(proto) {
    dispatch({ type: 'DELETE_PROTOCOL', payload: { id: proto.id } })
    setDeleteConfirm(null)
  }

  const expiredCount  = protocols.filter(p => p.expirationDate && differenceInDays(parseISO(p.expirationDate), new Date()) < 0).length
  const expiringCount = protocols.filter(p => p.expirationDate && differenceInDays(parseISO(p.expirationDate), new Date()) >= 0 && differenceInDays(parseISO(p.expirationDate), new Date()) <= 60).length

  return (
    <Layout>
      <Header
        title="Protocols"
        subtitle={`${protocols.length} protocol${protocols.length !== 1 ? 's' : ''}`}
        actions={
          canManage && (
            <Button icon={Plus} size="sm" onClick={() => { setEditProto(null); setShowForm(true) }}>
              New Protocol
            </Button>
          )
        }
      />

      <div className="p-4 md:p-6 max-w-4xl space-y-6">

        {/* Alert banners */}
        {expiredCount > 0 && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertTriangle size={16} className="text-red-500 shrink-0" />
            <p className="text-sm text-red-700 font-medium">{expiredCount} protocol{expiredCount > 1 ? 's have' : ' has'} expired and need{expiredCount === 1 ? 's' : ''} renewal.</p>
          </div>
        )}
        {expiringCount > 0 && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <Clock size={16} className="text-amber-500 shrink-0" />
            <p className="text-sm text-amber-700 font-medium">{expiringCount} protocol{expiringCount > 1 ? 's are' : ' is'} expiring within 60 days.</p>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1 self-start w-fit">
          {[['all', 'All'], ['expiring', 'Expiring Soon'], ['expired', 'Expired']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                filter === val ? 'bg-brand-500 text-white' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {label}
              {val === 'expiring' && expiringCount > 0 && <span className="ml-1 bg-amber-400 text-white text-xs rounded-full px-1">{expiringCount}</span>}
              {val === 'expired'  && expiredCount  > 0 && <span className="ml-1 bg-red-400 text-white text-xs rounded-full px-1">{expiredCount}</span>}
            </button>
          ))}
        </div>

        {/* Protocol cards */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <FileText size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No protocols yet</p>
            {canManage && <p className="text-sm mt-1">Click "New Protocol" to add one.</p>}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(proto => {
              const expInfo    = expirationInfo(proto.expirationDate)
              const pi         = users.find(u => u.id === proto.piId)
              const linkedProj = projects.find(p => p.id === proto.projectId)
              const canEdit    = canManage

              return (
                <div key={proto.id} className={`card p-5 border ${expInfo?.bg ?? 'border-slate-100'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Title row */}
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-slate-800">{proto.title}</h3>
                        {proto.protocolNumber && (
                          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-mono">{proto.protocolNumber}</span>
                        )}
                      </div>

                      {/* Meta grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mt-3 text-xs text-slate-500">
                        {pi && <p><span className="text-slate-400">PI:</span> {pi.name}</p>}
                        {proto.ethicsCommittee && <p><span className="text-slate-400">Committee:</span> {proto.ethicsCommittee}</p>}
                        {proto.approvalNumber  && <p><span className="text-slate-400">Approval #:</span> {proto.approvalNumber}</p>}
                        {linkedProj            && <p><span className="text-slate-400">Project:</span> {linkedProj.title}</p>}
                        {proto.submissionDate  && <p><span className="text-slate-400">Submitted:</span> {format(parseISO(proto.submissionDate), 'MMM d, yyyy')}</p>}
                        {proto.expirationDate  && (
                          <p className={expInfo?.color ?? ''}>
                            <span className="text-slate-400">Expires:</span> {format(parseISO(proto.expirationDate), 'MMM d, yyyy')}
                            {expInfo && <span className="ml-1 font-medium">({expInfo.label})</span>}
                          </p>
                        )}
                      </div>

                      {proto.notes && (
                        <p className="mt-3 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 leading-relaxed">{proto.notes}</p>
                      )}
                    </div>

                    {/* Actions */}
                    {canEdit && (
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="xs" icon={Edit2}
                          onClick={() => { setEditProto(proto); setShowForm(true) }} title="Edit" />
                        <Button variant="ghost" size="xs" icon={Trash2}
                          onClick={() => setDeleteConfirm(proto)} title="Delete"
                          className="hover:text-red-500" />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditProto(null) }}
        title={editProto ? 'Edit Protocol' : 'New Protocol'}
        size="lg"
      >
        <ProtocolForm
          initial={editProto}
          onClose={() => { setShowForm(false); setEditProto(null) }}
          onSave={handleSave}
          saving={saving}
          projects={projects}
          users={users}
        />
      </Modal>

      {/* Delete confirmation */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Protocol" size="sm">
        <p className="text-sm text-slate-600 mb-6">
          Delete <strong>{deleteConfirm?.title}</strong>? This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => handleDelete(deleteConfirm)}>Delete</Button>
        </div>
      </Modal>
    </Layout>
  )
}
