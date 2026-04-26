import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts'
import { STATUS, STAGES } from '../../lib/constants'

// ── Workload per researcher ────────────────────────────────────────────────────
export function WorkloadBar({ projects, users }) {
  const students = users.filter(u => u.role === 'student')
  const data = students.map(u => ({
    name: u.name.split(' ').slice(-1)[0], // last name only
    fullName: u.name,
    projects: projects.filter(p => p.assignedTo === u.id).length,
    active: projects.filter(p => p.assignedTo === u.id && p.status === 'in_progress').length,
    delayed: projects.filter(p => p.assignedTo === u.id && p.status === 'delayed').length,
  }))

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    const d = data.find(x => x.name === label)
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg text-xs">
        <p className="font-semibold text-slate-800 mb-1">{d?.fullName}</p>
        <p className="text-slate-600">{payload[0]?.value} total project(s)</p>
      </div>
    )
  }

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Workload per Researcher</h3>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="projects" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.delayed > 0 ? '#fca5a5' : '#a5b4fc'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
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
