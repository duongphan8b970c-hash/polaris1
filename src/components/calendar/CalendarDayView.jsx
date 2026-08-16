import { getItemsForDate, isToday, sortCalendarItems } from '../../utils/calendar'
import { getDueStatus } from '../../utils/taskHealth'
import DueDateBadge from '../common/DueDateBadge'
import BlockedBadge from '../common/BlockedBadge'

function isItemDone(item) {
  return item.type === 'task' ? item.status === 'completed' : item.is_completed === true
}

/**
 * Day view: everything scheduled for one day, grouped by goal so it is obvious
 * which goal each task (and each subtask's parent task) belongs to.
 */
export default function CalendarDayView({ date, items, onToggleItem, updating = {} }) {
  const dayItems = sortCalendarItems(getItemsForDate(items, date))

  // Group by goal, keeping an "no goal" bucket last.
  const groups = new Map()
  dayItems.forEach((item) => {
    const goalId = item.goal?.id || '__none__'
    if (!groups.has(goalId)) {
      groups.set(goalId, { goal: item.goal || null, items: [] })
    }
    groups.get(goalId).items.push(item)
  })

  const orderedGroups = Array.from(groups.values()).sort((a, b) => {
    if (!a.goal) return 1
    if (!b.goal) return -1
    return (a.goal.name || '').localeCompare(b.goal.name || '', 'vi')
  })

  const dateLabel = date.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const doneCount = dayItems.filter(isItemDone).length
  const overdueCount = dayItems.filter((item) => item.type === 'task' && item.is_overdue).length

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div
        className={`px-4 py-3 border-b ${
          isToday(date) ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              {isToday(date) && '🔥 '}
              {dateLabel}
            </h3>
            <p className="text-xs text-gray-600 mt-0.5">
              {dayItems.length} việc · {doneCount} hoàn thành
              {overdueCount > 0 && <span className="text-red-600 font-medium"> · {overdueCount} quá hạn</span>}
            </p>
          </div>
          {dayItems.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{ width: `${(doneCount / dayItems.length) * 100}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-700">
                {Math.round((doneCount / dayItems.length) * 100)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Groups */}
      {dayItems.length === 0 ? (
        <div className="py-16 text-center">
          <div className="text-5xl mb-3">🎉</div>
          <p className="text-gray-600 font-medium">Không có công việc nào trong ngày này</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {orderedGroups.map((group) => (
            <div key={group.goal?.id || 'none'} className="p-3">
              {/* Goal header */}
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-1 h-5 rounded-full"
                  style={{ backgroundColor: group.goal?.color || '#9ca3af' }}
                />
                <span className="text-sm">{group.goal?.icon || '📌'}</span>
                <span className="text-sm font-semibold text-gray-900">
                  {group.goal?.name || 'Không thuộc mục tiêu nào'}
                </span>
                <span className="text-xs text-gray-500">({group.items.length})</span>
              </div>

              <div className="space-y-1.5 pl-4">
                {group.items.map((item, index) => (
                  <DayItemRow
                    key={`${item.type}-${item.original_id}-${index}`}
                    item={item}
                    onToggle={onToggleItem}
                    isUpdating={updating[`${item.type}-${item.original_id}`] || false}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DayItemRow({ item, onToggle, isUpdating }) {
  const isDone = isItemDone(item)
  const isTask = item.type === 'task'
  const isBlocked = isTask && !isDone && (item.is_blocked || item.status === 'blocked')
  const due = isTask ? getDueStatus(item.due_date || item.scheduled_date, { isCompleted: isDone }) : null

  return (
    <div
      className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-colors ${
        isDone
          ? 'border-gray-200 bg-gray-50/60'
          : item.is_overdue
          ? 'border-red-200 bg-red-50/60'
          : isBlocked
          ? 'border-red-200 border-dashed bg-white'
          : 'border-gray-200 bg-white hover:bg-gray-50'
      }`}
    >
      <button
        onClick={() => onToggle?.(item)}
        disabled={isUpdating}
        className={`shrink-0 mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors disabled:opacity-50 ${
          isDone ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-green-400'
        }`}
        title={isDone ? 'Đánh dấu chưa xong' : 'Đánh dấu hoàn thành'}
      >
        {isUpdating ? (
          <span className="w-2 h-2 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          isDone && (
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${isDone ? 'line-through text-gray-400' : 'text-gray-900'}`}>
          {!isTask && '└ '}
          {item.title}
        </p>

        {/* Explicit parentage: subtask → task → goal, task → goal */}
        <p className="text-xs text-gray-500 mt-0.5">
          {isTask ? (
            <>Task của goal <strong className="text-gray-700">{item.goal?.name || '—'}</strong></>
          ) : (
            <>
              Subtask của task <strong className="text-gray-700">{item.task?.title || '—'}</strong>
              {' · goal '}
              <strong className="text-gray-700">{item.goal?.name || '—'}</strong>
            </>
          )}
        </p>

        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
              isTask ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
            }`}
          >
            {isTask ? 'Task' : 'Subtask'}
          </span>
          {item.is_recurring_instance && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-100 text-indigo-700">🔁 Lặp lại</span>
          )}
          {due && due.days !== null && <DueDateBadge date={item.due_date || item.scheduled_date} isCompleted={isDone} compact />}
          {isBlocked && item.blocked_by && <BlockedBadge blockedBy={item.blocked_by} compact />}
        </div>
      </div>
    </div>
  )
}
