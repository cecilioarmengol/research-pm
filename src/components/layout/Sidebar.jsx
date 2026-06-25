import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, BookUser, ClipboardList,
  Brain, LogOut, BookOpen, Library, LayoutGrid,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Avatar from '../ui/Avatar'

const navItems = [
  { to: '/',             label: 'Dashboard',    icon: LayoutDashboard, roles: ['admin', 'research_fellow', 'student'] },
  { to: '/team',         label: 'Directory',    icon: BookUser,         roles: ['admin', 'research_fellow', 'student'] },
  { to: '/protocols',    label: 'Protocols',    icon: ClipboardList,   roles: ['admin', 'research_fellow'] },
  { to: '/publications', label: 'Publications', icon: BookOpen },
  { to: '/journals',     label: 'Journals',     icon: Library },
]

const piNavItems = [
  { to: '/pi-dashboard', label: 'Overview',  icon: LayoutGrid },
  { to: '/team',         label: 'Directory', icon: BookUser   },
  { to: '/journals',     label: 'Journals',  icon: Library    },
]

const adminItems = [
  { to: '/admin', label: 'Team & Users', icon: Users },
]

export default function Sidebar() {
  const { user, logout } = useAuth()

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
      isActive
        ? 'bg-brand-500 text-white shadow-sm'
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`

  return (
    <aside className="w-60 bg-slate-900 flex flex-col h-screen sticky top-0 shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <Brain size={18} className="text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">ResearchFlow</div>
            <div className="text-slate-500 text-xs">Clinical PM</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-slate-600 text-xs uppercase font-semibold tracking-wider px-3 mb-2">Main</p>

        {user?.role === 'pi' ? (
          piNavItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={linkClass}>
              <Icon size={18} className="shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))
        ) : (
          <>
            {navItems.filter(item => !item.roles || item.roles.includes(user?.role)).map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} end={to === '/'} className={linkClass}>
                <Icon size={18} className="shrink-0" />
                <span>{label}</span>
              </NavLink>
            ))}
            {user?.role === 'admin' && (
              <>
                <p className="text-slate-600 text-xs uppercase font-semibold tracking-wider px-3 mb-2 mt-5">Admin</p>
                {adminItems.map(({ to, label, icon: Icon }) => (
                  <NavLink key={to} to={to} className={linkClass}>
                    <Icon size={18} className="shrink-0" />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </>
            )}
          </>
        )}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-slate-800">
        <NavLink to="/profile" className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-800 transition-colors group">
          <Avatar user={user} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            <p className="text-slate-500 text-xs capitalize">Edit profile</p>
          </div>
          <button
            onClick={e => { e.preventDefault(); logout() }}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 transition-colors"
            title="Sign out"
          >
            <LogOut size={15} />
          </button>
        </NavLink>
      </div>
    </aside>
  )
}
