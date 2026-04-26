import { Bell, Search } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Header({ title, subtitle, actions }) {
  const { user } = useAuth()

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-400 cursor-text w-48">
          <Search size={14} />
          <span>Search…</span>
        </div>
        <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          <Bell size={18} />
        </button>
      </div>
    </header>
  )
}
