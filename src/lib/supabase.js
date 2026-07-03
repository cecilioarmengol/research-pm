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
  pubStatus:   p.pub_status   || null,
  projectType: p.project_type || null,
  fileUrl:          p.file_url          || null,
  fileName:         p.file_name         || null,
  publicationDate:  p.publication_date  || null,
  createdAt:        p.created_at,
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
  fileUrl:         p.file_url         || null,
  fileName:        p.file_name        || null,
  createdBy:       p.created_by,
  createdAt:       p.created_at,
  updatedAt:       p.updated_at,
})

export const mapUser = u => ({
  id:             u.id,
  email:          u.email,
  name:           u.full_name || u.email?.split('@')[0] || 'Unknown',
  role:           u.role || 'student',
  initials:       u.initials || (u.full_name || '??').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
  orcid:          u.orcid           || '',
  affiliation:    u.affiliation     || '',
  logbookEnabled: u.logbook_enabled || false,
})

export const mapLogbookEntry = e => ({
  id:             e.id,
  userId:         e.user_id,
  weekStart:      e.week_start,
  projectsWorked: e.projects_worked || [],
  projectNotes:   e.project_notes   || {},
  accomplished:   e.accomplished    || '',
  nextWeek:       e.next_week       || '',
  blockers:       e.blockers        || '',
  createdAt:      e.created_at,
  updatedAt:      e.updated_at,
})

export const mapJournal = j => ({
  id:              j.id,
  name:            j.name,
  issn:            j.issn             || '',
  publisher:       j.publisher        || '',
  editorInChief:   j.editor_in_chief  || '',
  country:         j.country          || '',
  impactFactor:    j.impact_factor    != null ? Number(j.impact_factor) : null,
  scimagoQuartile: j.scimago_quartile || null,
  openAccess:      j.open_access      || false,
  apcUsd:          j.apc_usd          != null ? j.apc_usd : null,
  avgReviewWeeks:  j.avg_review_weeks != null ? j.avg_review_weeks : null,
  acceptanceRate:  j.acceptance_rate  != null ? j.acceptance_rate : null,
  submissionUrl:   j.submission_url   || '',
  scope:           j.scope            || '',
  specialtyTags:   j.specialty_tags   || [],
  notes:           j.notes            || '',
  isFavorite:      j.is_favorite      || false,
  createdBy:       j.created_by,
  createdAt:       j.created_at,
  updatedAt:       j.updated_at,
})

export const mapCongress = c => ({
  id:               c.id,
  name:             c.name,
  location:         c.location         || '',
  country:          c.country          || '',
  startDate:        c.start_date       || null,
  endDate:          c.end_date         || null,
  abstractDeadline: c.abstract_deadline || null,
  websiteUrl:       c.website_url      || '',
  specialtyTags:    c.specialty_tags   || [],
  notes:            c.notes            || '',
  createdBy:        c.created_by,
  createdAt:        c.created_at,
  updatedAt:        c.updated_at,
})

export const mapSubmission = s => ({
  id:             s.id,
  projectId:      s.project_id,
  journalName:    s.journal_name,
  submissionDate: s.submission_date || null,
  status:         s.status          || 'submitted',
  decisionDate:   s.decision_date   || null,
  notes:          s.notes           || '',
  createdAt:      s.created_at,
})
