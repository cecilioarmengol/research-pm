import { PieChart, Pie, Legend, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { STATUS, STAGES } from '../../lib/constants'
import Avatar from '../ui/Avatar'

// ── Workload per researcher ────────────────────────────────────────────────────
export function WorkloadBar({ projects, users }) {
  const assigneeIds = [...new Set(projects.map(p => p.assignedTo).filter(Boolean))]

  const busy = assigneeIds.map(id => {
    const u = users.find(u => u.id === id) || { id, name: 'Unknown', initials: '?', role: 'student' }
    return {
      user:    u,
      active:  projects.filter(p => p.assignedTo === id && p.status === 'in_progress').length,
      delayed: projects.filter(p => p.assignedTo === id && p.status === 'delayed').length,
      total:   projects.filter(p => p.assignedTo === id).length,
    }
  }).sort((a, b) => b.active - a.active || b.delayed - a.delayed)

  const available = users.filter(u =>
    !assigneeIds.includes(u.id) &&
    ['student', 'research_fellow', 'pi'].includes(u.role)
  )

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Workload per Researcher</h3>

      {/* Active researchers — chip grid */}
      {busy.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {busy.map(({ user: u, active, delayed, total }) => {
            const color = delayed > 0 ? 'border-red-200 bg-red-50'
                        : active  > 0 ? 'border-indigo-200 bg-indigo-50'
                        : 'border-slate-200 bg-slate-50'
            const badge = delayed > 0 ? 'bg-red-400'
                        : active  > 0 ? 'bg-indigo-400'
                        : 'bg-emerald-400'
            return (
              <div key={u.id} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border ${color}`} title={`${u.name} — ${active} active, ${total} total`}>
                <Avatar user={u} size="xs" />
                <span className="text-xs font-medium text-slate-700">{u.name.split(' ')[0]}</span>
                <span className={`text-xs font-bold text-white px-1.5 py-0.5 rounded-full ${badge}`}>
                  {total}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Available — compact avatar row */}
      {available.length > 0 && (
        <div className="border-t border-slate-100 pt-3">
          <p className="text-xs text-slate-400 mb-2">Available</p>
          <div className="flex flex-wrap gap-1.5">
            {available.map(u => (
              <div key={u.id} title={u.name}>
                <Avatar user={u} size="sm" />
              </div>
            ))}
          </div>
        </div>
      )}

      {busy.length === 0 && available.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-4">No team members yet</p>
      )}
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
