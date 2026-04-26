import { FolderOpen, TrendingUp, CheckCircle2, AlertTriangle } from 'lucide-react'

function StatCard({ label, value, icon: Icon, color, bg, delta }) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
        <Icon size={22} style={{ color }} />
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
        {delta !== undefined && (
          <p className="text-xs text-slate-400 mt-1">{delta}</p>
        )}
      </div>
    </div>
  )
}

export default function StatsOverview({ projects }) {
  const total      = projects.length
  const inProgress = projects.filter(p => p.status === 'in_progress').length
  const completed  = projects.filter(p => p.status === 'completed').length
  const delayed    = projects.filter(p => p.status === 'delayed').length

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Total Projects"
        value={total}
        icon={FolderOpen}
        color="#6366f1" bg="bg-brand-50"
        delta="Across all researchers"
      />
      <StatCard
        label="In Progress"
        value={inProgress}
        icon={TrendingUp}
        color="#3b82f6" bg="bg-blue-50"
        delta={`${Math.round((inProgress/total)*100)}% of all projects`}
      />
      <StatCard
        label="Completed"
        value={completed}
        icon={CheckCircle2}
        color="#10b981" bg="bg-emerald-50"
        delta={`${Math.round((completed/total)*100)}% completion rate`}
      />
      <StatCard
        label="Delayed"
        value={delayed}
        icon={AlertTriangle}
        color="#ef4444" bg="bg-red-50"
        delta={delayed > 0 ? 'Needs attention' : 'All on track'}
      />
    </div>
  )
}
