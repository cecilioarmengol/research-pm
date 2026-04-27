import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { STAGES } from '../../lib/constants'
import { useData } from '../../context/DataContext'
import { useAuth } from '../../context/AuthContext'
import { formatDate } from '../../lib/utils'
import Button from '../ui/Button'

function TaskRow({ task, canEdit }) {
  const { dispatch } = useData()
  const [showNote, setShowNote] = useState(false)

  return (
    <div className={`group rounded-lg transition-colors ${task.completed ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3 py-2 px-3 hover:bg-slate-50 rounded-lg">
        <input
          type="checkbox"
          checked={task.completed}
          disabled={!canEdit}
          onChange={() => dispatch({ type: 'TOGGLE_TASK', payload: { taskId: task.id } })}
          className="mt-0.5 w-4 h-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500 cursor-pointer shrink-0"
        />
        <div className="flex-1 min-w-0">
          <span className={`text-sm text-slate-700 ${task.completed ? 'line-through text-slate-400' : ''}`}>
            {task.title}
          </span>
          {task.deadline && (
            <span className="ml-2 text-xs text-slate-400">{formatDate(task.deadline)}</span>
          )}
          {task.notes && (
            <button
              onClick={() => setShowNote(v => !v)}
              className="ml-2 text-xs text-brand-500 hover:underline"
            >
              note
            </button>
          )}
        </div>
        {canEdit && (
          <button
            onClick={() => dispatch({ type: 'DELETE_TASK', payload: { id: task.id } })}
            className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-400 transition-all"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
      {showNote && task.notes && (
        <div className="ml-10 mb-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-800">
          {task.notes}
        </div>
      )}
    </div>
  )
}

function StageSection({ stage, tasks, canEdit }) {
  const { dispatch } = useData()
  const [open, setOpen]       = useState(stage.status !== 'pending')
  const [adding, setAdding]   = useState(false)
  const [newTitle, setNewTitle] = useState('')

  const meta       = STAGES.find(s => s.key === stage.stageKey) || {}
  const done       = tasks.filter(t => t.completed).length
  const total      = tasks.length
  const pct        = total > 0 ? Math.round((done / total) * 100) : 0

  function addTask() {
    if (!newTitle.trim()) return
    dispatch({
      type: 'ADD_TASK',
      payload: { stageId: stage.id, projectId: stage.projectId, title: newTitle.trim(), deadline: null, notes: '' },
    })
    setNewTitle('')
    setAdding(false)
  }

  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-slate-50 transition-colors"
      >
        {open ? <ChevronDown size={15} className="text-slate-400" /> : <ChevronRight size={15} className="text-slate-400" />}
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: meta.color }}
        />
        <span className="text-sm font-medium text-slate-700 flex-1 text-left">{stage.stageName}</span>
        <span className="text-xs text-slate-400">{done}/{total}</span>
        <div className="w-24 bg-slate-100 rounded-full h-1.5 ml-2">
          <div
            className="h-1.5 rounded-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: meta.color }}
          />
        </div>
      </button>

      {open && (
        <div className="bg-slate-50/50 border-t border-slate-100 px-2 py-2 space-y-0.5">
          {tasks.map(task => (
            <TaskRow key={task.id} task={task} canEdit={canEdit} />
          ))}

          {canEdit && (
            adding ? (
              <div className="flex gap-2 px-3 py-2">
                <input
                  autoFocus
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addTask(); if (e.key === 'Escape') setAdding(false) }}
                  placeholder="Task title…"
                  className="flex-1 input-base text-sm py-1.5"
                />
                <Button size="xs" onClick={addTask}>Add</Button>
                <Button size="xs" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
              </div>
            ) : (
              <button
                onClick={() => setAdding(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 hover:text-brand-500 transition-colors"
              >
                <Plus size={13} /> Add task
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}

export default function TaskList({ project, stages }) {
  const { getTasksForStage } = useData()
  const { user }             = useAuth()
  const canEdit              = user?.role === 'admin'
    || user?.id === project?.assignedTo
    || (project?.teamMembers || []).includes(user?.id)

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Tasks by Stage</h3>
      <div className="space-y-2">
        {stages.map(stage => (
          <StageSection
            key={stage.id}
            stage={stage}
            tasks={getTasksForStage(stage.id)}
            canEdit={canEdit}
          />
        ))}
      </div>
    </div>
  )
}
