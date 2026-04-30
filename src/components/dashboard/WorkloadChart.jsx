import { PieChart, Pie, Legend, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { STATUS, STAGES } from '../../lib/constants'
import Avatar from '../ui/Avatar'

// ── Workload per researcher ────────────────────────────────────────────────────
export function WorkloadBar({ projects, users }) {
  // Build from projects so no assignee is ever missed
  const assigneeIds = [...new Set(projects.map(p => p.assignedTo).filter(Boolean))]
  const fromProjects = assigneeIds.map(id => {
    const u = users.find(u => u.id === id) || { id, name: 'Unknown', initials: '?' }
    return {
      user:      u,
      total:     projects.filter(p => p.assignedTo === id).length,
      active:    projects.filter(p => p.assignedTo === id && p.status === 'in_progress').length,
      delayed:   projects.filter(p => p.assignedTo === id && p.status === 'delayed').length,
      completed: projects.filter(p => p.assignedTo === id && p.status === 'completed').length,
    }
  })

  // Also include team members with no projects (show as Available)
  const withNoProjects = users
    .filter(u => !assigneeIds.includes(u.id) && ['student', 'research_fellow', 'pi'].includes(u.role))
    .map(u => ({ user: u, total: 0, active: 0, delayed: 0, completed: 0 }))

  const researchers = [...fromProjects, ...withNoProjects]
    .sort((a, b) => b.active - a.active || b.total - a.total)

  const maxTotal = Math.max(...researchers.map(r => r.total), 1)

  if (researchers.length === 0) return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-2">Workload per Researcher</h3>
      <p className="text-sm text-slate-400 text-center py-6">No team members yet</p>
    </div>
  )

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Workload per Researcher</h3>
      <div className="space-y-3">
        {researchers.map(({ user: u, total, active, delayed, completed }) => (
          <div key={u.id} className="flex items-center gap-3">
            <Avatar user={u} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-700 truncate">{u.name.split(' ')[0]}</span>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {total === 0 && <span className="text-xs text-emerald-500 font-medium">Available</span>}
                  {delayed > 0 && <span className="text-xs text-red-500 font-medium">{delayed} delayed</span>}
                  {active > 0  && <span className="text-xs text-indigo-500 font-medium">{active} active</span>}
                  {total > 0   && <span className="text-xs text-slate-400">{total} total</span>}
                </div>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: total === 0 ? '0%' : `${(total / maxTotal) * 100}%`,
                    backgroundColor: delayed > 0 ? '#f87171' : active > 0 ? '#818cf8' : '#34d399',
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Status distribution pie ───────────────────────────────────────────────────
export function StatusPie({ projects }) {
  const data = [
    { name: 'Not Started', value: projects.filter(p => p.status === 'not_started').length, fill: '#cbd5e1' },
    { name: 'In Progress',  value: projects.filter(p => p.status === 'in_progress').length,  fill: '#818cf8' },
    { name: 'Completed',    value: projects.filter(p => p.status === 'completed').length,    fill: '#34d399' },
    { name: 'Delayed',      value: projects.filter(p => p.status === 'delayed').length,      fill: '#f87171' },
  ].filter(d => d.value > 0)

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-lg text-xs">
        <p className="font-medium text-slate-700">{payload[0].name}</p>
        <p className="text-slate-500">{payload[0].value} project(s)</p>
      </div>
    )
  }

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Status Distribution</h3>
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={65}
            dataKey="value" paddingAngle={3}>
            {data.map((entry, i) => <Cell key={i} fill={entry.fill} stroke="none" />)}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Stage distribution ────────────────────────────────────────────────────────
export function StageDistribution({ stages }) {
  const activeStageCounts = {}
  stages
    .filter(s => s.status === 'in_progress')
    .forEach(s => { activeStageCounts[s.stageKey] = (activeStageCounts[s.stageKey] || 0) + 1 })

  const data = STAGES.map(s => ({
    name: s.name.replace(' ', '\n'),
    shortName: s.name.split(' ')[0],
    value: activeStageCounts[s.key] || 0,
    fill: s.color,
  })).filter(d => d.value > 0)

  if (data.length === 0) return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-2">Active Stages</h3>
      <p className="text-sm text-slate-400 text-center py-8">No projects currently in progress</p>
    </div>
  )

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Active Stages</h3>
      <div className="space-y-2">
        {data.map(d => (
          <div key={d.name} className="flex items-center gap-3">
            <div className="w-24 text-xs text-slate-500 truncate shrink-0">{d.shortName}</div>
            <div className="flex-1 bg-slate-100 rounded-full h-2">
              <div
                className="h-2 rounded-full"
                style={{ width: `${(d.value / Math.max(...data.map(x => x.value))) * 100}%`, backgroundColor: d.fill }}
              />
            </div>
            <div className="text-xs font-semibold text-slate-600 w-4 text-right">{d.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
