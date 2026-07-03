import { useState } from 'react'
import { format, startOfWeek, addWeeks, addDays, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight, BookText, Users, CheckCircle2, Clock, AlertCircle, Download } from 'lucide-react'
import * as XLSX from 'xlsx-js-style'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/layout/Layout'
import Header from '../components/layout/Header'
import Avatar from '../components/ui/Avatar'

function getWeekStart(date) {
  return startOfWeek(date, { weekStartsOn: 1 })
}

function formatWeekRange(monday) {
  const sunday = addDays(monday, 6)
  if (monday.getMonth() === sunday.getMonth()) {
    return `${format(monday, 'MMM d')} – ${format(sunday, 'd, yyyy')}`
  }
  return `${format(monday, 'MMM d')} – ${format(sunday, 'MMM d, yyyy')}`
}

// ── Excel styling helpers ─────────────────────────────────────────────────────
const COLORS = {
  headerBg:   '1E293B', // slate-900
  headerText: 'FFFFFF',
  accent:     '6366F1', // indigo-500  (project text)
  row1:       'FFFFFF',
  row2:       'F1F5F9', // slate-100
  border:     'CBD5E1', // slate-300
  nameText:   '0F172A', // slate-950
  mutedText:  '64748B', // slate-500
}

function border() {
  return ['top','bottom','left','right'].reduce((o, side) => {
    o[side] = { style: 'thin', color: { rgb: COLORS.border } }
    return o
  }, {})
}

function styleSheet(ws, { centeredCols = [], accentCols = [], boldCols = [] } = {}) {
  if (!ws['!ref']) return
  const range = XLSX.utils.decode_range(ws['!ref'])

  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C })
      if (!ws[addr]) ws[addr] = { v: '', t: 's' }

      if (R === 0) {
        ws[addr].s = {
          fill: { patternType: 'solid', fgColor: { rgb: COLORS.headerBg } },
          font: { bold: true, color: { rgb: COLORS.headerText }, sz: 11, name: 'Calibri' },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: false },
          border: border(),
        }
      } else {
        const isAlt = R % 2 === 0
        const isAccent = accentCols.includes(C)
        const isBold   = boldCols.includes(C)
        const isCentered = centeredCols.includes(C)
        ws[addr].s = {
          fill: { patternType: 'solid', fgColor: { rgb: isAlt ? COLORS.row2 : COLORS.row1 } },
          font: {
            sz: 10, name: 'Calibri', bold: isBold,
            color: { rgb: isAccent ? COLORS.accent : COLORS.nameText },
          },
          alignment: { horizontal: isCentered ? 'center' : 'left', vertical: 'top', wrapText: true },
          border: border(),
        }
      }
    }
  }

  // Freeze header row
  ws['!freeze'] = { xSplit: 0, ySplit: 1 }
  // Row heights: header taller
  ws['!rows'] = [{ hpt: 28 }]
}

function exportToExcel({ entries, users, weekLabel, allWeeks }) {
  const getUser = (userId) => users.find(u => u.id === userId)
  const getName = (userId) => getUser(userId)?.name || 'Unknown'
  const getRole = (userId) => (getUser(userId)?.role || '').replace('_', ' ')
  const getDate = (e)      => e.updatedAt ? format(parseISO(e.updatedAt), 'yyyy-MM-dd') : ''

  const sorted = [...entries].sort((a, b) =>
    b.weekStart.localeCompare(a.weekStart) || getName(a.userId).localeCompare(getName(b.userId))
  )

  // ── Sheet 1: By Project (one row per project) ─────────────────────────────
  const detailRows = sorted.flatMap(e => {
    const projects = e.projectsWorked?.length ? e.projectsWorked : ['—']
    return projects.map(proj => ({
      'Name':                getName(e.userId),
      'Role':                getRole(e.userId),
      'Week':                e.weekStart,
      'Project':             proj,
      'Accomplished':        e.accomplished || '',
      'Plans for Next Week': e.nextWeek     || '',
      'Blockers / Issues':   e.blockers     || '',
      'Submitted':           getDate(e),
    }))
  })

  const wsDetail = XLSX.utils.json_to_sheet(detailRows)
  wsDetail['!cols'] = [
    { wch: 22 }, { wch: 16 }, { wch: 12 }, { wch: 44 },
    { wch: 48 }, { wch: 38 }, { wch: 28 }, { wch: 13 },
  ]
  styleSheet(wsDetail, { centeredCols: [1, 2, 7], accentCols: [3], boldCols: [0] })

  // ── Sheet 2: Summary (one row per person) ────────────────────────────────
  const summaryRows = sorted.map(e => ({
    'Name':                getName(e.userId),
    'Role':                getRole(e.userId),
    'Week':                e.weekStart,
    'Projects (#)':        (e.projectsWorked || []).length,
    'Projects':            (e.projectsWorked || []).join('  |  '),
    'Accomplished':        e.accomplished || '',
    'Plans for Next Week': e.nextWeek     || '',
    'Blockers / Issues':   e.blockers     || '',
    'Submitted':           getDate(e),
  }))

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows)
  wsSummary['!cols'] = [
    { wch: 22 }, { wch: 16 }, { wch: 12 }, { wch: 11 },
    { wch: 40 }, { wch: 48 }, { wch: 38 }, { wch: 28 }, { wch: 13 },
  ]
  styleSheet(wsSummary, { centeredCols: [1, 2, 3, 8], boldCols: [0] })

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, wsDetail,  'By Project')
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  const filename = allWeeks ? 'logbook_all.xlsx' : `logbook_${weekLabel}.xlsx`
  XLSX.writeFile(wb, filename)
}

function Toggle({ enabled, onChange }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${enabled ? 'bg-brand-500' : 'bg-slate-300'}`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
    </button>
  )
}

function EntryCard({ entry, user: member }) {
  const [open, setOpen] = useState(false)
  const hasEntry = !!entry

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors text-left"
      >
        <Avatar user={member} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">{member.name}</p>
          <p className="text-xs text-slate-400 capitalize">{member.role.replace('_', ' ')}</p>
        </div>
        {hasEntry ? (
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full shrink-0">
            <CheckCircle2 size={12} /> Submitted
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-full shrink-0">
            <Clock size={12} /> Pending
          </span>
        )}
        <ChevronRight size={16} className={`text-slate-400 transition-transform shrink-0 ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3">
          {!hasEntry ? (
            <p className="text-sm text-slate-400 italic">No entry submitted for this week.</p>
          ) : (
            <>
              {entry.projectsWorked?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Projects worked on</p>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.projectsWorked.map((p, i) => (
                      <span key={i} className="text-xs bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full">{p}</span>
                    ))}
                  </div>
                </div>
              )}
              {entry.accomplished && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Accomplished this week</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{entry.accomplished}</p>
                </div>
              )}
              {entry.nextWeek && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Plans for next week</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{entry.nextWeek}</p>
                </div>
              )}
              {entry.blockers && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <AlertCircle size={11} className="text-amber-500" /> Blockers / Issues
                  </p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{entry.blockers}</p>
                </div>
              )}
              <p className="text-xs text-slate-400">
                Submitted {format(parseISO(entry.updatedAt || entry.createdAt), 'MMM d, yyyy')}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function Logbook() {
  const { user } = useAuth()
  const { users, logbookEntries, dispatch } = useData()
  const [tab, setTab] = useState('team')
  const [weekOffset, setWeekOffset] = useState(0)
  const [toggling, setToggling] = useState(null)

  const isAdmin = user?.role === 'admin'
  const currentMonday = getWeekStart(new Date())
  const selectedMonday = addWeeks(currentMonday, weekOffset)
  const weekKey = format(selectedMonday, 'yyyy-MM-dd')
  const isCurrentWeek = weekOffset === 0

  const enabledUsers = users.filter(u => u.logbookEnabled)

  const entriesThisWeek = logbookEntries.filter(e => e.weekStart === weekKey)
  const entryFor = (userId) => entriesThisWeek.find(e => e.userId === userId) || null

  const submitted = enabledUsers.filter(u => entryFor(u.id))
  const pending   = enabledUsers.filter(u => !entryFor(u.id))

  async function toggleAccess(userId, enabled) {
    setToggling(userId)
    await dispatch({ type: 'TOGGLE_LOGBOOK_ACCESS', payload: { userId, enabled } })
    setToggling(null)
  }

  const tabClass = (t) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === t ? 'bg-brand-500 text-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`

  return (
    <Layout>
      <Header title="Logbook" />
      <div className="p-4 sm:p-6 max-w-3xl space-y-5">

        {/* Tabs */}
        <div className="flex gap-2">
          <button className={tabClass('team')} onClick={() => setTab('team')}>
            <span className="flex items-center gap-2"><BookText size={15} /> Team View</span>
          </button>
          {isAdmin && (
            <button className={tabClass('access')} onClick={() => setTab('access')}>
              <span className="flex items-center gap-2"><Users size={15} /> Manage Access</span>
            </button>
          )}
        </div>

        {/* ── Team View ── */}
        {tab === 'team' && (
          <div className="space-y-4">
            {/* Week navigator */}
            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3">
              <button
                onClick={() => setWeekOffset(o => o - 1)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-700">{formatWeekRange(selectedMonday)}</p>
                {isCurrentWeek && <p className="text-xs text-brand-500 font-medium">Current week</p>}
              </div>
              <button
                onClick={() => setWeekOffset(o => o + 1)}
                disabled={weekOffset >= 0}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-30"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Summary chips + export */}
            {enabledUsers.length > 0 && (
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex gap-2">
                  <span className="text-xs font-medium bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full">
                    {submitted.length} submitted
                  </span>
                  <span className="text-xs font-medium bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full">
                    {pending.length} pending
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => exportToExcel({ entries: entriesThisWeek, users, weekLabel: weekKey, allWeeks: false })}
                    disabled={entriesThisWeek.length === 0}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40"
                  >
                    <Download size={13} /> This week
                  </button>
                  <button
                    onClick={() => exportToExcel({ entries: logbookEntries, users, weekLabel: 'all', allWeeks: true })}
                    disabled={logbookEntries.length === 0}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-brand-200 bg-brand-50 text-brand-600 hover:bg-brand-100 transition-colors disabled:opacity-40"
                  >
                    <Download size={13} /> All entries
                  </button>
                </div>
              </div>
            )}

            {enabledUsers.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
                <BookText size={32} className="text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-500">No one has logbook access yet</p>
                {isAdmin && (
                  <p className="text-xs text-slate-400 mt-1">
                    Go to <button className="text-brand-500 hover:underline" onClick={() => setTab('access')}>Manage Access</button> to enable team members
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {enabledUsers.map(member => (
                  <EntryCard key={member.id} entry={entryFor(member.id)} user={member} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Manage Access (admin only) ── */}
        {tab === 'access' && isAdmin && (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">
              Enable team members to submit weekly logbook entries. Only you and the PI can read them.
            </p>
            {users.map(member => (
              <div key={member.id} className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3">
                <Avatar user={member} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{member.name}</p>
                  <p className="text-xs text-slate-400 capitalize">{member.role.replace('_', ' ')}</p>
                </div>
                {toggling === member.id ? (
                  <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Toggle enabled={member.logbookEnabled} onChange={(v) => toggleAccess(member.id, v)} />
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </Layout>
  )
}
