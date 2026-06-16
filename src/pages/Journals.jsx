import { useState, useMemo, Fragment } from 'react'
import { Plus, Search, Star, ExternalLink, Edit2, Trash2, ChevronDown, ChevronUp, Save, X } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/layout/Layout'
import Header from '../components/layout/Header'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'

// ── Quartile badge ────────────────────────────────────────────────────────────
const Q_STYLE = {
  Q1: 'bg-emerald-100 text-emerald-700',
  Q2: 'bg-blue-100    text-blue-700',
  Q3: 'bg-amber-100   text-amber-700',
  Q4: 'bg-slate-100   text-slate-500',
}

function QBadge({ q }) {
  if (!q) return <span className="text-slate-300 text-xs">—</span>
  return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${Q_STYLE[q] || 'bg-slate-100 text-slate-500'}`}>{q}</span>
}

// ── Empty form ────────────────────────────────────────────────────────────────
const EMPTY = {
  name: '', issn: '', publisher: '', editorInChief: '', country: '',
  impactFactor: '', scimagoQuartile: '', openAccess: false,
  apcUsd: '', avgReviewWeeks: '', acceptanceRate: '',
  submissionUrl: '', scope: '', specialtyTags: '', notes: '',
}

function toForm(j) {
  return {
    name:            j.name,
    issn:            j.issn            || '',
    publisher:       j.publisher       || '',
    editorInChief:   j.editorInChief   || '',
    country:         j.country         || '',
    impactFactor:    j.impactFactor    != null ? String(j.impactFactor) : '',
    scimagoQuartile: j.scimagoQuartile || '',
    openAccess:      j.openAccess      || false,
    apcUsd:          j.apcUsd          != null ? String(j.apcUsd) : '',
    avgReviewWeeks:  j.avgReviewWeeks  != null ? String(j.avgReviewWeeks) : '',
    acceptanceRate:  j.acceptanceRate  != null ? String(j.acceptanceRate) : '',
    submissionUrl:   j.submissionUrl   || '',
    scope:           j.scope           || '',
    specialtyTags:   (j.specialtyTags  || []).join(', '),
    notes:           j.notes           || '',
  }
}

function toPayload(form) {
  return {
    name:            form.name.trim(),
    issn:            form.issn.trim(),
    publisher:       form.publisher.trim(),
    editorInChief:   form.editorInChief.trim(),
    country:         form.country.trim(),
    impactFactor:    form.impactFactor  !== '' ? parseFloat(form.impactFactor)  : null,
    scimagoQuartile: form.scimagoQuartile || null,
    openAccess:      form.openAccess,
    apcUsd:          form.apcUsd          !== '' ? parseInt(form.apcUsd,   10) : null,
    avgReviewWeeks:  form.avgReviewWeeks  !== '' ? parseInt(form.avgReviewWeeks, 10) : null,
    acceptanceRate:  form.acceptanceRate  !== '' ? parseInt(form.acceptanceRate, 10) : null,
    submissionUrl:   form.submissionUrl.trim(),
    scope:           form.scope.trim(),
    specialtyTags:   form.specialtyTags.split(',').map(t => t.trim()).filter(Boolean),
    notes:           form.notes.trim(),
  }
}

// ── Journal form modal ────────────────────────────────────────────────────────
function JournalForm({ initial, onClose, onSave }) {
  const [form, setForm] = useState(initial ? toForm(initial) : EMPTY)
  const [error, setError] = useState('')
  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function submit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Journal name is required.'); return }
    onSave(toPayload(form))
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">Journal Name *</label>
          <input className="input-base" value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="e.g. Journal of Neurosurgery" autoFocus />
        </div>
        <div>
          <label className="label">ISSN</label>
          <input className="input-base" value={form.issn} onChange={e => set('issn', e.target.value)}
            placeholder="e.g. 0022-3085" />
        </div>
        <div>
          <label className="label">Publisher</label>
          <input className="input-base" value={form.publisher} onChange={e => set('publisher', e.target.value)}
            placeholder="e.g. Springer" />
        </div>
        <div>
          <label className="label">Editor in Chief</label>
          <input className="input-base" value={form.editorInChief} onChange={e => set('editorInChief', e.target.value)}
            placeholder="Full name" />
        </div>
        <div>
          <label className="label">Country</label>
          <input className="input-base" value={form.country} onChange={e => set('country', e.target.value)}
            placeholder="e.g. United States" />
        </div>
        <div>
          <label className="label">SCImago Quartile</label>
          <select className="input-base" value={form.scimagoQuartile} onChange={e => set('scimagoQuartile', e.target.value)}>
            <option value="">— Unknown —</option>
            <option value="Q1">Q1</option>
            <option value="Q2">Q2</option>
            <option value="Q3">Q3</option>
            <option value="Q4">Q4</option>
          </select>
        </div>
        <div>
          <label className="label">Impact Factor</label>
          <input type="number" step="0.001" min="0" className="input-base" value={form.impactFactor}
            onChange={e => set('impactFactor', e.target.value)} placeholder="e.g. 4.532" />
        </div>
        <div>
          <label className="label">Avg. Review Time (weeks)</label>
          <input type="number" min="0" className="input-base" value={form.avgReviewWeeks}
            onChange={e => set('avgReviewWeeks', e.target.value)} placeholder="e.g. 12" />
        </div>
        <div>
          <label className="label">Acceptance Rate (%)</label>
          <input type="number" min="0" max="100" className="input-base" value={form.acceptanceRate}
            onChange={e => set('acceptanceRate', e.target.value)} placeholder="e.g. 25" />
        </div>
        <div>
          <label className="label">APC (USD)</label>
          <input type="number" min="0" className="input-base" value={form.apcUsd}
            onChange={e => set('apcUsd', e.target.value)} placeholder="e.g. 3000" />
        </div>
        <div className="flex items-center gap-3 pt-5">
          <input type="checkbox" id="oa" checked={form.openAccess} onChange={e => set('openAccess', e.target.checked)}
            className="w-4 h-4 accent-brand-500" />
          <label htmlFor="oa" className="text-sm font-medium text-slate-700 cursor-pointer">Open Access</label>
        </div>
        <div className="col-span-2">
          <label className="label">Submission URL</label>
          <input type="url" className="input-base" value={form.submissionUrl}
            onChange={e => set('submissionUrl', e.target.value)} placeholder="https://..." />
        </div>
        <div className="col-span-2">
          <label className="label">Specialty Tags <span className="text-slate-400 font-normal">(comma-separated)</span></label>
          <input className="input-base" value={form.specialtyTags} onChange={e => set('specialtyTags', e.target.value)}
            placeholder="e.g. neurovascular, stroke, endovascular" />
        </div>
        <div className="col-span-2">
          <label className="label">Journal Scope / Topics</label>
          <textarea className="input-base resize-none" rows={3} value={form.scope}
            onChange={e => set('scope', e.target.value)}
            placeholder="Describe the journal's focus areas and topics of interest…" />
        </div>
        <div className="col-span-2">
          <label className="label">Internal Notes</label>
          <textarea className="input-base resize-none" rows={2} value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="Reviewer culture, turnaround notes, past experiences…" />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" icon={Save}>{initial ? 'Save Changes' : 'Add Journal'}</Button>
      </div>
    </form>
  )
}

// ── Expandable detail row ─────────────────────────────────────────────────────
function JournalDetail({ j }) {
  return (
    <tr className="bg-slate-50 border-b border-slate-100">
      <td colSpan={8} className="px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-2 text-xs text-slate-600">
          {j.editorInChief && <div><span className="text-slate-400">Editor in Chief: </span>{j.editorInChief}</div>}
          {j.issn          && <div><span className="text-slate-400">ISSN: </span>{j.issn}</div>}
          {j.publisher     && <div><span className="text-slate-400">Publisher: </span>{j.publisher}</div>}
          {j.apcUsd   != null && <div><span className="text-slate-400">APC: </span>${j.apcUsd.toLocaleString()}</div>}
          {j.acceptanceRate != null && <div><span className="text-slate-400">Acceptance rate: </span>{j.acceptanceRate}%</div>}
          {j.specialtyTags?.length > 0 && (
            <div className="col-span-2 md:col-span-3 flex flex-wrap gap-1 mt-1">
              {j.specialtyTags.map(t => (
                <span key={t} className="bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full text-xs">{t}</span>
              ))}
            </div>
          )}
          {j.scope && (
            <div className="col-span-2 md:col-span-3 mt-1">
              <span className="text-slate-400">Scope: </span>{j.scope}
            </div>
          )}
          {j.notes && (
            <div className="col-span-2 md:col-span-3 mt-1 italic text-slate-500">
              <span className="not-italic text-slate-400">Notes: </span>{j.notes}
            </div>
          )}
          {j.submissionUrl && (
            <div className="col-span-2 md:col-span-3 mt-1">
              <a href={j.submissionUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-brand-600 hover:underline">
                <ExternalLink size={11} /> Submit Manuscript
              </a>
            </div>
          )}
        </div>
      </td>
    </tr>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Journals() {
  const { journals = [], dispatch } = useData()
  const { user } = useAuth()

  const [search,        setSearch]        = useState('')
  const [qFilter,       setQFilter]       = useState('all')
  const [oaFilter,      setOaFilter]      = useState(false)
  const [favFilter,     setFavFilter]     = useState(false)
  const [sortKey,       setSortKey]       = useState('impactFactor')
  const [sortAsc,       setSortAsc]       = useState(false)
  const [expanded,      setExpanded]      = useState({})
  const [showForm,      setShowForm]      = useState(false)
  const [editJournal,   setEditJournal]   = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const canManage = ['admin', 'pi', 'research_fellow'].includes(user?.role)

  function toggleSort(key) {
    if (sortKey === key) setSortAsc(a => !a)
    else { setSortKey(key); setSortAsc(false) }
  }

  function toggleExpand(id) { setExpanded(e => ({ ...e, [id]: !e[id] })) }

  const filtered = useMemo(() => {
    let list = journals
    if (search)    list = list.filter(j => j.name.toLowerCase().includes(search.toLowerCase()) || (j.publisher || '').toLowerCase().includes(search.toLowerCase()))
    if (qFilter !== 'all') list = list.filter(j => j.scimagoQuartile === qFilter)
    if (oaFilter)  list = list.filter(j => j.openAccess)
    if (favFilter) list = list.filter(j => j.isFavorite)
    return [...list].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      const r = typeof av === 'string' ? av.localeCompare(bv) : av - bv
      return sortAsc ? r : -r
    })
  }, [journals, search, qFilter, oaFilter, favFilter, sortKey, sortAsc])

  function SortTh({ label, colKey, className = '' }) {
    const active = sortKey === colKey
    return (
      <th onClick={() => toggleSort(colKey)}
        className={`px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer select-none hover:text-slate-700 whitespace-nowrap ${className}`}>
        {label}
        <span className="ml-1 inline-block w-3 text-center">
          {active ? (sortAsc ? '↑' : '↓') : <span className="opacity-20">↕</span>}
        </span>
      </th>
    )
  }

  function handleSave(payload) {
    if (editJournal) {
      dispatch({ type: 'UPDATE_JOURNAL', payload: { ...payload, id: editJournal.id } })
    } else {
      dispatch({ type: 'ADD_JOURNAL', payload })
    }
    setShowForm(false)
    setEditJournal(null)
  }

  return (
    <Layout>
      <Header
        title="Journal Database"
        subtitle={`${journals.length} journal${journals.length !== 1 ? 's' : ''}`}
        actions={
          canManage && (
            <Button icon={Plus} size="sm" onClick={() => { setEditJournal(null); setShowForm(true) }}>
              Add Journal
            </Button>
          )
        }
      />

      <div className="p-4 md:p-6 space-y-4">

        {/* Search + filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 flex-1 min-w-48">
            <Search size={15} className="text-slate-400 shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search journals…"
              className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none flex-1" />
          </div>

          {/* Quartile tabs */}
          <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1">
            {['all','Q1','Q2','Q3','Q4'].map(q => (
              <button key={q} onClick={() => setQFilter(q)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  qFilter === q ? 'bg-brand-500 text-white' : 'text-slate-500 hover:bg-slate-100'
                }`}>
                {q === 'all' ? 'All' : q}
              </button>
            ))}
          </div>

          <button onClick={() => setOaFilter(f => !f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              oaFilter ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            }`}>
            Open Access
          </button>

          <button onClick={() => setFavFilter(f => !f)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              favFilter ? 'bg-amber-400 text-white border-amber-400' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            }`}>
            <Star size={12} /> Favorites
          </button>
        </div>

        {/* Table */}
        {journals.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-lg font-medium">No journals yet</p>
            <p className="text-sm mt-1">Add journals to build your research database.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">No journals match your filters.</div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-3 w-8" />
                    <SortTh label="Journal" colKey="name" className="min-w-[220px]" />
                    <SortTh label="Q"  colKey="scimagoQuartile" className="w-16" />
                    <SortTh label="IF" colKey="impactFactor" className="w-20" />
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap w-16">OA</th>
                    <SortTh label="Avg. Review" colKey="avgReviewWeeks" className="w-28" />
                    <SortTh label="Country" colKey="country" className="w-36" />
                    <th className="px-3 py-3 w-24" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(j => (
                    <Fragment key={j.id}>
                      <tr className="hover:bg-slate-50 transition-colors group">
                        {/* Favorite star */}
                        <td className="px-3 py-3 text-center">
                          <button onClick={() => dispatch({ type: 'TOGGLE_JOURNAL_FAVORITE', payload: { id: j.id } })}
                            className={`transition-colors ${j.isFavorite ? 'text-amber-400' : 'text-slate-200 hover:text-amber-300'}`}>
                            <Star size={14} fill={j.isFavorite ? 'currentColor' : 'none'} />
                          </button>
                        </td>
                        {/* Name + publisher */}
                        <td className="px-3 py-3">
                          <button onClick={() => toggleExpand(j.id)}
                            className="text-left group/name">
                            <span className="font-medium text-slate-800 group-hover/name:text-brand-600 transition-colors leading-snug block">
                              {j.name}
                            </span>
                            {j.publisher && <span className="text-xs text-slate-400">{j.publisher}</span>}
                          </button>
                        </td>
                        {/* Quartile */}
                        <td className="px-3 py-3"><QBadge q={j.scimagoQuartile} /></td>
                        {/* IF */}
                        <td className="px-3 py-3 text-slate-700 font-mono text-xs">
                          {j.impactFactor != null ? j.impactFactor.toFixed(3) : <span className="text-slate-300">—</span>}
                        </td>
                        {/* OA */}
                        <td className="px-3 py-3">
                          {j.openAccess
                            ? <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">OA</span>
                            : <span className="text-slate-300 text-xs">—</span>}
                        </td>
                        {/* Avg review */}
                        <td className="px-3 py-3 text-slate-500 text-xs">
                          {j.avgReviewWeeks != null ? `${j.avgReviewWeeks} wks` : <span className="text-slate-300">—</span>}
                        </td>
                        {/* Country */}
                        <td className="px-3 py-3 text-slate-500 text-xs">{j.country || <span className="text-slate-300">—</span>}</td>
                        {/* Actions */}
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => toggleExpand(j.id)}
                              className="p-1 text-slate-400 hover:text-brand-600 transition-colors" title={expanded[j.id] ? 'Collapse' : 'Expand'}>
                              {expanded[j.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                            {canManage && (
                              <>
                                <button onClick={() => { setEditJournal(j); setShowForm(true) }}
                                  className="p-1 text-slate-400 hover:text-brand-600 transition-colors" title="Edit">
                                  <Edit2 size={13} />
                                </button>
                                <button onClick={() => setDeleteConfirm(j)}
                                  className="p-1 text-slate-400 hover:text-red-500 transition-colors" title="Delete">
                                  <Trash2 size={13} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expanded[j.id] && <JournalDetail j={j} />}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditJournal(null) }}
        title={editJournal ? 'Edit Journal' : 'Add Journal'}
        size="lg"
      >
        <JournalForm
          initial={editJournal}
          onClose={() => { setShowForm(false); setEditJournal(null) }}
          onSave={handleSave}
        />
      </Modal>

      {/* Delete confirmation */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Journal" size="sm">
        <p className="text-sm text-slate-600 mb-6">
          Delete <strong>{deleteConfirm?.name}</strong>? This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button variant="danger" icon={Trash2} onClick={() => {
            dispatch({ type: 'DELETE_JOURNAL', payload: { id: deleteConfirm.id } })
            setDeleteConfirm(null)
          }}>Delete</Button>
        </div>
      </Modal>
    </Layout>
  )
}
