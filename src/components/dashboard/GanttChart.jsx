import { useMemo } from 'react'
import { parseISO, differenceInDays, format, addMonths, startOfMonth } from 'date-fns'
import { STATUS } from '../../lib/constants'
import { useData } from '../../context/DataContext'

export default function GanttChart({ projects }) {
  const { getProjectProgress, getUserById, getStagesForProject } = useData()

  const { minDate, maxDate, months } = useMemo(() => {
    const starts   = projects.map(p => p.startDate).filter(Boolean).map(d => parseISO(d))
    const deadlines = projects.map(p => p.deadline).filter(Boolean).map(d => parseISO(d))
    if (!starts.length) return { minDate: new Date(), maxDate: addMonths(new Date(), 6), months: [] }

    const min = startOfMonth(new Date(Math.min(...starts)))
    const max = addMonths(new Date(Math.max(...deadlines)), 1)

    const months = []
    let cur = min
    while (cur < max) {
      months.push(cur)
      cur = addMonths(cur, 1)
    }
    return { minDate: min, maxDate: max, months }
  }, [projects])

  const totalDays = differenceInDays(maxDate, minDate) || 1

  function pct(date) {
    if (!date) return 0
    return (differenceInDays(parseISO(date), minDate) / totalDays) * 100
  }

  function width(start, end) {
    if (!start || !end) return 0
    return Math.max(0.5, ((differenceInDays(parseISO(end), parseISO(start))) / totalDays) * 100)
  }

  const todayPct = (differenceInDays(new Date(), minDate) / totalDays) * 100

  if (!projects.length) return null

  return (
    <div className="card p-5 overflow-hidden">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Timeline — Gantt View</h3>
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Month headers */}
          <div className="flex mb-1 ml-48">
            {months.map((m, i) => {
              const mPct = (differenceInDays(m, minDate) / totalDays) * 100
              const nextM = months[i + 1] ?? maxDate
              const mWidth = (differenceInDays(nextM, m) / totalDays) * 100
              return (
                <div
                  key={i}
                  className="text-xs text-slate-400 font-medium border-l border-slate-200 pl-1 shrink-0"
                  style={{ width: `${mWidth}%` }}
                >
                  {format(m, 'MMM yy')}
                </div>
              )
            })}
          </div>

          {/* Rows */}
          <div className="space-y-2">
            {projects.map(project => {
              const user     = getUserById(project.assignedTo)
              const progress = getProjectProgress(project.id)
              const stages   = getStagesForProject(project.id)
              const meta     = STATUS[project.status] || STATUS.not_started
              const left     = pct(project.startDate)
              const barWidth = width(project.startDate, project.deadline)

              return (
                <div key={project.id} className="flex items-center gap-0 group">
                  {/* Label */}
                  <div className="w-48 shrink-0 pr-4">
                    <p className="text-xs font-medium text-slate-700 truncate leading-tight">{project.title.split(':').slice(-1)[0].trim()}</p>
                    <p className="text-xs text-slate-400 truncate">{user?.name?.split(' ').slice(-1)[0]}</p>
                  </div>

                  {/* Bar area */}
                  <div className="flex-1 relative h-9 bg-slate-50 rounded-lg border border-slate-100 overflow-hidden">
                    {/* Month grid lines */}
                    {months.map((m, i) => {
                      const x = (differenceInDays(m, minDate) / totalDays) * 100
                      return (
                        <div
                          key={i}
                          className="absolute top-0 bottom-0 border-l border-slate-100"
                          style={{ left: `${x}%` }}
                        />
                      )
                    })}

                    {/* Today line */}
                    {todayPct >= 0 && todayPct <= 100 && (
                      <div
                        className="absolute top-0 bottom-0 border-l-2 border-red-400 border-dashed z-10"
                        style={{ left: `${todayPct}%` }}
                      />
                    )}

                    {/* Project bar */}
                    {project.startDate && project.deadline && (
                      <div
                        className="absolute top-1.5 h-6 rounded-md flex items-center overflow-hidden"
                        style={{
                          left: `${left}%`,
                          width: `${barWidth}%`,
                          backgroundColor: meta.bg,
                          border: `1.5px solid ${meta.color}`,
                        }}
                        title={`${project.status} — ${progress}%`}
                      >
                        {/* Progress fill */}
                        <div
                          className="absolute left-0 top-0 bottom-0 rounded-md opacity-50"
                          style={{ width: `${progress}%`, backgroundColor: meta.color }}
                        />
                        <span className="relative text-xs font-semibold px-1.5 truncate" style={{ color: meta.text }}>
                          {progress}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 border-t-2 border-dashed border-red-400" />
              <span className="text-xs text-slate-400">Today</span>
            </div>
            {Object.entries(STATUS).map(([key, meta]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className="w-3 h-2.5 rounded-sm" style={{ backgroundColor: meta.bg, border: `1px solid ${meta.color}` }} />
                <span className="text-xs text-slate-400">{meta.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
