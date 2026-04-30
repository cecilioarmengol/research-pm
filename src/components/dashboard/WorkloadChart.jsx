import { PieChart, Pie, Legend, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { STATUS, STAGES } from '../../lib/constants'
import Avatar from '../ui/Avatar'
import { StatusBadge } from '../ui/Badge'

// ── Workload per researcher ────────────────────────────────────────────────────
export function WorkloadBar({ projects, users }) {
  const rows = users
    .filter(u => ['student', 'research_fellow', 'pi', 'admin'].includes(u.role))
    .map(u => ({ user: u, projects: projects.filter(p => p.assignedTo === u.id) }))
    .filter(r => r.projects.length > 0)
    .sort((a, b) => b.projects.length - a.projects.length)

  if (rows.length === 0) return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-2">Team Assignments</h3>
      <p className="text-sm text-slate-400 text-center py-4">No projects assigned yet</p>
    </div>
  )

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Team Assignments</h3>
      <div className="space-y-3">
        {rows.map(({ user: u, projects: ups }) => (
          <div key={u.id} className="flex gap-3">
            <Avatar user={u} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-700 mb-1">{u.name}</p>
              <div className="space-y-1">
                {ups.map(p => (
                  <div key={p.id} className="flex items-center justify-between gap-2">
                    <p className="text-xs text-slate-500 truncate">{p.title}</p>
                    <StatusBadge status={p.status} />
                  </div>
                ))}
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
  const total = projects.length
  const data = [
    { name: 'Not Started', value: projects.filter(p => p.status === 'not_started').length, fill: '#cbd5e1' },
    { name: 'In Progress',  value: projects.filter(p => p.status === 'in_progress').length,  fill: '#818cf8' },
    { name: 'Completed',    value: projects.filter(p => p.status === 'completed').length,    fill: '#34d399' },
    { name: 'Delayed',      value: projects.filter(p => p.status === 'delayed').length,      fill: '#f87171' },
  ].filter(d => d.value > 0)

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const pct = total ? Math.round((payload[0].value / total) * 100) : 0
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-lg text-xs">
        <p className="font-medium text-slate-700">{payload[0].name}</p>
        <p className="text-slate-500">{payload[0].value} project{payload[0].value !== 1 ? 's' : ''} · {pct}%</p>
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
        </PieChart>
      </ResponsiveContainer>

      {/* Legend with counts and percentages */}
      <div className="space-y-1.5 mt-2">
        {data.map(d => {
          const pct = total ? Math.round((d.value / total) * 100) : 0
          return (
            <div key={d.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
                <span className="text-slate-600">{d.name}</span>
              </div>
              <span className="font-medium text-slate-700">{d.value} <span className="text-slate-400 font-normal">({pct}%)</span></span>
            </div>
          )
        })}
      </div>
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
