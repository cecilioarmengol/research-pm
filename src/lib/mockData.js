import { DEFAULT_TASKS, STAGES } from './constants'

// ─── Users ────────────────────────────────────────────────────────────────────
export const DEMO_USERS = [
  { id: 'u-1', email: 'admin@research.edu',   password: 'demo123', name: 'Dr. Sarah Chen',      role: 'admin',   initials: 'SC' },
  { id: 'u-2', email: 'pi@research.edu',       password: 'demo123', name: 'Dr. Michael Roberts', role: 'pi',      initials: 'MR' },
  { id: 'u-3', email: 'john@research.edu',     password: 'demo123', name: 'John Smith',          role: 'student', initials: 'JS' },
  { id: 'u-4', email: 'emma@research.edu',     password: 'demo123', name: 'Emma Johnson',        role: 'student', initials: 'EJ' },
  { id: 'u-5', email: 'carlos@research.edu',   password: 'demo123', name: 'Carlos Rivera',       role: 'student', initials: 'CR' },
  { id: 'u-6', email: 'aisha@research.edu',    password: 'demo123', name: 'Aisha Patel',         role: 'student', initials: 'AP' },
]

// ─── Helper to build stage array for a project ───────────────────────────────
function buildStages(projectId, completedUpTo, inProgressKey, prefix) {
  return STAGES.map((s, i) => {
    let status = 'pending'
    if (i < completedUpTo) status = 'completed'
    else if (s.key === inProgressKey) status = 'in_progress'
    return {
      id: `${prefix}-s${i}`,
      projectId,
      stageKey: s.key,
      stageName: s.name,
      order: i,
      status,
      estimatedDays: [14, 21, 30, 45, 30, 21, 30, 14][i],
      startDate: null,
      endDate: null,
    }
  })
}

// ─── Helper to build task array for a stage ──────────────────────────────────
function buildTasks(stageId, projectId, stageKey, completedCount) {
  const defs = DEFAULT_TASKS[stageKey] || []
  return defs.map((title, i) => ({
    id: `${stageId}-t${i}`,
    stageId,
    projectId,
    title,
    completed: i < completedCount,
    deadline: null,
    notes: '',
    completedAt: i < completedCount ? new Date(Date.now() - (defs.length - i) * 86400000).toISOString() : null,
    createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
  }))
}

// ─── Projects ─────────────────────────────────────────────────────────────────
const rawProjects = [
  {
    id: 'p-1',
    title: 'SR: Minimally Invasive vs Open Surgery in Colorectal Cancer',
    description: 'Systematic review and meta-analysis comparing perioperative and long-term outcomes of minimally invasive (laparoscopic/robotic) versus open surgical approaches for colorectal cancer resection.',
    assignedTo: 'u-3',
    status: 'in_progress',
    startDate: '2024-09-01',
    deadline: '2025-08-31',
    completedUpTo: 3,
    inProgressKey: 'screening',
    inProgressTasksDone: 3,
    prefix: 'p1',
    tags: ['surgery', 'oncology', 'meta-analysis'],
  },
  {
    id: 'p-2',
    title: 'MA: Antibiotic Prophylaxis Duration in Orthopedic Implant Surgery',
    description: 'Meta-analysis evaluating the optimal duration of antibiotic prophylaxis to prevent surgical site infections in patients undergoing orthopedic implant procedures.',
    assignedTo: 'u-4',
    status: 'delayed',
    startDate: '2024-07-15',
    deadline: '2025-04-30',
    completedUpTo: 4,
    inProgressKey: 'data_extraction',
    inProgressTasksDone: 1,
    prefix: 'p2',
    tags: ['orthopedics', 'infection', 'meta-analysis'],
  },
  {
    id: 'p-3',
    title: 'SR: Telehealth Interventions in Chronic Disease Management',
    description: 'Systematic review assessing the effectiveness of telehealth and remote monitoring interventions on outcomes in patients with chronic conditions including diabetes, hypertension, and heart failure.',
    assignedTo: 'u-5',
    status: 'in_progress',
    startDate: '2024-06-01',
    deadline: '2025-05-31',
    completedUpTo: 5,
    inProgressKey: 'analysis',
    inProgressTasksDone: 5,
    prefix: 'p3',
    tags: ['telehealth', 'chronic disease', 'digital health'],
  },
  {
    id: 'p-4',
    title: 'MA: Early vs Late Mobilization in Critically Ill ICU Patients',
    description: 'Meta-analysis comparing clinical outcomes of early versus late mobilization strategies in critically ill patients admitted to intensive care units.',
    assignedTo: 'u-6',
    status: 'not_started',
    startDate: '2025-02-01',
    deadline: '2025-12-31',
    completedUpTo: 0,
    inProgressKey: null,
    inProgressTasksDone: 0,
    prefix: 'p4',
    tags: ['critical care', 'rehabilitation', 'ICU'],
  },
  {
    id: 'p-5',
    title: 'SR: Quality of Life After Bariatric Surgery — 5-Year Follow-Up',
    description: 'Completed systematic review evaluating long-term health-related quality of life outcomes in patients who underwent bariatric surgery, with minimum 5-year follow-up data.',
    assignedTo: 'u-3',
    status: 'completed',
    startDate: '2023-03-01',
    deadline: '2024-06-30',
    completedUpTo: 8,
    inProgressKey: null,
    inProgressTasksDone: 0,
    prefix: 'p5',
    tags: ['bariatric', 'quality of life', 'surgery'],
  },
  {
    id: 'p-6',
    title: 'MA: Surgical Site Infection Prevention Protocols in Abdominal Surgery',
    description: 'Meta-analysis examining the comparative effectiveness of various surgical site infection prevention bundles and protocols in patients undergoing elective abdominal surgery.',
    assignedTo: 'u-4',
    status: 'in_progress',
    startDate: '2024-11-01',
    deadline: '2025-10-31',
    completedUpTo: 3,
    inProgressKey: 'screening',
    inProgressTasksDone: 4,
    prefix: 'p6',
    tags: ['infection prevention', 'surgery', 'SSI'],
  },
]

// ─── Build full state ─────────────────────────────────────────────────────────
export function buildInitialData() {
  const projects = []
  const stages   = []
  const tasks    = []

  rawProjects.forEach(raw => {
    const { id, completedUpTo, inProgressKey, inProgressTasksDone, prefix, ...rest } = raw
    projects.push({
      id,
      ...rest,
      createdBy: 'u-1',
      createdAt: raw.startDate,
      updatedAt: new Date().toISOString(),
    })

    const projectStages = buildStages(id, completedUpTo, inProgressKey, prefix)
    stages.push(...projectStages)

    projectStages.forEach(stage => {
      const defs = DEFAULT_TASKS[stage.stageKey] || []
      let completedCount = 0
      if (stage.status === 'completed') completedCount = defs.length
      else if (stage.status === 'in_progress') completedCount = inProgressTasksDone
      tasks.push(...buildTasks(stage.id, id, stage.stageKey, completedCount))
    })
  })

  return { projects, stages, tasks }
}

// ─── Seed comments ────────────────────────────────────────────────────────────
export const SEED_COMMENTS = [
  {
    id: 'c-1', projectId: 'p-1', userId: 'u-1',
    content: 'Screening is progressing well. Please ensure inter-rater reliability is documented for each disagreement.',
    createdAt: '2025-01-10T09:15:00Z',
  },
  {
    id: 'c-2', projectId: 'p-1', userId: 'u-3',
    content: 'Understood. We have resolved 2 out of 5 disagreements so far. Will update PRISMA diagram once complete.',
    createdAt: '2025-01-10T14:22:00Z',
  },
  {
    id: 'c-3', projectId: 'p-2', userId: 'u-1',
    content: 'This project is behind schedule. Data extraction needs to be completed by end of this month.',
    createdAt: '2025-01-08T10:00:00Z',
  },
  {
    id: 'c-4', projectId: 'p-3', userId: 'u-2',
    content: 'Analysis looks promising. Make sure to include sensitivity analysis excluding high-risk-of-bias studies.',
    createdAt: '2025-01-12T16:30:00Z',
  },
  {
    id: 'c-5', projectId: 'p-5', userId: 'u-1',
    content: 'Congratulations — paper accepted in JAMA Surgery! Great work on this one.',
    createdAt: '2024-06-25T11:00:00Z',
  },
]
