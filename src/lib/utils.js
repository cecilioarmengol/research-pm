import { format, formatDistanceToNow, isPast, differenceInDays, parseISO } from 'date-fns'
import { STAGES, STATUS, AVATAR_COLORS } from './constants'

export function calculateProgress(stages, tasks) {
  if (!stages || stages.length === 0) return 0
  const stageCount = STAGES.length
  let totalUnits = 0

  stages.forEach(stage => {
    const stageTasks = tasks.filter(t => t.stageId === stage.id)
    if (stage.status === 'completed') {
      totalUnits += 1
    } else if (stage.status === 'in_progress' && stageTasks.length > 0) {
      const done = stageTasks.filter(t => t.completed).length
      totalUnits += done / stageTasks.length
    }
  })

  return Math.round((totalUnits / stageCount) * 100)
}

export function getStatusMeta(status) {
  return STATUS[status] || STATUS.not_started
}

export function getStageMeta(stageKey) {
  return STAGES.find(s => s.key === stageKey) || STAGES[0]
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  try { return format(parseISO(dateStr), 'MMM d, yyyy') } catch { return dateStr }
}

export function formatRelative(dateStr) {
  if (!dateStr) return '—'
  try { return formatDistanceToNow(parseISO(dateStr), { addSuffix: true }) } catch { return dateStr }
}

export function daysUntil(dateStr) {
  if (!dateStr) return null
  try { return differenceInDays(parseISO(dateStr), new Date()) } catch { return null }
}

export function isOverdue(dateStr, status) {
  if (!dateStr || status === 'completed') return false
  try { return isPast(parseISO(dateStr)) } catch { return false }
}

export function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function getAvatarColor(userId) {
  if (!userId) return AVATAR_COLORS[0]
  let hash = 0
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export function uid() {
  return crypto.randomUUID()
}

export function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max)
}
