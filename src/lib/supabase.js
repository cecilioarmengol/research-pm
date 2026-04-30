import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const DEMO_MODE = !supabaseUrl || !supabaseKey

export const supabase = DEMO_MODE
  ? null
  : createClient(supabaseUrl, supabaseKey)

// ── Data mappers: Supabase (snake_case) → App (camelCase) ─────────────────────
export const mapProject = p => ({
  id:          p.id,
  title:       p.title,
  description: p.description || '',
  assignedTo:  p.assigned_to,
  createdBy:   p.created_by,
  status:      p.status,
  startDate:   p.start_date,
  deadline:    p.deadline,
  tags:        p.tags || [],
  teamMembers: p.team_members || [],
  createdAt:   p.created_at,
  updatedAt:   p.updated_at,
})

export const mapStage = s => ({
  id:            s.id,
  projectId:     s.project_id,
  stageKey:      s.stage_key,
  stageName:     s.stage_name,
  order:         s.stage_order,
  status:        s.status,
  estimatedDays: s.estimated_days,
  startDate:     s.start_date,
  endDate:       s.end_date,
})

export const mapTask = t => ({
  id:          t.id,
  stageId:     t.stage_id,
  projectId:   t.project_id,
  title:       t.title,
  completed:   t.completed,
  deadline:    t.deadline,
  notes:       t.notes || '',
  completedAt: t.completed_at,
  createdAt:   t.created_at,
})

export const mapComment = c => ({
  id:        c.id,
  projectId: c.project_id,
  userId:    c.user_id,
  content:   c.content,
  createdAt: c.created_at,
})

export const mapProtocol = p => ({
  id:              p.id,
  title:           p.title,
  protocolNumber:  p.protocol_number  || '',
  projectId:       p.project_id       || null,
  piId:            p.pi_id            || null,
  ethicsCommittee: p.ethics_committee || '',
  submissionDate:  p.submission_date  || null,
  expirationDate:  p.expiration_date  || null,
  approvalNumber:  p.approval_number  || '',
  notes:           p.notes            || '',
  createdBy:       p.created_by,
  createdAt:       p.created_at,
  updatedAt:       p.updated_at,
})

export const mapUser = u => ({
  id:          u.id,
  email:       u.email,
  name:        u.full_name || u.email?.split('@')[0] || 'Unknown',
  role:        u.role || 'student',
  initials:    u.initials || (u.full_name || '??').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
  orcid:       u.orcid       || '',
  affiliation: u.affiliation || '',
})
