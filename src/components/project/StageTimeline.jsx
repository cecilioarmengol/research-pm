import { Check, Clock, Circle } from 'lucide-react'
import { STAGES } from '../../lib/constants'
import { useData } from '../../context/DataContext'
import { useAuth } from '../../context/AuthContext'

function StageIcon({ status }) {
  if (status === 'completed')  return <Check size={14} className="text-white" />
  if (status === 'in_progress') return <Clock size={14} className="text-white" />
  return <Circle size={12} className="text-slate-300" />
}

export default function StageTimeline({ project, stages }) {
  const { dispatch } = useData()
  const { user }     = useAuth()
  const canEdit      = user?.role === 'admin'
    || user?.id === project?.assignedTo
    || (project?.teamMembers || []).includes(user?.id)

  function cycleStatus(stage) {
    if (!canEdit) return
    const next = { pending: 'in_progress', in_progress: 'completed', completed: 'pending' }
    dispatch({
      type: 'UPDATE_STAGE',
      payload: { ...stage, status: next[stage.status] ?? 'pending', projectId: project.id },
    })
  }

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-5">Research Pipeline</h3>
      <div className="relative">
        {/* Connector line */}
        <div className="absolute top-5 left-5 right-5 h-0.5 bg-slate-100 z-0" />

        <div className="flex justify-between relative z-10 overflow-x-auto gap-1">
          {stages.map((stage, i) => {
            const meta = STAGES.find(s => s.key === stage.stageKey) || STAGES[i]
            const isDone = stage.status === 'completed'
            const isActive = stage.status === 'in_progress'

            return (
              <div
                key={stage.id}
                className="flex flex-col items-center gap-2 min-w-[72px]"
              >
                <button
                  onClick={() => cycleStatus(stage)}
                  disabled={!canEdit}
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                    ${isDone   ? 'border-transparent shadow-sm'    : ''}
                    ${isActive ? 'border-transparent shadow-md ring-4 ring-offset-1' : ''}
                    ${!isDone && !isActive ? 'bg-white border-slate-200' : ''}
                    ${canEdit  ? 'cursor-pointer hover:scale-110' : 'cursor-default'}
                  `}
                  style={{
                    backgroundColor: isDone || isActive ? meta.color : undefined,
                    boxShadow: isActive ? `0 0 0 4px ${meta.color}22` : undefined,
                  }}
                  title={canEdit ? 'Click to advance stage' : stage.stageName}
                >
                  <StageIcon status={stage.status} />
                </button>
                <span
                  className="text-center text-xs leading-tight font-medium"
                  style={{ color: isDone || isActive ? meta.text : '#94a3b8' }}
                >
                  {meta.name}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {canEdit && (
        <p className="text-xs text-slate-400 text-center mt-4">Click a stage to cycle its status</p>
      )}
    </div>
  )
}
