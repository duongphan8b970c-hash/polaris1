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

  // Risk signals: what on this day needs attention?
  const overdue = dateItems.filter(item => item.type === 'task' && item.is_overdue).length
  const blocked = dateItems.filter(
    item => item.type === 'task' && item.status !== 'completed' && (item.is_blocked || item.status === 'blocked')
  ).length
  const dueSoon = dateItems.filter(item => item.type === 'task' && item.is_due_soon).length

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
      title={
        total === 0
          ? undefined
          : [
              `${completed}/${total} việc hoàn thành`,
              overdue > 0 ? `${overdue} task quá hạn` : null,
              dueSoon > 0 ? `${dueSoon} task sắp đến hạn` : null,
              blocked > 0 ? `${blocked} task bị chặn` : null,
            ]
              .filter(Boolean)
              .join('\n')
      }
      className={`
        relative h-24 border-2 rounded-lg transition-all hover:shadow-md
        ${day.isCurrentMonth ? 'bg-white' : 'bg-gray-100'}
        ${isSelected ? 'ring-2 ring-blue-500 border-blue-500' : colorClasses[color]}
        ${today ? 'ring-2 ring-blue-400' : ''}
        ${overdue > 0 && !isSelected ? 'border-l-4 border-l-red-500' : ''}
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

      {/* Risk flags */}
      <div className="absolute top-1 right-1 flex items-center gap-0.5">
        {today && <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse" />}
        {overdue > 0 && (
          <span className="text-[10px] bg-red-100 text-red-700 px-1 rounded font-bold leading-tight">
            ⚠️{overdue}
          </span>
        )}
        {blocked > 0 && (
          <span className="text-[10px] bg-gray-200 text-gray-700 px-1 rounded font-bold leading-tight">
            🚫{blocked}
          </span>
        )}
      </div>

      {/* Goal colour dots — which goals land on this day */}
      {total > 0 && (
        <div className="absolute top-6 left-0 right-0 px-2 flex flex-wrap gap-0.5 justify-center">
          {dateItems.slice(0, 8).map((item, index) => (
            <span
              key={`${item.type}-${item.original_id}-${index}`}
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: item.goal?.color || '#9ca3af', opacity: item.type === 'subtask' ? 0.55 : 1 }}
            />
          ))}
          {total > 8 && <span className="text-[8px] text-gray-400 leading-none">+{total - 8}</span>}
        </div>
      )}

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
    </button>
  )
}
