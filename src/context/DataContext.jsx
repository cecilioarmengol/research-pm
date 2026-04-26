import { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { buildInitialData, DEMO_USERS, SEED_COMMENTS } from '../lib/mockData'
import { calculateProgress, uid } from '../lib/utils'
import { DEFAULT_TASKS, STAGES } from '../lib/constants'

const DataContext = createContext(null)
const STORAGE_KEY = 'rpm_data'

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  const { projects, stages, tasks } = buildInitialData()
  return {
    projects,
    stages,
    tasks,
    comments: SEED_COMMENTS,
    users: DEMO_USERS.map(({ password: _pw, ...u }) => u),
    notifications: [],
  }
}

function reducer(state, action) {
  switch (action.type) {

    // ── Projects ──────────────────────────────────────────────────────────────
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

    case 'UPDATE_PROJECT': {
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.payload.id ? { ...p, ...action.payload, updatedAt: new Date().toISOString() } : p
        ),
      }
    }

    case 'DELETE_PROJECT': {
      const { id } = action.payload
      const stageIds = state.stages.filter(s => s.projectId === id).map(s => s.id)
      return {
        ...state,
        projects:  state.projects.filter(p => p.id !== id),
        stages:    state.stages.filter(s => s.projectId !== id),
        tasks:     state.tasks.filter(t => t.projectId !== id),
        comments:  state.comments.filter(c => c.projectId !== id),
      }
    }

    // ── Stages ────────────────────────────────────────────────────────────────
    case 'UPDATE_STAGE': {
      const updatedStages = state.stages.map(s =>
        s.id === action.payload.id ? { ...s, ...action.payload } : s
      )
      // Recalculate project status based on stages
      const projectId = action.payload.projectId
      const projectStages = updatedStages.filter(s => s.projectId === projectId)
      const projectTasks  = state.tasks.filter(t => t.projectId === projectId)
      let derivedStatus = 'not_started'
      if (projectStages.every(s => s.status === 'completed')) derivedStatus = 'completed'
      else if (projectStages.some(s => s.status === 'in_progress' || s.status === 'completed')) derivedStatus = 'in_progress'

      return {
        ...state,
        stages: updatedStages,
        projects: state.projects.map(p =>
          p.id === projectId
            ? { ...p, status: p.status === 'delayed' ? 'delayed' : derivedStatus, updatedAt: new Date().toISOString() }
            : p
        ),
      }
    }

    // ── Tasks ─────────────────────────────────────────────────────────────────
    case 'TOGGLE_TASK': {
      const { taskId } = action.payload
      const updatedTasks = state.tasks.map(t =>
        t.id === taskId
          ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : null }
          : t
      )
      return { ...state, tasks: updatedTasks }
    }

    case 'UPDATE_TASK': {
      return {
        ...state,
        tasks: state.tasks.map(t => t.id === action.payload.id ? { ...t, ...action.payload } : t),
      }
    }

    case 'ADD_TASK': {
      return {
        ...state,
        tasks: [...state.tasks, { id: uid(), completed: false, completedAt: null, createdAt: new Date().toISOString(), ...action.payload }],
      }
    }

    case 'DELETE_TASK': {
      return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload.id) }
    }

    // ── Comments ──────────────────────────────────────────────────────────────
    case 'ADD_COMMENT': {
      return {
        ...state,
        comments: [...state.comments, { id: uid(), createdAt: new Date().toISOString(), ...action.payload }],
      }
    }

    // ── Users (admin) ─────────────────────────────────────────────────────────
    case 'ADD_USER': {
      return { ...state, users: [...state.users, { id: uid(), ...action.payload }] }
    }

    case 'UPDATE_USER': {
      return {
        ...state,
        users: state.users.map(u => u.id === action.payload.id ? { ...u, ...action.payload } : u),
      }
    }

    case 'DELETE_USER': {
      return { ...state, users: state.users.filter(u => u.id !== action.payload.id) }
    }

    // ── Notifications ─────────────────────────────────────────────────────────
    case 'MARK_NOTIFICATION_READ': {
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload.id ? { ...n, read: true } : n
        ),
      }
    }

    default: return state
  }
}

export function DataProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, loadState)

  // Persist to localStorage whenever state changes
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* ignore */ }
  }, [state])

  // ── Derived helpers ────────────────────────────────────────────────────────
  const getProjectProgress = useCallback((projectId) => {
    const stages = state.stages.filter(s => s.projectId === projectId)
    const tasks  = state.tasks.filter(t => t.projectId === projectId)
    return calculateProgress(stages, tasks)
  }, [state.stages, state.tasks])

  const getUserById = useCallback((id) => state.users.find(u => u.id === id), [state.users])

  const getProjectById = useCallback((id) => state.projects.find(p => p.id === id), [state.projects])

  const getStagesForProject = useCallback((projectId) =>
    state.stages.filter(s => s.projectId === projectId).sort((a, b) => a.order - b.order),
  [state.stages])

  const getTasksForStage = useCallback((stageId) =>
    state.tasks.filter(t => t.stageId === stageId),
  [state.tasks])

  const getCommentsForProject = useCallback((projectId) =>
    state.comments.filter(c => c.projectId === projectId).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
  [state.comments])

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
