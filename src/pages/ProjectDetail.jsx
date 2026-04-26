import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Trash2, Calendar, User, Users, Tag as TagIcon, Download } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/layout/Layout'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import ProgressBar from '../components/ui/ProgressBar'
import { StatusBadge, Tag } from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import StageTimeline from '../components/project/StageTimeline'
import TaskList from '../components/project/TaskList'
import CommentSection from '../components/project/CommentSection'
import ProjectForm from '../components/project/ProjectForm'
import { formatDate, isOverdue, daysUntil } from '../lib/utils'

function InfoRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={14} className="text-slate-500" />
      </div>
      <div>
        <p className="text-xs text-slate-400 font-medium mb-0.5">{label}</p>
        <div className="text-sm text-slate-800">{children}</div>
      </div>
    </div>
  )
}

function exportCSV(project, stages, tasks, users) {
  const assignee = users.find(u => u.id === project.assignedTo)
  const rows = [
    ['Project', 'Stage', 'Task', 'Completed', 'Deadline'],
    ...stages.flatMap(stage =>
      tasks
        .filter(t => t.stageId === stage.id)
        .map(t => [project.title, stage.stageName, t.title, t.completed ? 'Yes' : 'No', t.deadline || ''])
    ),
  ]
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `${project.title.slice(0, 40).replace(/[^a-z0-9]/gi, '_')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function ProjectDetail() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const { user }   = useAuth()
  const {
    getProjectById, getProjectProgress, getUserById,
    getStagesForProject, tasks, users, dispatch,
  } = useData()

  const [showEdit, setShowEdit]       = useState(false)
  const [showDelete, setShowDelete]   = useState(false)

  const project  = getProjectById(id)
  if (!project) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-96 text-slate-400">
          <p className="text-xl font-semibold mb-2">Project not found</p>
          <Link to="/projects" className="text-brand-500 hover:underline text-sm">← Back to Projects</Link>
        </div>
      </Layout>
    )
  }

  const progress  = getProjectProgress(id)
  const assignee  = getUserById(project.assignedTo)
  const creator   = getUserById(project.createdBy)
  const stages    = getStagesForProject(id)
  const projTasks = tasks.filter(t => t.projectId === id)
  const overdue   = isOverdue(project.deadline, project.status)
  const days      = daysUntil(project.deadline)

  const canAdmin  = user?.role === 'admin'
  const canEdit   = canAdmin || user?.id === project.assignedTo || (project.teamMembers || []).includes(user?.id)

  function handleDelete() {
    dispatch({ type: 'DELETE_PROJECT', payload: { id } })
    navigate('/projects')
  }

  const totalTasks = projTasks.length
  const doneTasks  = projTasks.filter(t => t.completed).length
  const activeStages = stages.filter(s => s.status === 'in_progress').length
  const doneStages   = stages.filter(s => s.status === 'completed').length

  return (
    <Layout>
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link to="/projects" className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-slate-900 leading-tight">{project.title}</h1>
                <StatusBadge status={project.status} size="lg" />
                {overdue && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                    OVERDUE
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Last updated {formatDate(project.updatedAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary" size="sm" icon={Download}
              onClick={() => exportCSV(project, stages, projTasks, users)}
            >
              Export CSV
            </Button>
            {canEdit && (
              <Button variant="secondary" size="sm" icon={Edit2} onClick={() => setShowEdit(true)}>
                Edit
              </Button>
            )}
            {canAdmin && (
              <Button variant="danger" size="sm" icon={Trash2} onClick={() => setShowDelete(true)}>
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 max-w-[1400px] space-y-6">
        {/* Overview row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Progress card */}
          <div className="lg:col-span-2 card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-700">Overall Progress</h2>
              <span className="text-2xl font-bold text-slate-900">{progress}%</span>
            </div>
            <ProgressBar value={progress} size="lg" showLabel={false} />

            <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-slate-100">
              {[
                { label: 'Stages Done',   value: `${doneStages}/${stages.length}` },
                { label: 'Tasks Done',    value: `${doneTasks}/${totalTasks}` },
                { label: overdue ? 'Days Overdue' : 'Days Left',
                  value: days !== null ? Math.abs(days) : '—',
                  red: overdue },
              ].map(({ label, value, red }) => (
                <div key={label} className="text-center">
                  <p className={`text-xl font-bold ${red ? 'text-red-500' : 'text-slate-800'}`}>{value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Info card */}
          <div className="card p-5 space-y-4">
            <InfoRow icon={User} label="Project Lead">
              {assignee ? (
                <div className="flex items-center gap-2">
                  <Avatar user={assignee} size="xs" />
                  <span>{assignee.name}</span>
                </div>
              ) : 'Unassigned'}
            </InfoRow>

            {/* Team members */}
            {(project.teamMembers || []).length > 0 && (
              <InfoRow icon={Users} label="Team Members">
                <div className="space-y-1.5 mt-1">
                  {project.teamMembers.map(memberId => {
                    const member = getUserById(memberId)
                    if (!member) return null
                    return (
                      <div key={memberId} className="flex items-center gap-2">
                        <Avatar user={member} size="xs" />
                        <span>{member.name}</span>
                      </div>
                    )
                  })}
                </div>
              </InfoRow>
            )}

            <InfoRow icon={Calendar} label="Start Date">{formatDate(project.startDate)}</InfoRow>
            <InfoRow icon={Calendar} label="Deadline">
              <span className={overdue ? 'text-red-600 font-semibold' : ''}>
                {formatDate(project.deadline)}
                {overdue && ' (Overdue)'}
              </span>
            </InfoRow>
            {project.tags?.length > 0 && (
              <InfoRow icon={TagIcon} label="Tags">
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {project.tags.map(t => <Tag key={t}>{t}</Tag>)}
                </div>
              </InfoRow>
            )}
          </div>
        </div>

        {project.description && (
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Description</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{project.description}</p>
          </div>
        )}

        {/* Stage pipeline */}
        <StageTimeline project={project} stages={stages} />

        {/* Tasks + Comments grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <TaskList project={project} stages={stages} />
          </div>
          <div>
            <CommentSection projectId={id} />
          </div>
        </div>
      </div>

      {/* Edit modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Project" size="lg">
        <ProjectForm initial={project} onClose={() => setShowEdit(false)} />
      </Modal>

      {/* Delete modal */}
      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Delete Project" size="sm">
        <p className="text-sm text-slate-600 mb-6">
          Are you sure you want to permanently delete <strong>{project.title}</strong>?
          All stages, tasks, and comments will be removed. This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowDelete(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete Project</Button>
        </div>
      </Modal>
    </Layout>
  )
}
