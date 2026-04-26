import { Bell, FlaskConical } from 'lucide-react'

export default function Header({ title, subtitle, actions }) {
  return (
    <header className="h-14 md:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-10">
      {/* Mobile: show logo + title. Desktop: title + subtitle */}
      <div className="flex items-center gap-3">
        {/* Logo icon — only on mobile */}
        <div className="flex md:hidden items-center justify-center w-7 h-7 bg-brand-500 rounded-lg shrink-0">
          <FlaskConical size={15} className="text-white" />
        </div>
        <div>
          <h1 className="text-base md:text-lg font-semibold text-slate-900 leading-tight">{title}</h1>
          {subtitle && <p className="hidden md:block text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {actions}
        <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          <Bell size={18} />
        </button>
      </div>
    </header>
  )
}
