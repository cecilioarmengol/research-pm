import { createContext, useContext, useReducer, useEffect, useCallback, useState } from 'react'
import { supabase, DEMO_MODE, mapProject, mapStage, mapTask, mapComment, mapUser, mapProtocol, mapSubmission } from '../lib/supabase'
import { buildInitialData, DEMO_USERS, SEED_COMMENTS } from '../lib/mockData'
import { calculateProgress, uid } from '../lib/utils'
import { DEFAULT_TASKS, STAGES } from '../lib/constants'
import { useAuth } from './AuthContext'

const DataContext = createContext(null)
const STORAGE_KEY = 'rpm_data'

// ── Demo mode (localStorage) ──────────────────────────────────────────────────
function loadDemoState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  const { projects, stages, tasks } = buildInitialData()
  return {
    projects, stages, tasks,
    comments:    SEED_COMMENTS,
    protocols:   [],
    submissions: [],
    users: DEMO_USERS.map(({ password: _pw, ...u }) => u),
  }
}

function demoReducer(state, action) {
  switch (action.type) {
    case 'ADD_PROJECT': {
      const id = uid()
      const projectStages = STAGES.map((s, i) => ({
        id: uid(), projectId: id, stageKey: s.key, stageName: s.name,
        order: i, status: 'pending', estimatedDays: [14,21,30,45,30,21,30,14][i],
        startDate: null, endDate: null,
      }))
      const projectTasks = projectStages.flatMap(stage =>
        (DEFAULT_TASKS[stage.stageKey] || []).map(title => ({
          id: uid(), stageId: stage.id, projectId: id,
          title, completed: false, deadline: null, notes: '', completedAt: null,
          createdAt: new Date().toISOString(),
        }))
      )
      return {
        ...state,
        projects: [...state.projects, { ...action.payload, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
        stages: [...state.stages, ...projectStages],
        tasks: [...state.tasks, ...projectTasks],
      }
    }
    case 'UPDATE_PROJECT':
      return { ...state, projects: state.projects.map(p => p.id === action.payload.id ? { ...p, ...action.payload, updatedAt: new Date().toISOString() } : p) }
    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(p => p.id !== action.payload.id),
        stages:   state.stages.filter(s => s.projectId !== action.payload.id),
        tasks:    state.tasks.filter(t => t.projectId !== action.payload.id),
        comments: state.comments.filter(c => c.projectId !== action.payload.id),
      }
    case 'UPDATE_STAGE': {
      const updatedStages = state.stages.map(s => s.id === action.payload.id ? { ...s, ...action.payload } : s)
      const pStages = updatedStages.filter(s => s.projectId === action.payload.projectId)
      let status = 'not_started'
      if (pStages.every(s => s.status === 'completed')) status = 'completed'
      else if (pStages.some(s => s.status === 'in_progress' || s.status === 'completed')) status = 'in_progress'
      return {
        ...state,
        stages: updatedStages,
        projects: state.projects.map(p => p.id === action.payload.projectId
          ? { ...p, status: p.status === 'delayed' ? 'delayed' : status, updatedAt: new Date().toISOString() } : p),
      }
    }
    case 'TOGGLE_TASK':
      return { ...state, tasks: state.tasks.map(t => t.id === action.payload.taskId ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : null } : t) }
    case 'UPDATE_TASK':
      return { ...state, tasks: state.tasks.map(t => t.id === action.payload.id ? { ...t, ...action.payload } : t) }
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, { id: uid(), completed: false, completedAt: null, createdAt: new Date().toISOString(), ...action.payload }] }
    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload.id) }
    case 'ADD_COMMENT':
      return { ...state, comments: [...state.comments, { id: uid(), createdAt: new Date().toISOString(), ...action.payload }] }
    case 'DELETE_COMMENT':
      return { ...state, comments: state.comments.filter(c => c.id !== action.payload.id) }
    case 'ADD_PROTOCOL':
      return { ...state, protocols: [...(state.protocols || []), { id: uid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...action.payload }] }
    case 'UPDATE_PROTOCOL':
      return { ...state, protocols: (state.protocols || []).map(p => p.id === action.payload.id ? { ...p, ...action.payload, updatedAt: new Date().toISOString() } : p) }
    case 'DELETE_PROTOCOL':
      return { ...state, protocols: (state.protocols || []).filter(p => p.id !== action.payload.id) }
    case 'UPDATE_PUB_STATUS':
      return { ...state, projects: state.projects.map(p => p.id === action.payload.id ? { ...p, pubStatus: action.payload.pubStatus } : p) }
    case 'ADD_SUBMISSION':
      return { ...state, submissions: [...(state.submissions || []), { id: uid(), createdAt: new Date().toISOString(), ...action.payload }] }
    case 'UPDATE_SUBMISSION':
      return { ...state, submissions: (state.submissions || []).map(s => s.id === action.payload.id ? { ...s, ...action.payload } : s) }
    case 'DELETE_SUBMISSION':
      return { ...state, submissions: (state.submissions || []).filter(s => s.id !== action.payload.id) }
    case 'ADD_USER':
      return { ...state, users: [...state.users, { id: uid(), ...action.payload }] }
    case 'UPDATE_USER':
      return { ...state, users: state.users.map(u => u.id === action.payload.id ? { ...u, ...action.payload } : u) }
    case 'DELETE_USER':
      return { ...state, users: state.users.filter(u => u.id !== action.payload.id) }
    default: return state
  }
}

// ── Supabase mode ─────────────────────────────────────────────────────────────
function useSupabaseData(user) {
  const [projects,     setProjects]     = useState([])
  const [stages,       setStages]       = useState([])
  const [tasks,        setTasks]        = useState([])
  const [comments,     setComments]     = useState([])
  const [protocols,   setProtocols]   = useState([])
  const [submissions, setSubmissions] = useState([])
  const [users,        setUsers]        = useState([])
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    if (!user) return
    loadAll()

    // Real-time subscriptions
    const channel = supabase.channel('realtime-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' },      () => loadProjects())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_stages' },() => loadStages())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' },         () => loadTasks())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' },      () => loadComments())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'protocols' },          () => loadProtocols())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'journal_submissions' },() => loadSubmissions())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' },           () => loadUsers())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user])

  async function loadAll() {
    setLoading(true)
    await Promise.all([loadProjects(), loadStages(), loadTasks(), loadComments(), loadProtocols(), loadSubmissions(), loadUsers()])
    setLoading(false)
  }

  async function loadProjects() {
    const { data } = await supabase.from('projects').select('*').order('created_at')
    if (data) setProjects(data.map(mapProject))
  }
  async function loadStages() {
    const { data } = await supabase.from('project_stages').select('*').order('stage_order')
    if (data) setStages(data.map(mapStage))
  }
  async function loadTasks() {
    const { data } = await supabase.from('tasks').select('*').order('created_at')
    if (data) setTasks(data.map(mapTask))
  }
  async function loadComments() {
    const { data } = await supabase.from('comments').select('*').order('created_at')
    if (data) setComments(data.map(mapComment))
  }
  async function loadProtocols() {
    const { data } = await supabase.from('protocols').select('*').order('created_at')
    if (data) setProtocols(data.map(mapProtocol))
  }
  async function loadSubmissions() {
    const { data } = await supabase.from('journal_submissions').select('*').order('created_at', { ascending: false })
    if (data) setSubmissions(data.map(mapSubmission))
  }
  async function loadUsers() {
    const { data } = await supabase.from('profiles').select('*')
    if (data) setUsers(data.map(mapUser))
  }

  // ── Supabase CRUD ────────────────────────────────────────────────────────────
  async function dispatch(action) {
    switch (action.type) {

      case 'ADD_PROJECT': {
        const { data: proj, error } = await supabase.from('projects').insert({
          title: action.payload.title, description: action.payload.description,
          assigned_to: action.payload.assignedTo || null,
          created_by: user.id, status: action.payload.status || 'not_started',
          start_date: action.payload.startDate || null,
          deadline: action.payload.deadline || null,
          tags: action.payload.tags || [],
          team_members: action.payload.teamMembers || [],
        }).select().single()
        if (error || !proj) return

        // Insert all 8 stages
        const stageRows = STAGES.map((s, i) => ({
          project_id: proj.id, stage_key: s.key, stage_name: s.name,
          stage_order: i, status: 'pending',
          estimated_days: [14,21,30,45,30,21,30,14][i],
        }))
        const { data: createdStages } = await supabase.from('project_stages').insert(stageRows).select()

        // Insert default tasks for each stage
        if (createdStages) {
          const taskRows = createdStages.flatMap(stage =>
            (DEFAULT_TASKS[stage.stage_key] || []).map(title => ({
              stage_id: stage.id, project_id: proj.id,
              title, completed: false,
            }))
          )
          if (taskRows.length) await supabase.from('tasks').insert(taskRows)
        }
        await loadAll()
        break
      }

      case 'UPDATE_PROJECT': {
        const { id, title, description, assignedTo, status, startDate, deadline, tags, teamMembers } = action.payload
        await supabase.from('projects').update({
          title, description,
          assigned_to: assignedTo || null,
          status, start_date: startDate || null,
          deadline: deadline || null, tags: tags || [],
          team_members: teamMembers || [],
          updated_at: new Date().toISOString(),
        }).eq('id', id)
        await loadProjects()
        break
      }

      case 'DELETE_PROJECT':
        await supabase.from('projects').delete().eq('id', action.payload.id)
        await loadAll()
        break

      case 'UPDATE_STAGE': {
        const { id, status, startDate, endDate } = action.payload
        await supabase.from('project_stages').update({
          status, start_date: startDate || null, end_date: endDate || null,
        }).eq('id', id)
        // Update project status too
        const pStages = stages.map(s => s.id === id ? { ...s, status } : s).filter(s => s.projectId === action.payload.projectId)
        let pStatus = 'not_started'
        if (pStages.every(s => s.status === 'completed')) pStatus = 'completed'
        else if (pStages.some(s => s.status === 'in_progress' || s.status === 'completed')) pStatus = 'in_progress'
        const curProject = projects.find(p => p.id === action.payload.projectId)
        if (curProject && curProject.status !== 'delayed') {
          await supabase.from('projects').update({ status: pStatus, updated_at: new Date().toISOString() }).eq('id', action.payload.projectId)
        }
        await loadStages()
        await loadProjects()
        break
      }

      case 'TOGGLE_TASK': {
        const task = tasks.find(t => t.id === action.payload.taskId)
        if (!task) return
        const completed = !task.completed
        await supabase.from('tasks').update({
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        }).eq('id', task.id)
        await loadTasks()
        break
      }

      case 'UPDATE_TASK': {
        const { id, title, deadline, notes } = action.payload
        await supabase.from('tasks').update({ title, deadline: deadline || null, notes: notes || '' }).eq('id', id)
        await loadTasks()
        break
      }

      case 'ADD_TASK': {
        await supabase.from('tasks').insert({
          stage_id: action.payload.stageId, project_id: action.payload.projectId,
          title: action.payload.title, completed: false,
          deadline: action.payload.deadline || null, notes: action.payload.notes || '',
        })
        await loadTasks()
        break
      }

      case 'DELETE_TASK':
        await supabase.from('tasks').delete().eq('id', action.payload.id)
        await loadTasks()
        break

      case 'ADD_COMMENT':
        await supabase.from('comments').insert({
          project_id: action.payload.projectId,
          user_id: user.id,
          content: action.payload.content,
        })
        await loadComments()
        break

      case 'DELETE_COMMENT':
        await supabase.from('comments').delete().eq('id', action.payload.id)
        await loadComments()
        break

      case 'ADD_PROTOCOL': {
        const { error: addErr } = await supabase.from('protocols').insert({
          title:            action.payload.title,
          protocol_number:  action.payload.protocolNumber  || null,
          project_id:       action.payload.projectId       || null,
          pi_id:            action.payload.piId            || null,
          ethics_committee: action.payload.ethicsCommittee || null,
          submission_date:  action.payload.submissionDate  || null,
          expiration_date:  action.payload.expirationDate  || null,
          approval_number:  action.payload.approvalNumber  || null,
          notes:            action.payload.notes           || null,
          file_url:         action.payload.fileUrl         || null,
          file_name:        action.payload.fileName        || null,
          created_by:       action.payload.createdBy,
        })
        if (addErr) throw new Error(addErr.message)
        await loadProtocols()
        break
      }

      case 'UPDATE_PROTOCOL': {
        const { id, title, protocolNumber, projectId, piId, ethicsCommittee, submissionDate, expirationDate, approvalNumber, notes, fileUrl, fileName } = action.payload
        const { error: updErr } = await supabase.from('protocols').update({
          title,
          protocol_number:  protocolNumber  || null,
          project_id:       projectId       || null,
          pi_id:            piId            || null,
          ethics_committee: ethicsCommittee || null,
          submission_date:  submissionDate  || null,
          expiration_date:  expirationDate  || null,
          approval_number:  approvalNumber  || null,
          notes:            notes           || null,
          file_url:         fileUrl         || null,
          file_name:        fileName        || null,
          updated_at:       new Date().toISOString(),
        }).eq('id', id)
        if (updErr) throw new Error(updErr.message)
        await loadProtocols()
        break
      }

      case 'DELETE_PROTOCOL':
        if (action.payload.filePath) {
          await supabase.storage.from('protocols').remove([action.payload.filePath])
        }
        await supabase.from('protocols').delete().eq('id', action.payload.id)
        await loadProtocols()
        break

      case 'UPDATE_PUB_STATUS':
        await supabase.from('projects').update({ pub_status: action.payload.pubStatus || null }).eq('id', action.payload.id)
        await loadProjects()
        break

      case 'ADD_SUBMISSION':
        await supabase.from('journal_submissions').insert({
          project_id:      action.payload.projectId,
          journal_name:    action.payload.journalName,
          submission_date: action.payload.submissionDate || null,
          status:          action.payload.status         || 'submitted',
          decision_date:   action.payload.decisionDate   || null,
          notes:           action.payload.notes          || '',
        })
        await loadSubmissions()
        break

      case 'UPDATE_SUBMISSION': {
        const { id: subId, journalName, submissionDate, status: subStatus, decisionDate, notes } = action.payload
        await supabase.from('journal_submissions').update({
          journal_name:    journalName,
          submission_date: submissionDate || null,
          status:          subStatus,
          decision_date:   decisionDate   || null,
          notes:           notes          || '',
        }).eq('id', subId)
        await loadSubmissions()
        break
      }

      case 'DELETE_SUBMISSION':
        await supabase.from('journal_submissions').delete().eq('id', action.payload.id)
        await loadSubmissions()
        break

      case 'UPDATE_USER':
        await supabase.from('profiles').update({
          full_name: action.payload.name,
          role: action.payload.role,
          email: action.payload.email,
        }).eq('id', action.payload.id)
        await loadUsers()
        break

      case 'DELETE_USER':
        await supabase.from('profiles').delete().eq('id', action.payload.id)
        await loadUsers()
        break

      default: break
    }
  }

  return { projects, stages, tasks, comments, protocols, submissions, users, loading, dispatch, reloadUsers: loadUsers }
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function DataProvider({ children }) {
  const { user } = useAuth()

  // Demo mode
  const [demoState, demoDispatch] = useReducer(demoReducer, null, loadDemoState)
  useEffect(() => {
    if (DEMO_MODE) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(demoState)) } catch { /* ignore */ }
    }
  }, [demoState])

  // Supabase mode
  const sb = useSupabaseData(DEMO_MODE ? null : user)

  const state    = DEMO_MODE ? demoState  : sb
  const dispatch = DEMO_MODE ? demoDispatch : sb.dispatch

  // ── Derived helpers ──────────────────────────────────────────────────────────
  const getProjectProgress = useCallback((projectId) => {
    const pStages = state.stages.filter(s => s.projectId === projectId)
    const pTasks  = state.tasks.filter(t => t.projectId === projectId)
    return calculateProgress(pStages, pTasks)
  }, [state.stages, state.tasks])

  const getUserById          = useCallback((id) => state.users.find(u => u.id === id), [state.users])
  const getProjectById       = useCallback((id) => state.projects.find(p => p.id === id), [state.projects])
  const getStagesForProject  = useCallback((projectId) => state.stages.filter(s => s.projectId === projectId).sort((a, b) => a.order - b.order), [state.stages])
  const getTasksForStage     = useCallback((stageId)   => state.tasks.filter(t => t.stageId === stageId), [state.tasks])
  const getCommentsForProject = useCallback((projectId) => state.comments.filter(c => c.projectId === projectId).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)), [state.comments])

  return (
    <DataContext.Provider value={{
      ...state,
      dispatch,
      getProjectProgress,
      getUserById,
      getProjectById,
      getStagesForProject,
      getTasksForStage,
      getCommentsForProject,
      isDemo: DEMO_MODE,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
