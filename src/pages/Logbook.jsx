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

// ── Excel palette ─────────────────────────────────────────────────────────────
const PAL = {
  titleBg:   '1E1B4B', // indigo-950
  titleFg:   'FFFFFF',
  subBg:     '312E81', // indigo-900
  subFg:     'C7D2FE', // indigo-200
  headerBg:  '4F46E5', // indigo-600
  headerFg:  'FFFFFF',
  headerUl:  '3730A3', // indigo-800 (medium underline)
  groupBg:   'EEF2FF', // indigo-50  (first row of each person block)
  rowBg:     'FFFFFF',
  altBg:     'F5F3FF', // violet-50  (summary sheet alt rows)
  accentFg:  '4338CA', // indigo-700 (project text)
  accentBdr: '6366F1', // indigo-500 (project left border)
  nameFg:    '0F172A', // slate-950
  textFg:    '374151', // gray-700
  mutedFg:   '6B7280', // gray-500
  divider:   'E0E7FF', // indigo-100 (row bottom line)
  groupEnd:  'A5B4FC', // indigo-300 (stronger line between person blocks)
}

function applyDetailStyles(ws, sorted) {
  if (!ws['!ref']) return
  const range = XLSX.utils.decode_range(ws['!ref'])

  // Which sheet rows are the first / last row of each person's block
  // (data starts at sheet row 3: title=0, subtitle=1, header=2)
  const groupStarts = new Set()
  const groupEnds   = new Set()
  let ri = 3
  sorted.forEach(e => {
    const n = Math.max((e.projectsWorked?.length || 0), 1)
    groupStarts.add(ri)
    groupEnds.add(ri + n - 1)
    ri += n
  })

  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C })
      if (!ws[addr]) ws[addr] = { v: '', t: 's' }

      if (R === 0) {
        ws[addr].s = {
          fill:      { patternType: 'solid', fgColor: { rgb: PAL.titleBg } },
          font:      { bold: true, sz: 14, color: { rgb: PAL.titleFg }, name: 'Calibri' },
          alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
        }
      } else if (R === 1) {
        ws[addr].s = {
          fill:      { patternType: 'solid', fgColor: { rgb: PAL.subBg } },
          font:      { italic: true, sz: 9, color: { rgb: PAL.subFg }, name: 'Calibri' },
          alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
        }
      } else if (R === 2) {
        const center = [1, 2, 8].includes(C)
        ws[addr].s = {
          fill:      { patternType: 'solid', fgColor: { rgb: PAL.headerBg } },
          font:      { bold: true, sz: 10, color: { rgb: PAL.headerFg }, name: 'Calibri' },
          alignment: { horizontal: center ? 'center' : 'left', vertical: 'center', indent: center ? 0 : 1 },
          border:    { bottom: { style: 'medium', color: { rgb: PAL.headerUl } } },
        }
      } else {
        const isStart   = groupStarts.has(R)
        const isEnd     = groupEnds.has(R)
        const isProject = C === 3
        const isName    = C === 0
        const isCenter  = [1, 2, 8].includes(C)
        const isMuted   = [1, 2, 8].includes(C)
        ws[addr].s = {
          fill:  { patternType: 'solid', fgColor: { rgb: isStart ? PAL.groupBg : PAL.rowBg } },
          font:  {
            sz: 10, name: 'Calibri', bold: isName,
            color: { rgb: isProject ? PAL.accentFg : isMuted ? PAL.mutedFg : isName ? PAL.nameFg : PAL.textFg },
          },
          alignment: {
            horizontal: isCenter ? 'center' : 'left',
            vertical:   'top',
            wrapText:   true,
            indent:     (!isCenter && !isProject) ? 1 : 0,
          },
          border: {
            bottom: { style: 'thin', color: { rgb: isEnd ? PAL.groupEnd : PAL.divider } },
            ...(isProject ? { left: { style: 'medium', color: { rgb: PAL.accentBdr } } } : {}),
          },
        }
      }
    }
  }

  ws['!freeze'] = { xSplit: 0, ySplit: 3 }
}

function applySummaryStyles(ws) {
  if (!ws['!ref']) return
  const range = XLSX.utils.decode_range(ws['!ref'])

  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C })
      if (!ws[addr]) ws[addr] = { v: '', t: 's' }

      if (R === 0) {
        ws[addr].s = {
          fill:      { patternType: 'solid', fgColor: { rgb: PAL.titleBg } },
          font:      { bold: true, sz: 14, color: { rgb: PAL.titleFg }, name: 'Calibri' },
          alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
        }
      } else if (R === 1) {
        ws[addr].s = {
          fill:      { patternType: 'solid', fgColor: { rgb: PAL.subBg } },
          font:      { italic: true, sz: 9, color: { rgb: PAL.subFg }, name: 'Calibri' },
          alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
        }
      } else if (R === 2) {
        const center = [1, 2, 3, 8].includes(C)
        ws[addr].s = {
          fill:      { patternType: 'solid', fgColor: { rgb: PAL.headerBg } },
          font:      { bold: true, sz: 10, color: { rgb: PAL.headerFg }, name: 'Calibri' },
          alignment: { horizontal: center ? 'center' : 'left', vertical: 'center', indent: center ? 0 : 1 },
          border:    { bottom: { style: 'medium', color: { rgb: PAL.headerUl } } },
        }
      } else {
        const isAlt    = (R - 3) % 2 === 1
        const isName   = C === 0
        const isCount  = C === 3
        const isCenter = [1, 2, 3, 8].includes(C)
        const isMuted  = [1, 2, 8].includes(C)
        ws[addr].s = {
          fill:  { patternType: 'solid', fgColor: { rgb: isAlt ? PAL.altBg : PAL.rowBg } },
          font:  {
            sz: 10, name: 'Calibri',
            bold:  isName || isCount,
            color: { rgb: isCount ? PAL.accentFg : isMuted ? PAL.mutedFg : isName ? PAL.nameFg : PAL.textFg },
          },
          alignment: {
            horizontal: isCenter ? 'center' : 'left',
            vertical:   'center',
            wrapText:   true,
            indent:     !isCenter ? 1 : 0,
          },
          border: { bottom: { style: 'thin', color: { rgb: PAL.divider } } },
        }
      }
    }
  }

  ws['!freeze'] = { xSplit: 0, ySplit: 3 }
}

function exportToExcel({ entries, users, weekLabel, allWeeks }) {
  const getUser = id => users.find(u => u.id === id)
  const getName = id => getUser(id)?.name || 'Unknown'
  const getRole = id => (getUser(id)?.role || '').replace('_', ' ')
  const getDate = e  => e.updatedAt ? format(parseISO(e.updatedAt), 'yyyy-MM-dd') : ''

  const sorted = [...entries].sort((a, b) =>
    b.weekStart.localeCompare(a.weekStart) || getName(a.userId).localeCompare(getName(b.userId))
  )

  const exportDate = format(new Date(), 'MMMM d, yyyy  ·  h:mm a')
  const NCOLS = 9

  // ── Sheet 1: By Project ───────────────────────────────────────────────────
  const detailHeaders = [
    'Name', 'Role', 'Week', 'Project', 'Accomplished',
    'General Notes', 'Plans for Next Week', 'Blockers / Issues', 'Submitted',
  ]
  const detailDataRows = sorted.flatMap(e => {
    const projects = e.projectsWorked?.length ? e.projectsWorked : ['—']
    return projects.map(proj => [
      getName(e.userId),
      getRole(e.userId),
      e.weekStart,
      proj,
      (proj !== '—' && e.projectNotes?.[proj]) ? e.projectNotes[proj] : (e.accomplished || ''),
      e.accomplished || '',
      e.nextWeek    || '',
      e.blockers    || '',
      getDate(e),
    ])
  })

  const detailAoa = [
    ['RESEARCH LOGBOOK', ...Array(NCOLS - 1).fill('')],
    [`Exported  ${exportDate}     ${entries.length} entr${entries.length !== 1 ? 'ies' : 'y'}`, ...Array(NCOLS - 1).fill('')],
    detailHeaders,
    ...detailDataRows,
  ]

  const wsDetail = XLSX.utils.aoa_to_sheet(detailAoa)
  wsDetail['!cols'] = [
    { wch: 22 }, { wch: 14 }, { wch: 12 }, { wch: 42 },
    { wch: 46 }, { wch: 34 }, { wch: 36 }, { wch: 26 }, { wch: 13 },
  ]
  wsDetail['!rows'] = [
    { hpt: 38 }, { hpt: 22 }, { hpt: 28 },
    ...detailDataRows.map(() => ({ hpt: 54 })),
  ]

  const detailMerges = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: NCOLS - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: NCOLS - 1 } },
  ]
  let ri = 3
  sorted.forEach(e => {
    const n = Math.max((e.projectsWorked?.length || 0), 1)
    if (n > 1) {
      ;[0, 1, 2, 5, 6, 7, 8].forEach(c =>
        detailMerges.push({ s: { r: ri, c }, e: { r: ri + n - 1, c } })
      )
    }
    ri += n
  })
  wsDetail['!merges'] = detailMerges
  applyDetailStyles(wsDetail, sorted)

  // ── Sheet 2: Summary ──────────────────────────────────────────────────────
  const summaryHeaders = [
    'Name', 'Role', 'Week', 'Projects (#)', 'Projects',
    'Accomplished', 'Plans for Next Week', 'Blockers / Issues', 'Submitted',
  ]
  const summaryDataRows = sorted.map(e => [
    getName(e.userId),
    getRole(e.userId),
    e.weekStart,
    (e.projectsWorked || []).length || '',
    (e.projectsWorked || []).join('  ·  '),
    e.accomplished || '',
    e.nextWeek    || '',
    e.blockers    || '',
    getDate(e),
  ])

  const summaryAoa = [
    ['RESEARCH LOGBOOK  —  SUMMARY', ...Array(NCOLS - 1).fill('')],
    [`Exported  ${exportDate}     ${entries.length} entr${entries.length !== 1 ? 'ies' : 'y'}`, ...Array(NCOLS - 1).fill('')],
    summaryHeaders,
    ...summaryDataRows,
  ]

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryAoa)
  wsSummary['!cols'] = [
    { wch: 22 }, { wch: 14 }, { wch: 12 }, { wch: 12 },
    { wch: 40 }, { wch: 48 }, { wch: 38 }, { wch: 28 }, { wch: 13 },
  ]
  wsSummary['!rows'] = [
    { hpt: 38 }, { hpt: 22 }, { hpt: 28 },
    ...summaryDataRows.map(() => ({ hpt: 44 })),
  ]
  wsSummary['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: NCOLS - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: NCOLS - 1 } },
  ]
  applySummaryStyles(wsSummary)

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
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Projects worked on</p>
                  {entry.projectsWorked.map((p, i) => (
                    <div key={i} className="border border-brand-100 bg-brand-50/40 rounded-xl p-3">
                      <p className="text-xs font-semibold text-brand-600 mb-1">{p}</p>
                      {entry.projectNotes?.[p]
                        ? <p className="text-sm text-slate-700 whitespace-pre-wrap">{entry.projectNotes[p]}</p>
                        : <p className="text-xs text-slate-400 italic">No notes</p>
                      }
                    </div>
                  ))}
                </div>
              )}
              {entry.accomplished && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">General notes</p>
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
