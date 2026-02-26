import getDateStats from '../../utils/getDateStats'
import getDateColor from '../../utils/getDateColor'
import { isToday } from 'date-fns'

export default function CalendarDay({ day, items, isSelected, onClick }) {
  const stats = getDateStats(items, day.date)
  const color = getDateColor(stats)
  const today = isToday(day.date)

  // ✅ Check if any multi-day task
  const hasMultiDay = items.some(item => 
    item.type === 'task' && item.total_duration > 1
  )

  return (
    <button
      onClick={onClick}
      className={`
        relative h-20 border-2 rounded-lg transition-all hover:shadow-md
        ${day.isCurrentMonth ? 'bg-white' : 'bg-gray-100'}
        ${isSelected ? 'ring-2 ring-blue-500 border-blue-500' : colorClasses[color]}
        ${today ? 'ring-2 ring-blue-400' : ''}
        ${hasMultiDay ? 'border-l-4 border-l-purple-500' : ''} // ✅ Visual indicator
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
      {stats.total > 0 && (
        <div className="absolute bottom-1 left-0 right-0 px-2">
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-1">
            <div
              className={`h-full transition-all ${dotColors[color]}`}
              style={{ width: `${stats.percentage}%` }}
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
              {stats.completed}/{stats.total}
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
    </button>
  )
}