import { getInitials, getAvatarColor } from '../../lib/utils'

export default function Avatar({ user, size = 'md', showName = false }) {
  const initials = getInitials(user?.name || '?')
  const color    = getAvatarColor(user?.id || '')

  const sizes = {
    xs:  { ring: 'w-6 h-6 text-xs',   text: 'text-xs' },
    sm:  { ring: 'w-8 h-8 text-xs',   text: 'text-sm' },
    md:  { ring: 'w-9 h-9 text-sm',   text: 'text-sm' },
    lg:  { ring: 'w-12 h-12 text-base', text: 'text-base' },
  }

  const s = sizes[size] || sizes.md

  return (
    <div className="flex items-center gap-2">
      <div className={`${color} ${s.ring} rounded-full flex items-center justify-center text-white font-semibold shrink-0`}>
        {initials}
      </div>
      {showName && user && (
        <span className={`font-medium text-slate-700 ${s.text}`}>{user.name}</span>
      )}
    </div>
  )
}
