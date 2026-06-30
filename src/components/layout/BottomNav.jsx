import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, LayoutGrid, Library, Globe, UserCircle,
  Menu, X, BookUser, ClipboardList, BookOpen, LogOut, ChevronRight,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

// Items always shown in the bottom bar (per role)
const BAR_ITEMS = {
  pi:      [
    { to: '/pi-dashboard', label: 'Overview',   icon: LayoutGrid,     end: false },
    { to: '/journals',     label: 'Journals',   icon: Library,        end: false },
    { to: '/congresses',   label: 'Congresses', icon: Globe,          end: false },
  ],
  student: [
    { to: '/',             label: 'Dashboard',  icon: LayoutDashboard, end: true  },
    { to: '/journals',     label: 'Journals',   icon: Library,        end: false },
    { to: '/congresses',   label: 'Congresses', icon: Globe,          end: false },
  ],
  default: [
    { to: '/',             label: 'Dashboard',  icon: LayoutDashboard, end: true  },
    { to: '/journals',     label: 'Journals',   icon: Library,        end: false },
    { to: '/congresses',   label: 'Congresses', icon: Globe,          end: false },
  ],
}

// Extra items shown only inside the "More" drawer (per role)
const MORE_ITEMS = {
  pi:      [
    { to: '/team',    label: 'Directory', icon: BookUser },
  ],
  student: [],
  admin: [
    { to: '/team',         label: 'Directory',    icon: BookUser     },
    { to: '/protocols',    label: 'Protocols',    icon: ClipboardList },
    { to: '/publications', label: 'Publications', icon: BookOpen     },
  ],
  research_fellow: [
    { to: '/team',         label: 'Directory',    icon: BookUser     },
    { to: '/protocols',    label: 'Protocols',    icon: ClipboardList },
    { to: '/publications', label: 'Publications', icon: BookOpen     },
  ],
}

export default function BottomNav() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const role = user?.role || 'default'
  const barItems = BAR_ITEMS[role] || BAR_ITEMS.default
  const moreItems = MORE_ITEMS[role] || []

  const linkClass = ({ isActive }) =>
    `flex flex-col items-center gap-0.5 px-3 py-2 text-xs font-medium transition-colors rounded-lg ${
      isActive ? 'text-emerald-400' : 'text-slate-400'
    }`

  function handleMore(to) {
    setOpen(false)
    navigate(to)
  }

  function handleLogout() {
    setOpen(false)
    logout()
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-up drawer */}
      {open && (
        <div className="fixed bottom-16 left-0 right-0 z-50 bg-slate-900 border-t border-slate-700 rounded-t-2xl shadow-2xl md:hidden">
          <div className="p-4">
            {/* Profile row */}
            <button
              onClick={() => handleMore('/profile')}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-800 transition-colors mb-2">
              <UserCircle size={20} className="text-slate-400 shrink-0" />
              <span className="text-sm font-medium text-white flex-1 text-left">Profile</span>
              <ChevronRight size={16} className="text-slate-500" />
            </button>

            {moreItems.length > 0 && (
              <div className="border-t border-slate-800 pt-2 mt-2 space-y-1">
                {moreItems.map(({ to, label, icon: Icon }) => (
                  <button
                    key={to}
                    onClick={() => handleMore(to)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-800 transition-colors">
                    <Icon size={20} className="text-slate-400 shrink-0" />
                    <span className="text-sm font-medium text-white flex-1 text-left">{label}</span>
                    <ChevronRight size={16} className="text-slate-500" />
                  </button>
                ))}
              </div>
            )}

            <div className="border-t border-slate-800 pt-2 mt-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-red-950 transition-colors text-red-400">
                <LogOut size={20} className="shrink-0" />
                <span className="text-sm font-medium flex-1 text-left">Sign out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-800 flex items-center justify-around safe-area-bottom md:hidden">
        {barItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={linkClass}>
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        ))}

        {/* More button */}
        <button
          onClick={() => setOpen(v => !v)}
          className={`flex flex-col items-center gap-0.5 px-3 py-2 text-xs font-medium transition-colors rounded-lg ${
            open ? 'text-emerald-400' : 'text-slate-400'
          }`}>
          {open ? <X size={22} /> : <Menu size={22} />}
          <span>More</span>
        </button>
      </nav>
    </>
  )
}
