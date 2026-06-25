import { useState } from 'react'
import { BookOpen, Send, ChevronDown, ChevronUp, Edit2, X, Save, Calendar, Trash2, Paperclip, FileText } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { supabase, DEMO_MODE } from '../lib/supabase'
import Layout from '../components/layout/Layout'
import Header from '../components/layout/Header'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'

// ── Status config ─────────────────────────────────────────────────────────────
const PUB_STATUSES = {
  preparing:    { label: 'Preparing Manuscript', bg: 'bg-slate-100',   text: 'text-slate-600',   dot: 'bg-slate-400'   },
  submitted:    { label: 'Submitted',             bg: 'bg-indigo-100',  text: 'text-indigo-700',  dot: 'bg-indigo-400'  },
  under_review: { label: 'Under Review',          bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-400'   },
  revision:     { label: 'Revision Required',     bg: 'bg-orange-100',  text: 'text-orange-700',  dot: 'bg-orange-400'  },
  accepted:     { label: 'Accepted',              bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  published:    { label: 'Published',             bg: 'bg-green-100',   text: 'text-green-700',   dot: 'bg-green-400'   },
}

const SUB_STATUSES = {
  submitted:    { label: 'Submitted',           dot: 'bg-blue-400',    text: 'text-blue-600'    },
  under_review: { label: 'Under Review',        dot: 'bg-amber-400',   text: 'text-amber-600'   },
  revision:     { label: 'Revision Requested',  dot: 'bg-orange-400',  text: 'text-orange-600'  },
  accepted:     { label: 'Accepted',            dot: 'bg-emerald-400', text: 'text-emerald-600' },
  rejected:     { label: 'Rejected',            dot: 'bg-red-400',     text: 'text-red-600'     },
  withdrawn:    { label: 'Withdrawn',           dot: 'bg-slate-300',   text: 'text-slate-400'   },
}

const EMPTY_SUB = { journalName: '', submissionDate: '', status: 'submitted', decisionDate: '', notes: '' }

// ── Submission form ───────────────────────────────────────────────────────────
function SubmissionForm({ initial, onClose, onSave, journals = [] }) {
  const [form, setForm] = useState(initial || EMPTY_SUB)
  const [error, setError] = useState('')
  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function submit(e) {
    e.preventDefault()
    if (!form.journalName.trim()) { setError('Journal name is required.'); return }
    onSave(form)
  }

  const listId = 'journal-suggestions'

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <div>
        <label className="label">Journal Name *</label>
        <input className="input-base" value={form.journalName} onChange={e => set('journalName', e.target.value)}
          list={listId} placeholder="Type or pick from your journal database" autoFocus />
        {journals.length > 0 && (
          <datalist id={listId}>
            {journals.map(j => <option key={j.id} value={j.name} />)}
          </datalist>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Submission Date</label>
          <input type="date" className="input-base" value={form.submissionDate || ''}
            onChange={e => set('submissionDate', e.target.value)} />
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input-base" value={form.status} onChange={e => set('status', e.target.value)}>
            {Object.entries(SUB_STATUSES).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Decision Date</label>
        <input type="date" className="input-base" value={form.decisionDate || ''}
          onChange={e => set('decisionDate', e.target.value)} />
      </div>

      <div>
        <label className="label">Notes</label>
        <textarea className="input-base resize-none" rows={2} value={form.notes}
          onChange={e => set('notes', e.target.value)}
          placeholder="Reviewer comments, manuscript ID, conditions…" />
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" icon={Save}>{initial ? 'Update' : 'Log Submission'}</Button>
      </div>
    </form>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Publications() {
  const { projects, submissions = [], journals = [], users, dispatch } = useData()
  const { user } = useAuth()

  const [filter,              setFilter]              = useState('all')
  const [showSubForm,         setShowSubForm]         = useState(null)
  const [editSub,             setEditSub]             = useState(null)
  const [editPubStatus,       setEditPubStatus]       = useState(null)
  const [pubStatusVal,        setPubStatusVal]        = useState('')
  const [deleteSubConfirm,    setDeleteSubConfirm]    = useState(null)
  const [deleteProjectConfirm,setDeleteProjectConfirm] = useState(null)
  const [expanded,            setExpanded]            = useState({})

  const canManage = ['admin', 'pi', 'research_fellow'].includes(user?.role)

  async function handlePdfUpload(proj, file) {
    if (!file || DEMO_MODE) return
    const ext  = file.name.split('.').pop()
    const path = `${proj.id}/${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from('papers').upload(path, file, { upsert: true })
    if (error) { alert('Upload failed: ' + error.message); return }
    dispatch({ type: 'UPDATE_PROJECT', payload: { ...proj, fileUrl: path, fileName: file.name, tags: proj.tags, teamMembers: proj.teamMembers } })
  }

  async function handlePdfView(proj) {
    if (!proj.fileUrl) return
    const { data, error } = await supabase.storage.from('papers').createSignedUrl(proj.fileUrl, 120)
    if (error || !data?.signedUrl) { alert('Could not open PDF. Please try again.'); return }
    window.open(data.signedUrl, '_blank')
  }

  // Publications = completed projects
  const completed = projects.filter(p => p.status === 'completed')
  const filtered  = completed.filter(p => filter === 'all' || p.pubStatus === filter)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))

  function toggleExpand(id) { setExpanded(e => ({ ...e, [id]: !e[id] })) }

  function openEditStatus(proj) {
    setEditPubStatus(proj.id)
    setPubStatusVal(proj.pubStatus || '')
  }

  function savePubStatus() {
    dispatch({ type: 'UPDATE_PUB_STATUS', payload: { id: editPubStatus, pubStatus: pubStatusVal || null } })
    setEditPubStatus(null)
  }

  function handleSaveSub(form) {
    if (editSub) {
      dispatch({ type: 'UPDATE_SUBMISSION', payload: { ...form, id: editSub.id } })
    } else {
      dispatch({ type: 'ADD_SUBMISSION', payload: { ...form, projectId: showSubForm } })
    }
    setShowSubForm(null)
    setEditSub(null)
  }

  const PUB_FILTERS = [
    ['all',          'All'],
    ['preparing',    'Preparing'],
    ['submitted',    'Submitted'],
    ['under_review', 'Under Review'],
    ['revision',     'Revision'],
    ['accepted',     'Accepted'],
    ['published',    'Published'],
  ]

  return (
    <Layout>
      <Header
        title="Publications"
        subtitle={`${completed.length} completed project${completed.length !== 1 ? 's' : ''}`}
      />

      <div className="p-4 md:p-6 max-w-4xl space-y-5">

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-1 bg-white border border-slate-200 rounded-lg p-1">
          {PUB_FILTERS.map(([val, label]) => {
            const count = val === 'all' ? completed.length : completed.filter(p => p.pubStatus === val).length
            if (val !== 'all' && count === 0) return null
            return (
              <button key={val} onClick={() => setFilter(val)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap
                  ${filter === val ? 'bg-brand-500 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                {label}
                {val !== 'all' && count > 0 && <span className="ml-1 opacity-60">({count})</span>}
              </button>
            )
          })}
        </div>

        {/* Empty state */}
        {completed.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No completed projects yet</p>
            <p className="text-sm mt-1">Projects marked as Completed will appear here for publication tracking.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <p className="text-sm">No projects in this publication stage.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(proj => {
              const subs       = submissions.filter(s => s.projectId === proj.id)
                                            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              const lead       = users.find(u => u.id === proj.assignedTo)
              const pubSt      = PUB_STATUSES[proj.pubStatus]
              const isExpanded = expanded[proj.id]
              const latestSub  = subs[0]

              return (
                <div key={proj.id} className="card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">

                      {/* Publication status badge + title */}
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {pubSt ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${pubSt.bg} ${pubSt.text}`}>
                            {pubSt.label}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-400">
                            No status set
                          </span>
                        )}
                        <h3 className="text-sm font-semibold text-slate-800 leading-snug">{proj.title}</h3>
                      </div>

                      {/* Meta */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-slate-400">
                        {lead && <span>Lead: <span className="text-slate-600">{lead.name}</span></span>}
                        {proj.updatedAt && (
                          <span className="flex items-center gap-1">
                            <Calendar size={11} />
                            Completed around {format(parseISO(proj.updatedAt), 'MMM yyyy')}
                          </span>
                        )}
                        {proj.tags?.length > 0 && (
                          <span>{proj.tags.join(', ')}</span>
                        )}
                      </div>

                      {/* Latest submission preview */}
                      {latestSub && !isExpanded && (
                        <p className="text-xs text-slate-400 mt-2">
                          Latest: <span className="text-slate-600 font-medium">{latestSub.journalName}</span>
                          {' — '}
                          <span className={SUB_STATUSES[latestSub.status]?.text || 'text-slate-500'}>
                            {SUB_STATUSES[latestSub.status]?.label || latestSub.status}
                          </span>
                        </p>
                      )}

                      {/* Expand toggle */}
                      {subs.length > 0 && (
                        <button onClick={() => toggleExpand(proj.id)}
                          className="mt-2 flex items-center gap-1 text-xs text-slate-400 hover:text-brand-600 transition-colors">
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          {subs.length} journal submission{subs.length !== 1 ? 's' : ''}
                        </button>
                      )}

                      {/* Submission history */}
                      {isExpanded && (
                        <div className="mt-3 space-y-3">
                          {subs.map((sub, i) => {
                            const ss = SUB_STATUSES[sub.status] || SUB_STATUSES.submitted
                            return (
                              <div key={sub.id} className="flex items-start gap-3 pl-2 border-l-2 border-slate-200">
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${ss.dot}`} />
                                    <span className="text-xs font-semibold text-slate-700">{sub.journalName}</span>
                                    <span className={`text-xs font-medium ${ss.text}`}>{ss.label}</span>
                                    {i === 0 && <span className="text-xs bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full">Latest</span>}
                                  </div>
                                  <div className="ml-4 mt-1 text-xs text-slate-400 space-y-0.5">
                                    {sub.submissionDate && <p>Submitted: {format(parseISO(sub.submissionDate), 'MMM d, yyyy')}</p>}
                                    {sub.decisionDate   && <p>Decision: {format(parseISO(sub.decisionDate),   'MMM d, yyyy')}</p>}
                                    {sub.notes && <p className="text-slate-500 italic mt-0.5">"{sub.notes}"</p>}
                                  </div>
                                </div>
                                {canManage && (
                                  <div className="flex gap-1 shrink-0">
                                    <button onClick={() => { setEditSub(sub); setShowSubForm(proj.id) }}
                                      className="p-1 text-slate-400 hover:text-brand-600 transition-colors" title="Edit">
                                      <Edit2 size={12} />
                                    </button>
                                    <button onClick={() => setDeleteSubConfirm(sub)}
                                      className="p-1 text-slate-400 hover:text-red-500 transition-colors" title="Remove">
                                      <X size={12} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {canManage && (
                      <div className="flex flex-col gap-2 shrink-0 items-end">
                        <Button variant="ghost" size="xs" icon={Edit2}
                          onClick={() => openEditStatus(proj)}
                          title="Update publication status">
                          Status
                        </Button>
                        <Button variant="secondary" size="xs" icon={Send}
                          onClick={() => {
                            setEditSub(null)
                            setShowSubForm(proj.id)
                            setExpanded(e => ({ ...e, [proj.id]: true }))
                          }}>
                          Log Submission
                        </Button>
                        {/* PDF attach / view */}
                        {proj.fileUrl ? (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="xs" icon={FileText}
                              className="text-emerald-600 hover:text-emerald-700"
                              onClick={() => handlePdfView(proj)}
                              title="View PDF">
                              View PDF
                            </Button>
                            <label className="cursor-pointer" title="Replace PDF">
                              <input type="file" accept=".pdf" className="hidden"
                                onChange={e => e.target.files[0] && handlePdfUpload(proj, e.target.files[0])} />
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-100 transition-colors">
                                <Paperclip size={11} />
                              </span>
                            </label>
                          </div>
                        ) : (
                          <label className="cursor-pointer" title="Attach PDF">
                            <input type="file" accept=".pdf" className="hidden"
                              onChange={e => e.target.files[0] && handlePdfUpload(proj, e.target.files[0])} />
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-100 transition-colors border border-dashed border-slate-200">
                              <Paperclip size={11} /> Attach PDF
                            </span>
                          </label>
                        )}
                        {user?.role === 'admin' && (
                          <Button variant="ghost" size="xs" icon={Trash2}
                            className="hover:text-red-500 text-slate-300"
                            onClick={() => setDeleteProjectConfirm(proj)}
                            title="Delete project">
                            Delete
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Edit publication status modal */}
      <Modal isOpen={!!editPubStatus} onClose={() => setEditPubStatus(null)} title="Update Publication Status" size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Publication Status</label>
            <select className="input-base" value={pubStatusVal} onChange={e => setPubStatusVal(e.target.value)}>
              <option value="">— Not set —</option>
              {Object.entries(PUB_STATUSES).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setEditPubStatus(null)}>Cancel</Button>
            <Button icon={Save} onClick={savePubStatus}>Save</Button>
          </div>
        </div>
      </Modal>

      {/* Log / Edit submission modal */}
      <Modal
        isOpen={!!showSubForm}
        onClose={() => { setShowSubForm(null); setEditSub(null) }}
        title={editSub ? 'Edit Submission' : 'Log Journal Submission'}
        size="md"
      >
        <SubmissionForm
          initial={editSub}
          onClose={() => { setShowSubForm(null); setEditSub(null) }}
          onSave={handleSaveSub}
          journals={journals}
        />
      </Modal>

      {/* Delete project confirmation */}
      <Modal isOpen={!!deleteProjectConfirm} onClose={() => setDeleteProjectConfirm(null)} title="Delete Project" size="sm">
        <p className="text-sm text-slate-600 mb-6">
          Are you sure you want to delete <strong>{deleteProjectConfirm?.title}</strong>?
          This will also delete all stages, tasks, comments, and submission history. This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteProjectConfirm(null)}>Cancel</Button>
          <Button variant="danger" icon={Trash2} onClick={() => {
            dispatch({ type: 'DELETE_PROJECT', payload: { id: deleteProjectConfirm.id } })
            setDeleteProjectConfirm(null)
          }}>Delete Project</Button>
        </div>
      </Modal>

      {/* Delete submission confirmation */}
      <Modal isOpen={!!deleteSubConfirm} onClose={() => setDeleteSubConfirm(null)} title="Remove Submission" size="sm">
        <p className="text-sm text-slate-600 mb-4">
          Remove the submission to <strong>{deleteSubConfirm?.journalName}</strong>? This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteSubConfirm(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => {
            dispatch({ type: 'DELETE_SUBMISSION', payload: { id: deleteSubConfirm.id } })
            setDeleteSubConfirm(null)
          }}>Remove</Button>
        </div>
      </Modal>
    </Layout>
  )
}
