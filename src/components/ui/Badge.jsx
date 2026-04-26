import { STATUS, ROLES } from '../../lib/constants'

export function StatusBadge({ status, size = 'sm' }) {
  const meta = STATUS[status] || STATUS.not_started
  const sz   = size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs'
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${sz}`}
      style={{ backgroundColor: meta.bg, color: meta.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: meta.color }} />
      {meta.label}
    </span>
  )
}

export function RoleBadge({ role }) {
  const meta = ROLES[role] || { label: role, color: 'bg-slate-100 text-slate-600' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${meta.color}`}>
      {meta.label}
    </span>
  )
}

export function StageBadge({ stage }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: stage.bg, color: stage.text }}
    >
      {stage.name}
    </span>
  )
}

export function Tag({ children }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">
      {children}
    </span>
  )
}
