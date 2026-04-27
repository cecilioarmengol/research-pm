import { useState } from 'react'
import { Check, Clock, Circle, Calendar } from 'lucide-react'
import { STAGES } from '../../lib/constants'
import { useData } from '../../context/DataContext'
import { useAuth } from '../../context/AuthContext'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

function StageIcon({ status }) {
  if (status === 'completed')  return <Check size={14} className="text-white" />
  if (status === 'in_progress') return <Clock size={14} className="text-white" />
  return <Circle size={12} className="text-slate-300" />
}

const STATUS_OPTIONS = [
  { value: 'pending',     label: 'Pending',     color: 'bg-slate-100 text-slate-600 border-slate-200'         },
  { value: 'in_progress', label: 'In Progress',  color: 'bg-blue-50 text-blue-700 border-blue-200'             },
  { value: 'completed',   label: 'Completed',    color: 'bg-emerald-50 text-emerald-700 border-emerald-200'    },
]

export default function StageTimeline({ project, stages }) {
  const { dispatch }   = useData()
  const { user }       = useAuth()
  const canEdit        = user?.role === 'admin'
    || user?.id === project?.assignedTo
    || (project?.teamMembers || []).includes(user?.id)

  const [editing, setEditing]   = useState(null)   // stage being edited
  const [form, setForm]         = useState({})
  const [saving, setSaving]     = useState(false)

  function openEdit(stage) {
    setForm({
      status:    stage.status,
      startDate: stage.startDate || '',
      endDate:   stage.endDate   || '',
    })
    setEditing(stage)
  }

  async function save() {
    setSaving(true)
    dispatch({
      type: 'UPDATE_STAGE',
      payload: {
        ...editing,
        status:    form.status,
        startDate: form.startDate || null,
        endDate:   form.endDate   || null,
        projectId: project.id,
      },
    })
    setSaving(false)
    setEditing(null)
  }

  const meta = editing ? (STAGES.find(s => s.key === editing.stageKey) || {}) : {}

  return (
    <>
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-5">Research Pipeline</h3>
        <div className="relative">
          {/* Connector line */}
          <div className="absolute top-5 left-5 right-5 h-0.5 bg-slate-100 z-0" />

          <div className="flex justify-between relative z-10 overflow-x-auto gap-1">
            {stages.map((stage, i) => {
              const m       = STAGES.find(s => s.key === stage.stageKey) || STAGES[i]
              const isDone  = stage.status === 'completed'
              const isActive = stage.status === 'in_progress'
              const hasDate = stage.startDate || stage.endDate

              return (
                <div key={stage.id} className="flex flex-col items-center gap-2 min-w-[72px]">
                  <button
                    onClick={() => openEdit(stage)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all cursor-pointer hover:scale-110
                      ${isDone    ? 'border-transparent shadow-sm'   : ''}
                      ${isActive  ? 'border-transparent shadow-md'   : ''}
                      ${!isDone && !isActive ? 'bg-white border-slate-200' : ''}
                    `}
                    style={{
                      backgroundColor: isDone || isActive ? m.color : undefined,
                      boxShadow: isActive ? `0 0 0 4px ${m.color}33` : undefined,
                    }}
                    title="Click to view stage"
                  >
                    <StageIcon status={stage.status} />
                  </button>

                  <span
                    className="text-center text-xs leading-tight font-medium"
                    style={{ color: isDone || isActive ? m.text : '#94a3b8' }}
                  >
                    {m.name}
                  </span>

                  {/* Date indicator */}
                  {hasDate && (
                    <div className="flex items-center gap-0.5 text-slate-400">
                      <Calendar size={9} />
                      <span className="text-[9px] leading-tight text-center">
                        {stage.startDate
                          ? new Date(stage.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : '—'}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {canEdit && (
          <p className="text-xs text-slate-400 text-center mt-4">Click a stage to update its status and timeline</p>
        )}
      </div>

      {/* Edit modal */}
      <Modal
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        title={editing ? `${STAGES.find(s => s.key === editing?.stageKey)?.name || editing?.stageName}` : ''}
        size="sm"
      >
        {editing && (
          <div className="space-y-5">
            {/* Status */}
            <div>
              <label className="label">Status</label>
              <div className="flex gap-2">
                {STATUS_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setForm(f => ({ ...f, status: opt.value }))}
                    className={`flex-1 px-3 py-2 rounded-lg border text-xs font-medium transition-all
                      ${form.status === opt.value
                        ? opt.color + ' ring-2 ring-offset-1 ring-current'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Start Date</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    className="input-base pl-9"
                    value={form.startDate}
                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="label">End Date</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    className="input-base pl-9"
                    value={form.endDate}
                    onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={save} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
