import { isToday, getItemsForDate } from '../../utils/calendar'

export default function CalendarDay({ day, items, isSelected, onClick }) {
  // Get items for this specific date
  const dateItems = getItemsForDate(items, day.date)
  
  // Calculate stats
  const total = dateItems.length
  const completed = dateItems.filter(item => 
    item.type === 'task' 
      ? item.status === 'completed' 
      : item.is_completed === true
  ).length
  const percentage = total > 0 ? (completed / total) * 100 : 0

  // Determine color based on completion
  let color = 'gray'
  if (total === 0) {
    color = 'gray'
  } else if (percentage === 100) {
    color = 'green'
  } else if (percentage > 0) {
    color = 'yellow'
  } else {
    color = 'red'
  }

  const today = isToday(day.date)

  // Check if any multi-day task
  const hasMultiDay = dateItems.some(item => 
    item.type === 'task' && item.total_duration > 1
  )

  // Color classes for border
  const colorClasses = {
    gray: 'border-gray-200',
    green: 'border-green-300 bg-green-50',
    yellow: 'border-yellow-300 bg-yellow-50',
    red: 'border-red-300 bg-red-50'
  }

  // Dot colors for progress bar
  const dotColors = {
    gray: 'bg-gray-400',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500'
  }

  return (
    <button
      onClick={onClick}
      className={`
        relative h-20 border-2 rounded-lg transition-all hover:shadow-md
        ${day.isCurrentMonth ? 'bg-white' : 'bg-gray-100'}
        ${isSelected ? 'ring-2 ring-blue-500 border-blue-500' : colorClasses[color]}
        ${today ? 'ring-2 ring-blue-400' : ''}
        ${hasMultiDay ? 'border-l-4 border-l-purple-500' : ''}
      `}
    >
      {/* Date Number */}
      <div className="absolute top-1 left-2">
        <span className={`
          text-sm font-semibold
          ${!day.isCurrentMonth ? 'text-gray-400' : today ? 'text-blue-600' : 'text-gray-700'}
        `}>
          {day.date.getDate()}
        </span>
      </div>

      {/* Completion Indicator */}
      {total > 0 && (
        <div className="absolute bottom-1 left-0 right-0 px-2">
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-1">
            <div
              className={`h-full transition-all ${dotColors[color]}`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Count */}
          <div className="text-center">
            <span className={`text-[10px] font-bold ${
              color === 'green' ? 'text-green-700' :
              color === 'yellow' ? 'text-yellow-700' :
              color === 'red' ? 'text-red-700' :
              'text-gray-600'
            }`}>
              {completed}/{total}
            </span>
          </div>
        </div>
      )}

      {/* Today Badge */}
      {today && (
        <div className="absolute top-1 right-1">
          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        </div>
      )}

      {/* Multi-day Task Indicator */}
      {hasMultiDay && (
        <div className="absolute top-1 right-1" style={{ right: today ? '12px' : '4px' }}>
          <span className="text-[10px] bg-purple-100 text-purple-700 px-1 rounded font-bold">
            📅
          </span>
        </div>
      )}
    </button>
  )
}