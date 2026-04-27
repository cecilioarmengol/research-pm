import { Link } from 'react-router-dom'
import { Plus, AlertTriangle, ArrowRight, Calendar } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/layout/Layout'
import Header from '../components/layout/Header'
import Button from '../components/ui/Button'
import ProgressBar from '../components/ui/ProgressBar'
import { StatusBadge, Tag } from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import StatsOverview from '../components/dashboard/StatsOverview'
import GanttChart from '../components/dashboard/GanttChart'
import { WorkloadBar, StatusPie, StageDistribution } from '../components/dashboard/WorkloadChart'
import { formatDate, isOverdue, daysUntil } from '../lib/utils'

function ProjectMiniCard({ project }) {
  const { getProjectProgress, getUserById } = useData()
  const progress = getProjectProgress(project.id)
  const assignee = getUserById(project.assignedTo)
  const overdue  = isOverdue(project.deadline, project.status)
  const days     = daysUntil(project.deadline)

  return (
    <Link
      to={`/projects/${project.id}`}
      className={`block card p-4 hover:shadow-md transition-all hover:-translate-y-0.5 group
        ${overdue ? 'ring-1 ring-red-200' : ''}`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="text-sm font-semibold text-slate-800 leading-tight group-hover:text-brand-600 line-clamp-2 flex-1">
          {project.title}
        </h3>
        <StatusBadge status={project.status} />
      </div>

      <ProgressBar value={progress} size="sm" />

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <Avatar user={assignee} size="xs" />
          <span className="text-xs text-slate-500">{assignee?.name?.split(' ')[0] ?? 'Unassigned'}</span>
        </div>
        <div className={`flex items-center gap-1 text-xs ${overdue ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
          {overdue && <AlertTriangle size={11} />}
          <Calendar size={11} />
          <span>{overdue ? 'Overdue' : days !== null ? `${days}d left` : formatDate(project.deadline)}</span>
        </div>
      </div>

      {project.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {project.tags.slice(0, 2).map(t => <Tag key={t}>{t}</Tag>)}
        </div>
      )}
    </Link>
  )
}

function DelayedAlert({ projects }) {
  const delayed = projects.filter(p => p.status === 'delayed')
  if (!delayed.length) return null

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={16} className="text-red-500" />
        <h3 className="text-sm font-semibold text-red-800">Delayed Projects — Action Required</h3>
      </div>
      <div className="space-y-2">
        {delayed.map(p => (
          <Link
            key={p.id}
            to={`/projects/${p.id}`}
            className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5 hover:bg-red-50 transition-colors group"
          >
            <span className="text-sm text-slate-700 font-medium group-hover:text-red-700 truncate">
              {p.title.split(':').slice(-1)[0].trim()}
            </span>
            <ArrowRight size={14} className="text-slate-400 shrink-0 ml-2" />
          </Link>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { projects, stages, users } = useData()
  const { user } = useAuth()

  const visibleProjects = ['student', 'research_fellow'].includes(user?.role)
    ? projects.filter(p => p.assignedTo === user.id || (p.teamMembers || []).includes(user.id))
    : projects

  return (
    <Layout>
      <Header
        title="Dashboard"
        subtitle={`Welcome back, ${user?.name?.split(' ')[0]} — ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`}
        actions={
          ['admin', 'pi', 'research_fellow'].includes(user?.role) && (
            <Link to="/projects">
              <Button icon={Plus} size="sm">New Project</Button>
            </Link>
          )
        }
      />

      <div className="p-6 space-y-6 max-w-[1600px]">
        {/* Stats */}
        <StatsOverview projects={visibleProjects} />

        {/* Delayed alert */}
        <DelayedAlert projects={visibleProjects} />

        {/* Main grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Project cards */}
          <div className="xl:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-800">
                {['student', 'research_fellow'].includes(user?.role) ? 'Your Projects' : 'All Projects'}
              </h2>
              <Link to="/projects" className="text-sm text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1">
                View all <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {visibleProjects.slice(0, 6).map(p => (
                <ProjectMiniCard key={p.id} project={p} />
              ))}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            <StatusPie projects={visibleProjects} />
            <StageDistribution stages={stages.filter(s => visibleProjects.some(p => p.id === s.projectId))} />
            {!['student', 'research_fellow'].includes(user?.role) && (
              <WorkloadBar projects={visibleProjects} users={users} />
            )}
          </div>
        </div>

        {/* Gantt */}
        <GanttChart projects={visibleProjects} />
      </div>
    </Layout>
  )
}
