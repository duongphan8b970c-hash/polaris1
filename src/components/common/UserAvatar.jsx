export default function UserAvatar({ userId, size = 'md', showTooltip = true }) {
  const sizeClasses = {
    xs: 'w-5 h-5 text-[10px]',
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  }

  // Generate color from userId
  const getColorFromId = (id) => {
    if (!id) return '#94a3b8' // gray-400
    const colors = [
      '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
      '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
      '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
      '#ec4899', '#f43f5e',
    ]
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  // Get initials from userId (first 2 chars)
  const getInitials = (id) => {
    if (!id) return '?'
    return id.substring(0, 2).toUpperCase()
  }

  const bgColor = getColorFromId(userId)
  const initials = getInitials(userId)

  return (
    <div className="relative group">
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-semibold`}
        style={{ backgroundColor: bgColor }}
      >
        {initials}
      </div>
      
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
          User: {userId.substring(0, 8)}...
        </div>
      )}
    </div>
  )
}