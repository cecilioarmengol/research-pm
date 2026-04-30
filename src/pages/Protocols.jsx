import { useState, useRef } from 'react'
import { Plus, Edit2, Trash2, AlertTriangle, Clock, FileText, Save, Download, Paperclip, X } from 'lucide-react'
import { differenceInDays, parseISO, format } from 'date-fns'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { supabase, DEMO_MODE } from '../lib/supabase'
import Layout from '../components/layout/Layout'
import Header from '../components/layout/Header'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'

const EMPTY = {
  title: '', protocolNumber: '', projectId: '', piId: '',
  ethicsCommittee: '', submissionDate: '', expirationDate: '',
  approvalNumber: '', notes: '', fileUrl: null, fileName: null,
}

const MAX_FILE_MB = 10

function expirationInfo(dateStr) {
  if (!dateStr) return null
  const days = differenceInDays(parseISO(dateStr), new Date())
  if (days < 0)   return { label: 'Expired',              color: 'text-red-600',    bg: 'bg-red-50 border-red-200'       }
  if (days <= 30) return { label: `Expires in ${days}d`,  color: 'text-red-500',    bg: 'bg-red-50 border-red-200'       }
  if (days <= 60) return { label: `Expires in ${days}d`,  color: 'text-amber-500',  bg: 'bg-amber-50 border-amber-200'   }
  return           { label: `Valid — ${days}d left`,      color: 'text-emerald-600',bg: 'bg-emerald-50 border-emerald-200' }
}

function ProtocolForm({ initial, onClose, onSave, saving, projects, users }) {
  const [form, setForm]         = useState(initial || EMPTY)
  const [file, setFile]         = useState(null)       // new file selected
  const [removeFile, setRemoveFile] = useState(false)  // user wants to remove existing
  const [error, setError]       = useState('')
  const fileRef = useRef()
  const pis = users.filter(u => ['pi', 'admin', 'research_fellow'].includes(u.role))

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function handleFileChange(e) {
    const f = e.target.files[0]
    if (!f) return
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_FILE_MB} MB.`)
      return
    }
    setFile(f)
    setRemoveFile(false)
    setError('')
  }

  function handleRemoveFile() {
    setFile(null)
    setRemoveFile(true)
    if (fileRef.current) fileRef.current.value = ''
  }

  function submit(e) {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required.'); return }
    onSave(form, file, removeFile)
  }

  const existingFile = form.fileName && !removeFile

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

        {/* File upload */}
        <div className="sm:col-span-2">
          <label className="label">Protocol Document</label>
          {existingFile ? (
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5">
              <Paperclip size={14} className="text-slate-400 shrink-0" />
              <span className="text-sm text-slate-600 flex-1 truncate">{form.fileName}</span>
              <button type="button" onClick={handleRemoveFile} className="text-slate-400 hover:text-red-500 transition-colors">
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx"
                onChange={handleFileChange}
                className="block w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
              />
              {file && (
                <p className="text-xs text-emerald-600 flex items-center gap-1">
                  <Paperclip size={12} /> {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
                </p>
              )}
              <p className="text-xs text-slate-400">PDF, Word or PowerPoint — max {MAX_FILE_MB} MB</p>
            </div>
          )}
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
  const [showForm, setShowForm]           = useState(false)
  const [editProto, setEditProto]         = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [saving, setSaving]               = useState(false)
  const [filter, setFilter]               = useState('all')

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

  async function uploadFile(file, protocolId) {
    const ext      = file.name.split('.').pop()
    const path     = `${protocolId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('protocols').upload(path, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from('protocols').getPublicUrl(path)
    return { fileUrl: data.publicUrl, filePath: path, fileName: file.name }
  }

  async function handleSave(form, file, removeFile) {
    setSaving(true)
    try {
      let fileUrl  = removeFile ? null : (form.fileUrl  || null)
      let fileName = removeFile ? null : (form.fileName || null)
      let filePath = null

      if (file && !DEMO_MODE) {
        const protoId = editProto?.id || crypto.randomUUID()
        const result  = await uploadFile(file, protoId)
        fileUrl  = result.fileUrl
        fileName = result.fileName
        filePath = result.filePath
      }

      if (editProto) {
        dispatch({ type: 'UPDATE_PROTOCOL', payload: { ...form, id: editProto.id, fileUrl, fileName } })
      } else {
        dispatch({ type: 'ADD_PROTOCOL', payload: { ...form, createdBy: user.id, fileUrl, fileName } })
      }
      setShowForm(false)
      setEditProto(null)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(proto) {
    const filePath = proto.fileUrl
      ? proto.fileUrl.split('/protocols/')[1]
      : null
    dispatch({ type: 'DELETE_PROTOCOL', payload: { id: proto.id, filePath } })
    setDeleteConfirm(null)
  }

  async function handleDownload(proto) {
    if (!proto.fileUrl) return
    const path = proto.fileUrl.split('/protocols/')[1]
    const { data } = await supabase.storage.from('protocols').createSignedUrl(path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
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
        <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1 w-fit">
          {[['all', 'All'], ['expiring', 'Expiring Soon'], ['expired', 'Expired']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${filter === val ? 'bg-brand-500 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
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
                        {pi              && <p><span className="text-slate-400">PI:</span> {pi.name}</p>}
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

                      {/* Document */}
                      {proto.fileName && (
                        <button
                          onClick={() => handleDownload(proto)}
                          className="mt-3 flex items-center gap-2 text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors"
                        >
                          <Download size={13} />
                          {proto.fileName}
                        </button>
                      )}
                    </div>

                    {/* Actions */}
                    {canManage && (
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
        <p className="text-sm text-slate-600 mb-2">
          Delete <strong>{deleteConfirm?.title}</strong>? This cannot be undone.
        </p>
        {deleteConfirm?.fileName && (
          <p className="text-xs text-slate-400 mb-4 flex items-center gap-1">
            <Paperclip size={12} /> The attached file will also be deleted.
          </p>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => handleDelete(deleteConfirm)}>Delete</Button>
        </div>
      </Modal>
    </Layout>
  )
}
