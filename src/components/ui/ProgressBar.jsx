export default function ProgressBar({ value = 0, showLabel = true, size = 'md', colorOverride }) {
  const clampedValue = Math.min(100, Math.max(0, value))

  const color = colorOverride
    ? colorOverride
    : clampedValue === 100  ? '#10b981'
    : clampedValue >= 60    ? '#6366f1'
    : clampedValue >= 30    ? '#3b82f6'
    : '#94a3b8'

  const heights = { sm: 'h-1.5', md: 'h-2', lg: 'h-3' }

  return (
    <div className="flex items-center gap-3 w-full">
      <div className={`flex-1 bg-slate-100 rounded-full overflow-hidden ${heights[size]}`}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${clampedValue}%`, backgroundColor: color }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-semibold text-slate-500 w-9 text-right shrink-0">
          {clampedValue}%
        </span>
      )}
    </div>
  )
}
