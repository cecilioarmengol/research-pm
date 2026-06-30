import { NavLink } from 'react-router-dom'
import { LayoutDashboard, LayoutGrid, BookUser, Library, Globe, UserCircle, ClipboardList, BookOpen } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const PI_ITEMS = [
  { to: '/pi-dashboard', label: 'Overview',   icon: LayoutGrid },
  { to: '/journals',     label: 'Journals',   icon: Library    },
  { to: '/congresses',   label: 'Congresses', icon: Globe      },
  { to: '/profile',      label: 'Profile',    icon: UserCircle },
]

const STUDENT_ITEMS = [
  { to: '/',           label: 'Dashboard',  icon: LayoutDashboard, end: true },
  { to: '/journals',   label: 'Journals',   icon: Library    },
  { to: '/congresses', label: 'Congresses', icon: Globe      },
  { to: '/profile',    label: 'Profile',    icon: UserCircle },
]

const DEFAULT_ITEMS = [
  { to: '/',             label: 'Dashboard',  icon: LayoutDashboard, end: true },
  { to: '/journals',     label: 'Journals',   icon: Library    },
  { to: '/congresses',   label: 'Congresses', icon: Globe      },
  { to: '/profile',      label: 'Profile',    icon: UserCircle },
]

export default function BottomNav() {
  const { user } = useAuth()

  const items =
    user?.role === 'pi'      ? PI_ITEMS      :
    user?.role === 'student' ? STUDENT_ITEMS :
    DEFAULT_ITEMS

  const linkClass = ({ isActive }) =>
    `flex flex-col items-center gap-0.5 px-4 py-2 text-xs font-medium transition-colors ${
      isActive ? 'text-brand-400' : 'text-slate-400 hover:text-white'
    }`

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-800 flex items-center justify-around safe-area-bottom md:hidden">
      {items.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} className={linkClass}>
          <Icon size={22} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
