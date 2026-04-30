import { PieChart, Pie, Legend, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { STATUS, STAGES } from '../../lib/constants'
import Avatar from '../ui/Avatar'

const STATUS_DOT = {
  in_progress: { color: '#818cf8', label: 'Active'    },
  delayed:     { color: '#f87171', label: 'Delayed'   },
  completed:   { color: '#34d399', label: 'Completed' },
  not_started: { color: '#cbd5e1', label: 'Not started' },
}

// ── Workload per researcher ────────────────────────────────────────────────────
export function WorkloadBar({ projects, users }) {
  const everyone = users.filter(u => ['student', 'research_fellow', 'pi', 'admin'].includes(u.role))

  const rows = everyone.map(u => ({
    user:     u,
    projects: projects.filter(p => p.assignedTo === u.id),
  })).sort((a, b) => b.projects.length - a.projects.length)

  if (rows.length === 0) return null

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-1">Workload per Researcher</h3>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4">
        {Object.entries(STATUS_DOT).map(([, { color, label }]) => (
          <div key={label} className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
            <span className="text-xs text-slate-400">{label}</span>
          </div>
        ))}
      </div>

      <div className="space-y-2.5">
        {rows.map(({ user: u, projects: ups }) => (
          <div key={u.id} className="flex items-center gap-3">
            <Avatar user={u} size="sm" />
            <span className="text-xs font-medium text-slate-700 w-20 shrink-0 truncate">{u.name.split(' ')[0]}</span>
            <div className="flex flex-wrap gap-1.5 flex-1">
              {ups.length === 0 ? (
                <span className="text-xs text-slate-300 italic">No projects</span>
              ) : (
                ups.map(p => (
                  <span
                    key={p.id}
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: STATUS_DOT[p.status]?.color ?? '#cbd5e1' }}
                    title={p.title}
                  />
                ))
              )}
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
