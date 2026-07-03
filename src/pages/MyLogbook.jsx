import { useState, useEffect, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import { format, startOfWeek, parseISO } from 'date-fns'
import { ChevronRight, Save, CheckCircle2, X, Search, Trash2 } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/layout/Layout'
import Header from '../components/layout/Header'

function ProjectMultiSelect({ projects, selected, onChange }) {
  const [query, setQuery] = useState('')
  const [open, setOpen]   = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function close(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const filtered = projects.filter(p =>
    p.title.toLowerCase().includes(query.toLowerCase()) && !selected.includes(p.title)
  )

  function add(title) {
    onChange([...selected, title])
    setQuery('')
  }

  function remove(title) {
    onChange(selected.filter(t => t !== title))
  }

  return (
    <div ref={ref} className="relative">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map(title => (
            <span key={title} className="flex items-center gap-1 text-xs bg-brand-50 text-brand-700 border border-brand-200 px-2 py-1 rounded-full">
              <span className="max-w-[220px] truncate">{title}</span>
              <button type="button" onClick={() => remove(title)} className="hover:text-brand-900 shrink-0">
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          className="input-base pl-8"
          placeholder="Search and add projects…"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-20 w-full bg-white border border-slate-200 rounded-xl shadow-lg mt-1 max-h-52 overflow-y-auto">
          {filtered.map(p => (
            <button
              key={p.id}
              type="button"
              onMouseDown={e => { e.preventDefault(); add(p.title) }}
              className="w-full text-left px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {p.title}
            </button>
          ))}
        </div>
      )}
      {open && query && filtered.length === 0 && (
        <div className="absolute z-20 w-full bg-white border border-slate-200 rounded-xl shadow-lg mt-1 px-3 py-3 text-sm text-slate-400">
          No matching projects
        </div>
      )}
    </div>
  )
}

function getWeekStart(date) {
  return startOfWeek(date, { weekStartsOn: 1 })
}

function formatWeekRange(monday) {
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  if (monday.getMonth() === sunday.getMonth()) {
    return `${format(monday, 'MMM d')} – ${format(sunday, 'd, yyyy')}`
  }
  return `${format(monday, 'MMM d')} – ${format(sunday, 'MMM d, yyyy')}`
}

const EMPTY_FORM = { projectsWorked: [], accomplished: '', nextWeek: '', blockers: '' }

export default function MyLogbook() {
  const { user } = useAuth()
  const { projects, logbookEntries, dispatch } = useData()

  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [form, setForm]       = useState(EMPTY_FORM)
  const [historyOpen, setHistoryOpen] = useState(null)

  if (!user?.logbookEnabled && !['admin', 'pi'].includes(user?.role)) {
    return <Navigate to="/" replace />
  }

  const currentMonday = getWeekStart(new Date())
  const weekKey = format(currentMonday, 'yyyy-MM-dd')

  // Projects this user is involved in
  const myProjects = projects.filter(p =>
    p.assignedTo === user.id || (p.teamMembers || []).includes(user.id)
  )

  // My entries, newest first
  const myEntries = logbookEntries
    .filter(e => e.userId === user.id)
    .sort((a, b) => b.weekStart.localeCompare(a.weekStart))

  const currentEntry = myEntries.find(e => e.weekStart === weekKey)
  const pastEntries  = myEntries.filter(e => e.weekStart !== weekKey)

  // Populate form from existing entry when it changes
  useEffect(() => {
    if (currentEntry) {
      setForm({
        projectsWorked: currentEntry.projectsWorked || [],
        accomplished:   currentEntry.accomplished   || '',
        nextWeek:       currentEntry.nextWeek       || '',
        blockers:       currentEntry.blockers       || '',
      })
    } else {
      setForm(EMPTY_FORM)
    }
  }, [weekKey, currentEntry?.id])

  async function handleDelete(entry) {
    if (!window.confirm('Delete this logbook entry? This cannot be undone.')) return
    await dispatch({ type: 'DELETE_LOGBOOK_ENTRY', payload: { id: entry.id } })
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await dispatch({
        type: currentEntry ? 'UPDATE_LOGBOOK_ENTRY' : 'ADD_LOGBOOK_ENTRY',
        payload: { userId: user.id, weekStart: weekKey, ...form },
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout>
      <Header title="My Logbook" />
      <div className="p-4 sm:p-6 max-w-2xl space-y-6">

        {/* Current week form */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs font-semibold text-brand-500 uppercase tracking-wide mb-0.5">Current Week</p>
              <p className="text-sm font-semibold text-slate-700">{formatWeekRange(currentMonday)}</p>
            </div>
            {currentEntry && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                <CheckCircle2 size={12} /> Saved
              </span>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Projects */}
            {myProjects.length > 0 && (
              <div>
                <label className="label">Projects worked on</label>
                <ProjectMultiSelect
                  projects={myProjects}
                  selected={form.projectsWorked}
                  onChange={val => setForm(f => ({ ...f, projectsWorked: val }))}
                />
              </div>
            )}

            <div>
              <label className="label">What I accomplished this week *</label>
              <textarea
                className="input-base resize-none"
                rows={4}
                placeholder="Describe what you worked on and completed..."
                value={form.accomplished}
                onChange={e => setForm(f => ({ ...f, accomplished: e.target.value }))}
              />
            </div>

            <div>
              <label className="label">Plans for next week</label>
              <textarea
                className="input-base resize-none"
                rows={3}
                placeholder="What do you plan to work on next week?"
                value={form.nextWeek}
                onChange={e => setForm(f => ({ ...f, nextWeek: e.target.value }))}
              />
            </div>

            <div>
              <label className="label">Blockers / Issues <span className="text-slate-400 font-normal">(optional)</span></label>
              <textarea
                className="input-base resize-none"
                rows={2}
                placeholder="Any blockers, questions, or issues?"
                value={form.blockers}
                onChange={e => setForm(f => ({ ...f, blockers: e.target.value }))}
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving || !form.accomplished.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white text-sm font-medium rounded-xl hover:bg-brand-600 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</>
                ) : saved ? (
                  <><CheckCircle2 size={15} /> Saved!</>
                ) : (
                  <><Save size={15} /> {currentEntry ? 'Update entry' : 'Save entry'}</>
                )}
              </button>
              {currentEntry && (
                <button
                  type="button"
                  onClick={() => handleDelete(currentEntry)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <Trash2 size={14} /> Delete
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Past entries */}
        {pastEntries.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Past Entries</p>
            <div className="space-y-2">
              {pastEntries.slice(0, 8).map(entry => {
                const mon = new Date(entry.weekStart + 'T00:00:00')
                const isOpen = historyOpen === entry.id
                return (
                  <div key={entry.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="flex items-center">
                      <button
                        onClick={() => setHistoryOpen(isOpen ? null : entry.id)}
                        className="flex-1 flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                      >
                        <span className="text-sm font-medium text-slate-700">{formatWeekRange(mon)}</span>
                        <ChevronRight size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleDelete(entry)}
                        className="p-2 mr-2 text-slate-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50"
                        title="Delete entry"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {isOpen && (
                      <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3">
                        {entry.projectsWorked?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Projects</p>
                            <div className="flex flex-wrap gap-1.5">
                              {entry.projectsWorked.map((p, i) => (
                                <span key={i} className="text-xs bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full">{p}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {entry.accomplished && (
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Accomplished</p>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap">{entry.accomplished}</p>
                          </div>
                        )}
                        {entry.nextWeek && (
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Next week plans</p>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap">{entry.nextWeek}</p>
                          </div>
                        )}
                        {entry.blockers && (
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Blockers</p>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap">{entry.blockers}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </Layout>
  )
}
