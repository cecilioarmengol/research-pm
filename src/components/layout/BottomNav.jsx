import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FolderKanban, Users, UserCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function BottomNav() {
  const { user } = useAuth()

  const linkClass = ({ isActive }) =>
    `flex flex-col items-center gap-0.5 px-4 py-2 text-xs font-medium transition-colors ${
      isActive ? 'text-brand-400' : 'text-slate-400 hover:text-white'
    }`

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-800 flex items-center justify-around safe-area-bottom md:hidden">
      <NavLink to="/" end className={linkClass}>
        <LayoutDashboard size={22} />
        <span>Dashboard</span>
      </NavLink>

      <NavLink to="/projects" className={linkClass}>
        <FolderKanban size={22} />
        <span>Projects</span>
      </NavLink>

      {user?.role === 'admin' && (
        <NavLink to="/admin" className={linkClass}>
          <Users size={22} />
          <span>Team</span>
        </NavLink>
      )}

      <NavLink to="/profile" className={linkClass}>
        <UserCircle size={22} />
        <span>Profile</span>
      </NavLink>
    </nav>
  )
}
