import { useState } from 'react'
import { Trophy, Clock, FlaskConical, Shield, Calendar, ChevronDown, ChevronUp, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { format, parseISO, differenceInDays } from 'date-fns'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/layout/Layout'
import Modal from '../components/ui/Modal'
import ProgressBar from '../components/ui/ProgressBar'
import Avatar from '../components/ui/Avatar'

// ── Status config ─────────────────────────────────────────────────────────────
const PUB_STATUS_LABEL = {
  accepted:     { label: 'Accepted',      bg: 'bg-emerald-100', text: 'text-emerald-700' },
  published:    { label: 'Published',     bg: 'bg-green-100',   text: 'text-green-700'   },
  submitted:    { label: 'Submitted',     bg: 'bg-indigo-100',  text: 'text-indigo-700'  },
  under_review: { label: 'Under Review',  bg: 'bg-amber-100',   text: 'text-amber-700'   },
  revision:     { label: 'Revision',      bg: 'bg-orange-100',  text: 'text-orange-700'  },
  preparing:    { label: 'Preparing',     bg: 'bg-slate-100',   text: 'text-slate-600'   },
}

const PROJECT_STATUS_LABEL = {
  not_started: { label: 'Not Started', dot: 'bg-slate-300' },
  in_progress: { label: 'In Progress', dot: 'bg-brand-400' },
  delayed:     { label: 'Delayed',     dot: 'bg-red-400'   },
  completed:   { label: 'Completed',   dot: 'bg-emerald-400' },
}

function PubBadge({ status }) {
  const s = PUB_STATUS_LABEL[status]
  if (!s) return null
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>{s.label}</span>
}

function EmptyState({ message }) {
  return <p className="text-center text-slate-400 text-sm py-10">{message}</p>
}

async function openPdf(proj) {
  if (!proj.fileUrl || !supabase) return
  const { data, error } = await supabase.storage.from('papers').createSignedUrl(proj.fileUrl, 120)
  if (error || !data?.signedUrl) { alert('Could not open PDF.'); return }
  window.open(data.signedUrl, '_blank')
}

// ── Modal content: Accepted / Published ───────────────────────────────────────
function PublishedList({ projects, submissions, getUserById, dispatch }) {
  if (!projects.length) return <EmptyState message="No accepted or published projects yet." />

  async function handleUpload(proj, file) {
    if (!file || !supabase) return
    const ext  = file.name.split('.').pop()
    const path = `${proj.id}/${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from('papers').upload(path, file, { upsert: true })
    if (error) { alert('Upload failed: ' + error.message); return }
    dispatch({ type: 'UPDATE_PROJECT', payload: { ...proj, fileUrl: path, fileName: file.name } })
  }

  return (
    <div className="space-y-3">
      {projects.map(p => {
        const lead = getUserById(p.assignedTo)
        const latestSub = submissions
          .filter(s => s.projectId === p.id)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
        return (
          <div key={p.id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <PubBadge status={p.pubStatus} />
                <span className="text-sm font-semibold text-slate-800">{p.title}</span>
              </div>
              {latestSub && (
                <p className="text-xs text-slate-500">
                  {latestSub.journalName}
                  {latestSub.decisionDate && ` · Decision: ${format(parseISO(latestSub.decisionDate), 'MMM d, yyyy')}`}
                </p>
              )}
              {lead && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Avatar user={lead} size="xs" />
                  <span className="text-xs text-slate-400">{lead.name}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 mt-2">
                <Calendar size={11} className="text-slate-400 shrink-0" />
                <span className="text-xs text-slate-400">Published:</span>
                <input
                  type="date"
                  className="text-xs text-slate-600 bg-transparent border-b border-dashed border-slate-300 hover:border-brand-400 focus:border-brand-500 focus:outline-none cursor-pointer"
                  value={p.publicationDate || ''}
                  onChange={e => dispatch({ type: 'UPDATE_PROJECT', payload: { ...p, publicationDate: e.target.value || null } })}
                />
              </div>
              <div className="flex items-center gap-3 mt-2">
                {p.fileUrl ? (
                  <>
                    <button onClick={() => openPdf(p)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors">
                      <FileText size={13} /> View PDF
                    </button>
                    <label className="cursor-pointer inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors">
                      <input type="file" accept=".pdf" className="hidden"
                        onChange={e => e.target.files[0] && handleUpload(p, e.target.files[0])} />
                      Replace
                    </label>
                  </>
                ) : (
                  <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-brand-600 transition-colors border border-dashed border-slate-300 hover:border-brand-400 rounded-lg px-2 py-1">
                    <input type="file" accept=".pdf" className="hidden"
                      onChange={e => e.target.files[0] && handleUpload(p, e.target.files[0])} />
                    <FileText size={13} /> Attach PDF
                  </label>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Submission status config ──────────────────────────────────────────────────
const SUB_STATUS = {
  submitted:    { label: 'Submitted',          dot: 'bg-blue-400',    text: 'text-blue-600'    },
  under_review: { label: 'Under Review',       dot: 'bg-amber-400',   text: 'text-amber-600'   },
  revision:     { label: 'Revision Requested', dot: 'bg-orange-400',  text: 'text-orange-600'  },
  accepted:     { label: 'Accepted',           dot: 'bg-emerald-400', text: 'text-emerald-600' },
  rejected:     { label: 'Rejected',           dot: 'bg-red-400',     text: 'text-red-600'     },
  withdrawn:    { label: 'Withdrawn',          dot: 'bg-slate-300',   text: 'text-slate-400'   },
}

// ── Modal content: Under Review ───────────────────────────────────────────────
function ReviewList({ projects, submissions, getUserById }) {
  if (!projects.length) return <EmptyState message="No projects currently under journal review." />

  return (
    <div className="space-y-5">
      {projects.map(p => {
        const lead = getUserById(p.assignedTo)
        const subs = submissions
          .filter(s => s.projectId === p.id)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

        return (
          <div key={p.id} className="bg-slate-50 rounded-2xl p-4">

            {/* Paper title + lead */}
            <p className="text-sm font-bold text-slate-800 leading-snug mb-1">{p.title}</p>
            {lead && (
              <div className="flex items-center gap-1.5 mb-4">
                <Avatar user={lead} size="xs" />
                <span className="text-xs text-slate-400">{lead.name}</span>
              </div>
            )}

            {/* Submission timeline — always visible */}
            {subs.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No submissions logged yet.</p>
            ) : (
              <div className="space-y-0">
                {subs.map((sub, i) => {
                  const ss = SUB_STATUS[sub.status] || SUB_STATUS.submitted
                  const isLast = i === subs.length - 1
                  return (
                    <div key={sub.id} className="flex gap-3">
                      {/* Dot + connecting line */}
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full shrink-0 border-2 border-white shadow ${ss.dot}`} />
                        {!isLast && <div className="w-0.5 flex-1 bg-slate-200 my-0.5" style={{ minHeight: '20px' }} />}
                      </div>
                      {/* Entry */}
                      <div className={`flex-1 min-w-0 ${!isLast ? 'pb-3' : ''}`}>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-slate-700">{sub.journalName}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-white border ${ss.text}`}>
                            {ss.label}
                          </span>
                          {i === 0 && (
                            <span className="text-xs bg-brand-50 text-brand-500 font-medium px-2 py-0.5 rounded-full">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 mt-0.5 text-xs text-slate-400">
                          {sub.submissionDate && (
                            <span className="flex items-center gap-1">
                              <Calendar size={10} /> Submitted {format(parseISO(sub.submissionDate), 'MMM d, yyyy')}
                            </span>
                          )}
                          {sub.decisionDate && (
                            <span className="flex items-center gap-1">
                              <Calendar size={10} /> Decision {format(parseISO(sub.decisionDate), 'MMM d, yyyy')}
                            </span>
                          )}
                        </div>
                        {sub.notes && (
                          <p className="text-xs text-slate-400 italic mt-0.5">"{sub.notes}"</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Modal content: In Progress ────────────────────────────────────────────────
function ProgressList({ projects, getUserById, getProjectProgress, getStagesForProject }) {
  if (!projects.length) return <EmptyState message="No active projects at the moment." />
  const sorted = [...projects].sort((a, b) => {
    const rank = { delayed: 0, in_progress: 1, not_started: 2 }
    return (rank[a.status] ?? 9) - (rank[b.status] ?? 9)
  })
  return (
    <div className="space-y-3">
      {sorted.map(p => {
        const lead     = getUserById(p.assignedTo)
        const progress = getProjectProgress(p.id)
        const stages   = getStagesForProject(p.id)
        const active   = stages.find(s => s.status === 'in_progress')
        const st       = PROJECT_STATUS_LABEL[p.status] || PROJECT_STATUS_LABEL.not_started
        const overdue  = p.deadline && new Date(p.deadline) < new Date() && p.status !== 'completed'
        return (
          <div key={p.id} className="p-4 bg-slate-50 rounded-xl">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className={`w-2 h-2 rounded-full shrink-0 ${st.dot}`} />
                <span className="text-sm font-semibold text-slate-800 leading-snug">{p.title}</span>
              </div>
              {p.deadline && (
                <span className={`text-xs shrink-0 flex items-center gap-1 ${overdue ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                  <Calendar size={11} />
                  {overdue ? 'Overdue · ' : ''}{format(parseISO(p.deadline), 'MMM d, yyyy')}
                </span>
              )}
            </div>
            <ProgressBar value={progress} size="sm" />
            <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
              {active && <span className="text-brand-600 font-medium">▶ {active.stageName}</span>}
              {lead && (
                <div className="flex items-center gap-1.5 ml-auto">
                  <Avatar user={lead} size="xs" />
                  <span>{lead.name}</span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Modal content: Active Protocols ──────────────────────────────────────────
function ProtocolList({ protocols, getUserById }) {
  if (!protocols.length) return <EmptyState message="No active protocols on file." />
  const today = new Date()
  const sorted = [...protocols].sort((a, b) => {
    if (!a.expirationDate) return 1
    if (!b.expirationDate) return -1
    return new Date(a.expirationDate) - new Date(b.expirationDate)
  })
  return (
    <div className="space-y-3">
      {sorted.map(p => {
        const pi = getUserById(p.piId)
        const daysLeft = p.expirationDate ? differenceInDays(new Date(p.expirationDate), today) : null
        const expiringSoon = daysLeft !== null && daysLeft <= 60
        return (
          <div key={p.id} className={`p-4 rounded-xl border ${expiringSoon ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-transparent'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 leading-snug">{p.title}</p>
                {p.protocolNumber && <p className="text-xs text-slate-400 mt-0.5">#{p.protocolNumber}</p>}
                {p.ethicsCommittee && <p className="text-xs text-slate-500 mt-0.5">{p.ethicsCommittee}</p>}
                {pi && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Avatar user={pi} size="xs" />
                    <span className="text-xs text-slate-400">{pi.name}</span>
                  </div>
                )}
              </div>
              {p.expirationDate && (
                <div className="text-right shrink-0">
                  <p className={`text-xs font-medium ${expiringSoon ? 'text-amber-600' : 'text-slate-400'}`}>
                    {expiringSoon ? `⚠ Expires in ${daysLeft}d` : `Expires ${format(parseISO(p.expirationDate), 'MMM d, yyyy')}`}
                  </p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Publications chart ────────────────────────────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December']

function PublicationsChart({ projects }) {
  const [year,          setYear]          = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(null)

  const byMonth = MONTHS.map((_, i) => {
    const papers = projects.filter(p => {
      const dateStr = p.publicationDate || p.updatedAt
      if (!dateStr) return false
      const d = new Date(dateStr)
      return d.getFullYear() === year && d.getMonth() === i
    })
    return {
      papers,
      published: papers.filter(p => p.pubStatus === 'published').length,
      accepted:  papers.filter(p => p.pubStatus === 'accepted').length,
      total:     papers.length,
    }
  })

  const maxVal    = Math.max(...byMonth.map(m => m.total), 1)
  const totalYear = byMonth.reduce((s, m) => s + m.total, 0)
  const selected  = selectedMonth !== null ? byMonth[selectedMonth] : null

  function toggleMonth(i) { setSelectedMonth(prev => prev === i ? null : i) }
  function changeYear(delta) { setYear(y => y + delta); setSelectedMonth(null) }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">Publications by Month</h2>
          <p className="text-xs text-slate-400 mt-0.5">{totalYear} paper{totalYear !== 1 ? 's' : ''} in {year}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3 mr-4">
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-3 h-3 rounded-sm bg-green-400 inline-block" /> Published
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-3 h-3 rounded-sm bg-emerald-300 inline-block" /> Accepted
            </span>
          </div>
          <button onClick={() => changeYear(-1)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold text-slate-700 w-10 text-center">{year}</span>
          <button onClick={() => changeYear(1)} disabled={year >= new Date().getFullYear()}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-30">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="flex items-end gap-2" style={{ height: '152px' }}>
        {byMonth.map((m, i) => {
          const isSelected = selectedMonth === i
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div style={{ height: '20px' }} className="flex items-end justify-center">
                {m.total > 0 && (
                  <span className={`text-xs font-semibold ${isSelected ? 'text-brand-600' : 'text-slate-600'}`}>{m.total}</span>
                )}
              </div>
              <div className="w-full flex flex-col justify-end" style={{ height: '112px' }}>
                {m.total > 0 ? (
                  <button onClick={() => toggleMonth(i)}
                    className={`w-full rounded-t-md overflow-hidden flex flex-col justify-end transition-all ${isSelected ? 'ring-2 ring-brand-400 ring-offset-1' : 'hover:opacity-80'}`}
                    style={{ height: `${Math.max((m.total / maxVal) * 100, 8)}%` }}>
                    <div className="w-full bg-emerald-300" style={{ height: `${m.accepted / m.total * 100}%` }} />
                    <div className="w-full bg-green-400"   style={{ height: `${m.published / m.total * 100}%` }} />
                  </button>
                ) : (
                  <div className="w-full rounded-t-md bg-slate-100" style={{ height: '6px' }} />
                )}
              </div>
              <span className={`text-xs ${isSelected ? 'text-brand-600 font-semibold' : 'text-slate-400'}`}>{MONTHS[i]}</span>
            </div>
          )
        })}
      </div>

      {selected && selected.total > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            {MONTHS_FULL[selectedMonth]} {year} · {selected.total} paper{selected.total !== 1 ? 's' : ''}
          </p>
          <div className="space-y-2">
            {selected.papers.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <span className={`w-2 h-2 rounded-full shrink-0 ${p.pubStatus === 'published' ? 'bg-green-400' : 'bg-emerald-300'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 leading-snug truncate">{p.title}</p>
                  <p className="text-xs text-slate-400 capitalize mt-0.5">{p.pubStatus}</p>
                </div>
                {p.fileUrl && (
                  <button onClick={() => openPdf(p)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors shrink-0">
                    <FileText size={13} /> PDF
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main dashboard ─────────────────────────────────────────────────────────────
export default function PIDashboard() {
  const { projects, submissions, protocols, getProjectProgress, getStagesForProject, getUserById, dispatch } = useData()
  const { user } = useAuth()
  const [activeModal, setActiveModal] = useState(null)

  const today = new Date()

  const publishedProjects  = projects.filter(p => p.pubStatus === 'accepted' || p.pubStatus === 'published')
  const underReviewProjects = projects.filter(p => ['submitted','under_review','revision'].includes(p.pubStatus))
  const inProgressProjects  = projects.filter(p => p.status !== 'completed')
  const activeProtocols     = protocols.filter(p => !p.expirationDate || new Date(p.expirationDate) >= today)

  const expiringCount = protocols.filter(p => {
    if (!p.expirationDate) return false
    const d = differenceInDays(new Date(p.expirationDate), today)
    return d >= 0 && d <= 60
  }).length

  const cards = [
    {
      key:         'published',
      label:       'Accepted / Published',
      count:       publishedProjects.length,
      icon:        Trophy,
      bg:          'bg-emerald-50',
      border:      'border-emerald-200',
      hover:       'hover:bg-emerald-100',
      iconColor:   'text-emerald-500',
      countColor:  'text-emerald-700',
      sub:         publishedProjects.length === 1 ? '1 research output' : `${publishedProjects.length} research outputs`,
    },
    {
      key:         'review',
      label:       'Under Review',
      count:       underReviewProjects.length,
      icon:        Clock,
      bg:          'bg-indigo-50',
      border:      'border-indigo-200',
      hover:       'hover:bg-indigo-100',
      iconColor:   'text-indigo-500',
      countColor:  'text-indigo-700',
      sub:         'In journal pipeline',
    },
    {
      key:         'progress',
      label:       'In Progress',
      count:       inProgressProjects.length,
      icon:        FlaskConical,
      bg:          'bg-amber-50',
      border:      'border-amber-200',
      hover:       'hover:bg-amber-100',
      iconColor:   'text-amber-500',
      countColor:  'text-amber-700',
      sub:         'Active research',
    },
    {
      key:         'protocols',
      label:       'Active Protocols',
      count:       activeProtocols.length,
      icon:        Shield,
      bg:          expiringCount > 0 ? 'bg-orange-50' : 'bg-violet-50',
      border:      expiringCount > 0 ? 'border-orange-300' : 'border-violet-200',
      hover:       expiringCount > 0 ? 'hover:bg-orange-100' : 'hover:bg-violet-100',
      iconColor:   expiringCount > 0 ? 'text-orange-500' : 'text-violet-500',
      countColor:  expiringCount > 0 ? 'text-orange-700' : 'text-violet-700',
      sub:         expiringCount > 0 ? `⚠ ${expiringCount} expiring within 60 days` : 'IRB approved',
    },
  ]

  return (
    <Layout>
      {/* Header */}
      <div className="px-6 pt-8 pb-6 border-b border-slate-100">
        <h1 className="text-2xl font-bold text-slate-800">
          Good morning, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-slate-400 text-sm mt-1">Here's your research overview</p>
      </div>

      {/* 2×2 card grid */}
      <div className="p-6 grid grid-cols-2 gap-4 max-w-4xl">

        {/* Accepted / Published */}
        <button onClick={() => setActiveModal('published')}
          className="bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-2xl p-6 text-left transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Accepted / Published</span>
            <Trophy size={18} className="text-emerald-400" />
          </div>
          <div className="text-5xl font-bold text-emerald-700 leading-none mb-1">{publishedProjects.length}</div>
          <div className="text-xs text-slate-400 mb-4">
            Research outputs
            {(() => {
              const dates = publishedProjects.map(p => p.publicationDate || p.updatedAt).filter(Boolean).sort()
              if (!dates.length) return null
              return <span className="ml-1">· since {format(parseISO(dates[0]), 'MMM yyyy')}</span>
            })()}
          </div>
          <div className="border-t border-emerald-200 pt-3 flex flex-wrap gap-2">
            {[['published','Published','bg-green-100 text-green-700'],['accepted','Accepted','bg-emerald-100 text-emerald-700']].map(([status, label, cls]) => {
              const n = publishedProjects.filter(p => p.pubStatus === status).length
              return n > 0 ? <span key={status} className={`px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}>{n} {label}</span> : null
            })}
            {publishedProjects.length === 0 && <span className="text-xs text-slate-400 italic">None yet</span>}
          </div>
        </button>

        {/* Under Review */}
        <button onClick={() => setActiveModal('review')}
          className="bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-2xl p-6 text-left transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Under Review</span>
            <Clock size={18} className="text-indigo-400" />
          </div>
          <div className="text-5xl font-bold text-indigo-700 leading-none mb-1">{underReviewProjects.length}</div>
          <div className="text-xs text-slate-400 mb-4">In journal pipeline</div>
          <div className="border-t border-indigo-200 pt-3 flex flex-wrap gap-2">
            {[['revision','Revision','bg-orange-100 text-orange-700'],['under_review','Under Review','bg-amber-100 text-amber-700'],['submitted','Submitted','bg-indigo-100 text-indigo-700']].map(([status, label, cls]) => {
              const n = underReviewProjects.filter(p => p.pubStatus === status).length
              return n > 0 ? <span key={status} className={`px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}>{n} {label}</span> : null
            })}
            {underReviewProjects.length === 0 && <span className="text-xs text-slate-400 italic">None yet</span>}
          </div>
        </button>

        {/* In Progress */}
        <button onClick={() => setActiveModal('progress')}
          className="bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-2xl p-6 text-left transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-amber-600">In Progress</span>
            <FlaskConical size={18} className="text-amber-400" />
          </div>
          <div className="text-5xl font-bold text-amber-700 leading-none mb-1">{inProgressProjects.length}</div>
          <div className="text-xs text-slate-400 mb-4">Active research</div>
          <div className="border-t border-amber-200 pt-3 space-y-2">
            {inProgressProjects.length === 0
              ? <span className="text-xs text-slate-400 italic">No active projects</span>
              : (() => {
                  const byType = {}
                  inProgressProjects.forEach(p => { const t = p.projectType || 'other'; byType[t] = (byType[t] || 0) + 1 })
                  const TYPE_LABEL = { systematic_review:'Systematic Review', case_report:'Case Report', case_series:'Case Series', retrospective:'Retrospective', prospective:'Prospective', rct:'RCT', technical_note:'Technical Note', literature_review:'Literature Review', registry:'Registry', other:'Other' }
                  const total = inProgressProjects.length
                  return Object.entries(byType).sort((a,b) => b[1]-a[1]).map(([type, n]) => (
                    <div key={type} className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 w-32 truncate shrink-0">{TYPE_LABEL[type] || type}</span>
                      <div className="flex-1 h-1.5 bg-amber-200 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(n/total)*100}%` }} />
                      </div>
                      <span className="text-xs text-amber-700 font-medium w-4 text-right">{n}</span>
                    </div>
                  ))
                })()
            }
          </div>
        </button>

        {/* Active Protocols */}
        <button onClick={() => setActiveModal('protocols')}
          className={`${expiringCount > 0 ? 'bg-orange-50 border-orange-300 hover:bg-orange-100' : 'bg-violet-50 border-violet-200 hover:bg-violet-100'} border rounded-2xl p-6 text-left transition-all`}>
          <div className="flex items-center justify-between mb-4">
            <span className={`text-xs font-semibold uppercase tracking-wide ${expiringCount > 0 ? 'text-orange-600' : 'text-violet-600'}`}>Active Protocols</span>
            <Shield size={18} className={expiringCount > 0 ? 'text-orange-400' : 'text-violet-400'} />
          </div>
          <div className={`text-5xl font-bold leading-none mb-1 ${expiringCount > 0 ? 'text-orange-700' : 'text-violet-700'}`}>{activeProtocols.length}</div>
          <div className="text-xs text-slate-400 mb-4">{expiringCount > 0 ? `⚠ ${expiringCount} expiring within 60 days` : 'IRB approved'}</div>
          <div className={`border-t pt-3 space-y-2 ${expiringCount > 0 ? 'border-orange-200' : 'border-violet-200'}`}>
            {activeProtocols.length === 0
              ? <span className="text-xs text-slate-400 italic">No active protocols</span>
              : activeProtocols.slice(0, 3).map(p => {
                  const daysLeft = p.expirationDate ? differenceInDays(new Date(p.expirationDate), today) : null
                  const warn = daysLeft !== null && daysLeft <= 60
                  return (
                    <div key={p.id} className="flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-700 truncate">{p.title}</span>
                      {p.expirationDate && (
                        <span className={`text-xs font-medium shrink-0 ${warn ? 'text-red-500' : 'text-slate-400'}`}>
                          {warn ? `${daysLeft}d left` : format(parseISO(p.expirationDate), 'MMM yyyy')}
                        </span>
                      )}
                    </div>
                  )
                })
            }
            {activeProtocols.length > 3 && <p className="text-xs text-slate-400">+{activeProtocols.length - 3} more</p>}
          </div>
        </button>

      </div>

      {/* Publications chart */}
      <div className="px-6 pb-6 max-w-4xl">
        <PublicationsChart projects={publishedProjects} />
      </div>

      {/* Detail modals */}
      <Modal
        isOpen={activeModal === 'published'}
        onClose={() => setActiveModal(null)}
        title="Accepted / Published"
        size="md"
      >
        <PublishedList projects={publishedProjects} submissions={submissions} getUserById={getUserById} dispatch={dispatch} />
      </Modal>

      <Modal
        isOpen={activeModal === 'review'}
        onClose={() => setActiveModal(null)}
        title="Under Review"
        size="md"
      >
        <ReviewList projects={underReviewProjects} submissions={submissions} getUserById={getUserById} />
      </Modal>

      <Modal
        isOpen={activeModal === 'progress'}
        onClose={() => setActiveModal(null)}
        title="In Progress"
        size="lg"
      >
        <ProgressList
          projects={inProgressProjects}
          getUserById={getUserById}
          getProjectProgress={getProjectProgress}
          getStagesForProject={getStagesForProject}
        />
      </Modal>

      <Modal
        isOpen={activeModal === 'protocols'}
        onClose={() => setActiveModal(null)}
        title="Active Protocols"
        size="md"
      >
        <ProtocolList protocols={activeProtocols} getUserById={getUserById} />
      </Modal>
    </Layout>
  )
}
