import { useState } from 'react'
import { Trophy, Clock, FlaskConical, Shield, Calendar, ChevronDown, ChevronUp } from 'lucide-react'
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

// ── Modal content: Accepted / Published ───────────────────────────────────────
function PublishedList({ projects, submissions, getUserById }) {
  if (!projects.length) return <EmptyState message="No accepted or published projects yet." />
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

// ── Main dashboard ─────────────────────────────────────────────────────────────
export default function PIDashboard() {
  const { projects, submissions, protocols, getProjectProgress, getStagesForProject, getUserById } = useData()
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
      <div className="p-6 grid grid-cols-2 gap-4 max-w-xl">
        {cards.map(card => {
          const Icon = card.icon
          return (
            <button
              key={card.key}
              onClick={() => setActiveModal(card.key)}
              className={`${card.bg} ${card.border} ${card.hover} border rounded-2xl p-6 text-left transition-all hover:shadow-md`}
            >
              <Icon size={22} className={`${card.iconColor} mb-4`} />
              <div className={`text-5xl font-bold ${card.countColor} mb-2 leading-none`}>
                {card.count}
              </div>
              <div className="text-sm font-semibold text-slate-700 leading-snug">{card.label}</div>
              <div className="text-xs text-slate-400 mt-1">{card.sub}</div>
            </button>
          )
        })}
      </div>

      {/* Detail modals */}
      <Modal
        isOpen={activeModal === 'published'}
        onClose={() => setActiveModal(null)}
        title="Accepted / Published"
        size="md"
      >
        <PublishedList projects={publishedProjects} submissions={submissions} getUserById={getUserById} />
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
