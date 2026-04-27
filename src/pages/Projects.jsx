import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Filter, Trash2, Edit2, ArrowUpRight, Calendar } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/layout/Layout'
import Header from '../components/layout/Header'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import ProgressBar from '../components/ui/ProgressBar'
import { StatusBadge, Tag } from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import ProjectForm from '../components/project/ProjectForm'
import { formatDate, isOverdue } from '../lib/utils'

function ProjectRow({ project, onEdit, onDelete }) {
  const { getProjectProgress, getUserById, getStagesForProject } = useData()
  const { user } = useAuth()
  const progress    = getProjectProgress(project.id)
  const assignee    = getUserById(project.assignedTo)
  const stages      = getStagesForProject(project.id)
  const activeStage = stages.find(s => s.status === 'in_progress')
  const overdue     = isOverdue(project.deadline, project.status)
  const canEdit     = user?.role === 'admin'

  const teamMembers = (project.teamMembers || [])
    .map(id => getUserById(id))
    .filter(Boolean)

  return (
    <div className={`card p-4 hover:shadow-md transition-all group ${overdue ? 'ring-1 ring-red-200' : ''}`}>
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 mb-2">
            <Link
              to={`/projects/${project.id}`}
              className="text-sm font-semibold text-slate-800 hover:text-brand-600 transition-colors leading-tight flex-1"
            >
              {project.title}
            </Link>
            <StatusBadge status={project.status} />
          </div>

          {project.description && (
            <p className="text-xs text-slate-500 mb-3 line-clamp-2">{project.description}</p>
          )}

          <ProgressBar value={progress} size="sm" />

          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500">
            {/* Lead */}
            <div className="flex items-center gap-1.5">
              <Avatar user={assignee} size="xs" />
              <span>{assignee?.name ?? 'Unassigned'}</span>
            </div>

            {/* Team members */}
            {teamMembers.length > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="flex -space-x-1.5">
                  {teamMembers.slice(0, 4).map(m => (
                    <div key={m.id} title={m.name}>
                      <Avatar user={m} size="xs" />
                    </div>
                  ))}
                </div>
                {teamMembers.length > 4 && (
                  <span className="text-slate-400">+{teamMembers.length - 4}</span>
                )}
              </div>
            )}

            {activeStage && (
              <span className="text-brand-600 font-medium">▶ {activeStage.stageName}</span>
            )}
            <div className={`flex items-center gap-1 ${overdue ? 'text-red-500 font-medium' : ''}`}>
              <Calendar size={11} />
              <span>{overdue ? 'Overdue — ' : ''}{formatDate(project.deadline)}</span>
            </div>
            <div className="flex gap-1">
              {project.tags?.slice(0, 3).map(t => <Tag key={t}>{t}</Tag>)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link to={`/projects/${project.id}`}>
            <Button variant="ghost" size="xs" icon={ArrowUpRight} title="Open" />
          </Link>
          {canEdit && (
            <>
              <Button variant="ghost" size="xs" icon={Edit2} onClick={() => onEdit(project)} title="Edit" />
              <Button variant="ghost" size="xs" icon={Trash2} onClick={() => onDelete(project)} title="Delete"
                className="hover:text-red-500" />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Projects() {
  const { projects, dispatch } = useData()
  const { user }               = useAuth()
  const [search, setSearch]    = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showForm, setShowForm]         = useState(false)
  const [editProject, setEditProject]   = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const canCreate = ['admin', 'pi', 'research_fellow'].includes(user?.role)

  const visibleProjects = projects
    .filter(p => ['student', 'research_fellow'].includes(user?.role)
      ? p.assignedTo === user.id || (p.teamMembers || []).includes(user.id)
      : true)
    .filter(p => statusFilter === 'all' || p.status === statusFilter)
    .filter(p => !search || p.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const rank = { delayed: 0, in_progress: 1, not_started: 2, completed: 3 }
      return (rank[a.status] ?? 9) - (rank[b.status] ?? 9)
    })

  function handleDelete(project) {
    dispatch({ type: 'DELETE_PROJECT', payload: { id: project.id } })
    setDeleteConfirm(null)
  }

  const statuses = ['all', 'not_started', 'in_progress', 'completed', 'delayed']
  const statusLabels = { all: 'All', not_started: 'Not Started', in_progress: 'In Progress', completed: 'Completed', delayed: 'Delayed' }

  return (
    <Layout>
      <Header
        title="Projects"
        subtitle={`${visibleProjects.length} project${visibleProjects.length !== 1 ? 's' : ''}`}
        actions={
          canCreate && <Button icon={Plus} size="sm" onClick={() => setShowForm(true)}>New Project</Button>
        }
      />

      <div className="p-6 max-w-5xl">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 flex-1 min-w-48">
            <Search size={15} className="text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search projects…"
              className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none flex-1"
            />
          </div>
          <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1">
            {statuses.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? 'bg-brand-500 text-white'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {statusLabels[s]}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="space-y-3">
          {visibleProjects.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <p className="text-lg font-medium">No projects found</p>
              <p className="text-sm mt-1">Try adjusting your filters{canCreate ? ' or create a new project' : ''}</p>
            </div>
          )}
          {visibleProjects.map(p => (
            <ProjectRow
              key={p.id}
              project={p}
              onEdit={proj => { setEditProject(proj); setShowForm(true) }}
              onDelete={setDeleteConfirm}
            />
          ))}
        </div>
      </div>

      {/* Create / Edit modal */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditProject(null) }}
        title={editProject ? 'Edit Project' : 'Create New Project'}
        size="lg"
      >
        <ProjectForm
          initial={editProject}
          onClose={() => { setShowForm(false); setEditProject(null) }}
        />
      </Modal>

      {/* Delete confirmation */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Project"
        size="sm"
      >
        <p className="text-sm text-slate-600 mb-6">
          Are you sure you want to delete <strong>{deleteConfirm?.title}</strong>?
          This will also delete all stages, tasks, and comments. This cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => handleDelete(deleteConfirm)}>Delete Project</Button>
        </div>
      </Modal>
    </Layout>
  )
}
