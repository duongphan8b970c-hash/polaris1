import { getItemsForDate, getWeekDays, isToday, sortCalendarItems } from '../../utils/calendar'
import { isSameDay } from '../../utils/dateUtils'

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

function isItemDone(item) {
  return item.type === 'task' ? item.status === 'completed' : item.is_completed === true
}

/** Accent colour that says "this needs attention" before anything else. */
function getItemAccent(item) {
  if (isItemDone(item)) return 'border-l-green-400 bg-green-50/70'
  if (item.type === 'task' && item.is_overdue) return 'border-l-red-500 bg-red-50'
  if (item.type === 'task' && (item.is_blocked || item.status === 'blocked')) {
    return 'border-l-red-400 bg-gray-50 border-dashed'
  }
  if (item.type === 'task' && item.is_due_soon) return 'border-l-amber-400 bg-amber-50'
  if (item.type === 'subtask') return 'border-l-purple-400 bg-purple-50/60'
  return 'border-l-blue-400 bg-blue-50/60'
}

/**
 * Week view: 7 day columns side by side so parallel work in the week is obvious.
 * Column headers carry the per-day load so overloaded days stand out.
 */
export default function CalendarWeekView({ anchorDate, items, selectedDate, onDateClick }) {
  const days = getWeekDays(anchorDate)
  const perDay = days.map((day) => sortCalendarItems(getItemsForDate(items, day)))
  const peak = perDay.reduce((max, dayItems) => Math.max(max, dayItems.length), 0)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => {
          const dayItems = perDay[index]
          const done = dayItems.filter(isItemDone).length
          const overdue = dayItems.filter((item) => item.type === 'task' && item.is_overdue).length
          const selected = selectedDate && isSameDay(day, selectedDate)
          const today = isToday(day)
          const isWeekend = index === 0 || index === 6

          return (
            <button
              key={day.getTime()}
              onClick={() => onDateClick(day)}
              className={`flex flex-col text-left rounded-lg border-2 transition-all hover:shadow-md min-h-[220px] overflow-hidden ${
                selected
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : today
                  ? 'border-blue-300'
                  : overdue > 0
                  ? 'border-red-200'
                  : 'border-gray-200'
              } ${today ? 'bg-blue-50/40' : 'bg-white'}`}
            >
              {/* Day header + workload bar */}
              <div className={`px-2 pt-1.5 pb-1 border-b ${today ? 'border-blue-200' : 'border-gray-100'}`}>
                <div className="flex items-baseline justify-between">
                  <span className={`text-[11px] font-semibold ${isWeekend ? 'text-red-500' : 'text-gray-500'}`}>
                    {WEEKDAYS[day.getDay()]}
                  </span>
                  <span className={`text-base font-bold ${today ? 'text-blue-600' : 'text-gray-800'}`}>
                    {day.getDate()}
                  </span>
                </div>
                <div className="mt-1 h-1 bg-gray-100 rounded-full overflow-hidden" title={`${dayItems.length} việc`}>
                  <div
                    className={`h-full ${overdue > 0 ? 'bg-red-400' : dayItems.length > 0 ? 'bg-indigo-400' : ''}`}
                    style={{ width: peak > 0 ? `${(dayItems.length / peak) * 100}%` : 0 }}
                  />
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[10px] text-gray-500">
                    {dayItems.length > 0 ? `${done}/${dayItems.length}` : '—'}
                  </span>
                  {overdue > 0 && <span className="text-[10px] font-semibold text-red-600">⚠️ {overdue}</span>}
                </div>
              </div>

              {/* Items */}
              <div className="flex-1 p-1.5 space-y-1 overflow-y-auto">
                {dayItems.map((item, itemIndex) => (
                  <div
                    key={`${item.type}-${item.original_id}-${itemIndex}`}
                    className={`px-1.5 py-1 rounded border-l-4 text-[10px] leading-tight ${getItemAccent(item)}`}
                    title={
                      item.type === 'subtask'
                        ? `${item.title}\nTask: ${item.task?.title || '—'}\nGoal: ${item.goal?.name || '—'}`
                        : `${item.title}\nGoal: ${item.goal?.name || '—'}`
                    }
                  >
                    <p className={`font-medium truncate ${isItemDone(item) ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {item.type === 'subtask' && '└ '}
                      {item.title}
                    </p>
                    <p className="text-gray-500 truncate">
                      {item.type === 'subtask' && item.task?.title ? `${item.task.title} · ` : ''}
                      {item.goal?.icon} {item.goal?.name || 'Không thuộc goal'}
                    </p>
                  </div>
                ))}
                {dayItems.length === 0 && (
                  <p className="text-[10px] text-gray-300 text-center pt-4">Trống</p>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
