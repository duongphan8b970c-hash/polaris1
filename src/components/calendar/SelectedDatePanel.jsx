import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sortCalendarItems } from '../../utils/calendar'
import { formatDateString } from '../../utils/dateUtils'
import { getDueStatus } from '../../utils/taskHealth'
import DueDateBadge from '../common/DueDateBadge'
import BlockedBadge from '../common/BlockedBadge'

const TABS = [
  { value: 'day', label: 'Ngày đã chọn', icon: '📝' },
  { value: 'upcoming', label: 'Còn lại trong tháng', icon: '📅' },
]

function isItemDone(item) {
  return item.type === 'task' ? item.status === 'completed' : item.is_completed === true
}

/**
 * The right-hand column of the calendar: tasks & subtasks for the selected date,
 * always visible next to the calendar so picking a day needs no scrolling.
 *
 * Every row states its parentage explicitly — a subtask names its task *and* its
 * goal, a task names its goal.
 */
export default function SelectedDatePanel({
  date,
  items,
  allMonthItems,
  defaultTab = 'day',
  onCheckIn,
  updating = {},
}) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const navigate = useNavigate()

  const dayItems = useMemo(() => sortCalendarItems(items), [items])

  const remainingByDate = useMemo(() => {
    if (!allMonthItems) return []
    const grouped = new Map()
    allMonthItems.forEach((item) => {
      if (!item.instance_date || isItemDone(item)) return
      if (!grouped.has(item.instance_date)) grouped.set(item.instance_date, [])
      grouped.get(item.instance_date).push(item)
    })
    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateKey, dateItems]) => ({ dateKey, items: sortCalendarItems(dateItems) }))
  }, [allMonthItems])

  const doneCount = dayItems.filter(isItemDone).length
  const todayKey = formatDateString(new Date())

  const dateLabel = date.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col max-h-[calc(100vh-7rem)] lg:sticky lg:top-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 m-3 mb-0 p-1 rounded-lg shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'day' ? (
        <>
          {/* Selected-date header */}
          <div className="px-3 pt-3 pb-2 shrink-0">
            <h3 className="text-sm font-bold text-gray-900">{dateLabel}</h3>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: dayItems.length ? `${(doneCount / dayItems.length) * 100}%` : 0 }}
                />
              </div>
              <span className="text-xs text-gray-600 whitespace-nowrap">
                {doneCount}/{dayItems.length} việc
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5">
            {dayItems.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-4xl mb-2">🎉</div>
                <p className="text-sm text-gray-600 font-medium">Không có công việc nào</p>
                <p className="text-xs text-gray-500 mt-1">Chọn một ngày khác trên calendar</p>
              </div>
            ) : (
              dayItems.map((item, index) => (
                <PanelItem
                  key={`${item.type}-${item.original_id}-${index}`}
                  item={item}
                  onCheckIn={onCheckIn}
                  isUpdating={updating[`${item.type}-${item.original_id}`] || false}
                  onNavigate={navigate}
                />
              ))
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {remainingByDate.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-2">✨</div>
              <p className="text-sm text-gray-600 font-medium">Không còn việc nào trong tháng</p>
            </div>
          ) : (
            remainingByDate.map(({ dateKey, items: dateItems }) => {
              const isPast = dateKey < todayKey
              const isCurrent = dateKey === todayKey
              const dayDate = new Date(`${dateKey}T00:00:00`)

              return (
                <div key={dateKey}>
                  <div
                    className={`flex items-center justify-between gap-2 px-2 py-1 rounded-lg mb-1.5 ${
                      isCurrent
                        ? 'bg-blue-50 border border-blue-200'
                        : isPast
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-gray-50'
                    }`}
                  >
                    <span
                      className={`text-xs font-bold ${
                        isCurrent ? 'text-blue-700' : isPast ? 'text-red-700' : 'text-gray-700'
                      }`}
                    >
                      {isCurrent ? '🔥 Hôm nay' : isPast ? '⚠️ Quá hạn' : '📌'}{' '}
                      {dayDate.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })}
                    </span>
                    <span className="text-[10px] text-gray-600">{dateItems.length} việc</span>
                  </div>
                  <div className="space-y-1.5">
                    {dateItems.map((item, index) => (
                      <PanelItem
                        key={`${dateKey}-${item.type}-${item.original_id}-${index}`}
                        item={item}
                        onCheckIn={onCheckIn}
                        isUpdating={updating[`${item.type}-${item.original_id}`] || false}
                        onNavigate={navigate}
                      />
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

function PanelItem({ item, onCheckIn, isUpdating, onNavigate }) {
  const isDone = isItemDone(item)
  const isTask = item.type === 'task'
  const isBlocked = isTask && !isDone && (item.is_blocked || item.status === 'blocked')
  const deadline = isTask ? item.due_date || item.scheduled_date : null
  const due = deadline ? getDueStatus(deadline, { isCompleted: isDone }) : null

  const goToDetail = () => {
    const goalId = item.goal?.id || item.goal_id
    const taskId = isTask ? item.original_id : item.task_id
    if (goalId && taskId) onNavigate(`/goals/${goalId}/tasks/${taskId}`)
  }

  return (
    <div
      className={`flex items-start gap-2 p-2 rounded-lg border transition-colors ${
        isDone
          ? 'border-gray-200 bg-gray-50/60'
          : item.is_overdue
          ? 'border-red-200 bg-red-50/60'
          : isBlocked
          ? 'border-red-200 border-dashed bg-white'
          : 'border-gray-200 bg-white hover:bg-gray-50'
      }`}
      style={{ borderLeftWidth: '3px', borderLeftColor: item.goal?.color || '#d1d5db' }}
    >
      <button
        onClick={() => onCheckIn?.(item)}
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

      <button onClick={goToDetail} className="flex-1 min-w-0 text-left">
        <p className={`text-xs font-semibold ${isDone ? 'line-through text-gray-400' : 'text-gray-900'}`}>
          {!isTask && '└ '}
          {item.title}
        </p>

        {/* Which task / goal does this belong to? */}
        <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
          {isTask ? (
            <>
              <span className="text-gray-400">Task · goal</span>{' '}
              <span className="text-gray-700 font-medium">
                {item.goal?.icon} {item.goal?.name || '—'}
              </span>
            </>
          ) : (
            <>
              <span className="text-gray-400">Subtask · task</span>{' '}
              <span className="text-gray-700 font-medium">{item.task?.title || '—'}</span>
              <br />
              <span className="text-gray-400">goal</span>{' '}
              <span className="text-gray-700 font-medium">
                {item.goal?.icon} {item.goal?.name || '—'}
              </span>
            </>
          )}
        </p>

        <div className="flex flex-wrap items-center gap-1 mt-1">
          {due && due.days !== null && <DueDateBadge date={deadline} isCompleted={isDone} compact />}
          {isBlocked && item.blocked_by && <BlockedBadge blockedBy={item.blocked_by} compact />}
          {item.is_recurring_instance && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-100 text-indigo-700">🔁</span>
          )}
        </div>
      </button>
    </div>
  )
}
