import { useEffect, useMemo, useRef } from 'react'
import {
  ZOOM_LEVELS,
  buildDayCells,
  buildMonthSegments,
  buildWorkloadPerDay,
  createTimelineScale,
} from '../../utils/timelineScale'
import { getDueStatus, getTaskDeadline } from '../../utils/taskHealth'
import DueDateBadge from '../common/DueDateBadge'

const LABEL_WIDTH = 300
const ROW_HEIGHT = 34
const HEADER_HEIGHT = 64

/** Visual treatment for a task bar, in priority order of "what should worry me". */
function getTaskBarStyle(task, goalColor) {
  if (task.status === 'completed') {
    return {
      className: 'bg-green-500/70 border border-green-600',
      tone: 'completed',
      badge: '✓',
    }
  }
  if (task.is_overdue) {
    return {
      className: 'bg-red-500 border border-red-700 ring-1 ring-red-300',
      tone: 'overdue',
      badge: '⚠️',
    }
  }
  if (task.is_blocked || task.status === 'blocked') {
    return {
      className: 'bg-gray-300 border-2 border-dashed border-red-400',
      tone: 'blocked',
      badge: '🚫',
    }
  }
  if (task.is_due_soon) {
    return {
      className: 'bg-amber-400 border border-amber-600',
      tone: 'due_soon',
      badge: '⏳',
    }
  }
  return {
    className: 'border',
    tone: 'normal',
    badge: '',
    style: { backgroundColor: goalColor || '#3b82f6', borderColor: goalColor || '#2563eb' },
  }
}

function GoalBar({ goal, scale }) {
  if (!goal.window) return null
  const bar = scale.barFor(goal.window.start, goal.window.end)
  if (!bar) return null

  const progress = Math.max(0, Math.min(100, Number(goal.progress) || 0))
  const plannedEndOffset = goal.window.plannedEnd ? scale.offsetFor(goal.window.plannedEnd) : null

  return (
    <>
      <div
        className="absolute top-1/2 -translate-y-1/2 h-4 rounded-md overflow-hidden shadow-sm"
        style={{
          left: bar.left,
          width: bar.width,
          backgroundColor: `${goal.color || '#6b7280'}33`,
          border: `1px solid ${goal.color || '#6b7280'}`,
        }}
        title={`${goal.name} · ${progress.toFixed(0)}% · ${goal.health.meta.label}`}
      >
        <div
          className="h-full"
          style={{ width: `${progress}%`, backgroundColor: goal.color || '#6b7280', opacity: 0.65 }}
        />
      </div>
      {/* Planned target date marker on the parent bar */}
      {plannedEndOffset !== null && (
        <div
          className="absolute top-1/2 -translate-y-1/2 h-5 w-0.5 bg-gray-700"
          style={{ left: plannedEndOffset }}
          title={`Hạn mục tiêu: ${goal.window.plannedEnd.toLocaleDateString('vi-VN')}`}
        />
      )}
    </>
  )
}

function TaskBar({ task, goalColor, scale, onSelect }) {
  if (!task.window) return null
  const bar = scale.barFor(task.window.start, task.window.end)
  if (!bar) return null

  const style = getTaskBarStyle(task, goalColor)
  const due = getDueStatus(getTaskDeadline(task), { isCompleted: task.status === 'completed' })

  return (
    <button
      type="button"
      onClick={() => onSelect?.(task)}
      className={`absolute top-1/2 -translate-y-1/2 h-5 rounded flex items-center gap-1 px-1 text-left overflow-hidden hover:brightness-95 hover:ring-2 hover:ring-blue-300 transition-all ${style.className}`}
      style={{ left: bar.left, width: bar.width, ...(style.style || {}) }}
      title={`${task.title}\n${due.label}${task.blocked_by ? `\nChờ: ${task.blocked_by.title}` : ''}`}
    >
      {style.badge && <span className="text-[9px] leading-none shrink-0">{style.badge}</span>}
      <span
        className={`text-[10px] font-medium truncate ${
          style.tone === 'blocked' ? 'text-gray-700' : 'text-white'
        }`}
      >
        {task.title}
      </span>
    </button>
  )
}

function SubtaskMarker({ subtask, goalColor, scale }) {
  if (!subtask.date) return null
  const bar = scale.barFor(subtask.date, subtask.date)
  if (!bar) return null

  return (
    <div
      className={`absolute top-1/2 -translate-y-1/2 h-3 rounded-sm ${
        subtask.is_completed ? 'bg-green-400' : 'bg-purple-400'
      }`}
      style={{ left: bar.left, width: bar.width, borderColor: goalColor }}
      title={`${subtask.title} · ${subtask.date.toLocaleDateString('vi-VN')}`}
    />
  )
}

/**
 * Goal → Task → Subtask Gantt chart.
 *
 * Each item gets its own row, so tasks that run in parallel are visible as
 * overlapping bars in the same date columns. A workload strip above the rows
 * shows how many open tasks land on each day.
 */
export default function TimelineChart({
  rows,
  scale: scaleConfig,
  zoom = 'week',
  onToggleGoal,
  onSelectTask,
  today = new Date(),
}) {
  const scrollRef = useRef(null)
  // Remembers which (zoom, range) combination we have already centred, so
  // scrolling only happens when the axis actually changes.
  const centeredKeyRef = useRef(null)

  const zoomLevel = ZOOM_LEVELS[zoom] || ZOOM_LEVELS.week
  const scale = useMemo(
    () => createTimelineScale(scaleConfig.start, scaleConfig.end, zoomLevel.dayWidth),
    [scaleConfig.start, scaleConfig.end, zoomLevel.dayWidth]
  )

  const dayCells = useMemo(() => buildDayCells(scale, today), [scale, today])
  const monthSegments = useMemo(() => buildMonthSegments(scale), [scale])
  const todayOffset = useMemo(() => scale.offsetFor(today), [scale, today])

  const openTasks = useMemo(
    () => rows.filter((row) => row.kind === 'task' && row.task.status !== 'completed').map((row) => row.task),
    [rows]
  )
  const workload = useMemo(() => buildWorkloadPerDay(scale, openTasks), [scale, openTasks])

  // Scroll today into view when the chart mounts or the axis changes.
  useEffect(() => {
    const key = `${zoom}-${scale.start.getTime()}-${scale.end.getTime()}`
    if (centeredKeyRef.current === key || todayOffset === null || !scrollRef.current) return
    const el = scrollRef.current
    el.scrollLeft = Math.max(0, todayOffset - el.clientWidth / 3)
    centeredKeyRef.current = key
  }, [zoom, scale, todayOffset])

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="text-5xl mb-3">🗓️</div>
        <p className="text-gray-700 font-medium">Không có mục nào khớp bộ lọc</p>
        <p className="text-sm text-gray-500 mt-1">
          Timeline chỉ hiển thị task có ngày bắt đầu hoặc hạn chót. Hãy bổ sung ngày cho task, hoặc nới bộ lọc.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div ref={scrollRef} className="overflow-auto max-h-[72vh]">
        <div className="relative" style={{ width: LABEL_WIDTH + scale.width, minWidth: '100%' }}>
          {/* ── Header: months + days + workload strip ── */}
          <div
            className="sticky top-0 z-30 flex bg-gray-50 border-b border-gray-200"
            style={{ height: HEADER_HEIGHT }}
          >
            <div
              className="sticky left-0 z-40 shrink-0 bg-gray-50 border-r border-gray-200 flex items-end px-3 pb-1"
              style={{ width: LABEL_WIDTH }}
            >
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Mục tiêu / Task / Subtask
              </span>
            </div>

            <div className="relative" style={{ width: scale.width }}>
              {/* Months */}
              <div className="relative h-6 border-b border-gray-200">
                {monthSegments.map((segment) => (
                  <div
                    key={segment.key}
                    className="absolute top-0 h-6 flex items-center border-r border-gray-200 px-1.5"
                    style={{ left: segment.left, width: segment.width }}
                  >
                    <span className="text-[11px] font-semibold text-gray-700 truncate">{segment.label}</span>
                  </div>
                ))}
              </div>

              {/* Days */}
              <div className="relative h-6 border-b border-gray-200">
                {zoomLevel.showDayNumbers &&
                  dayCells.map((cell) => (
                    <div
                      key={cell.date.getTime()}
                      className={`absolute top-0 h-6 flex flex-col items-center justify-center ${
                        cell.isToday ? 'bg-blue-100' : cell.isWeekend ? 'bg-gray-100' : ''
                      }`}
                      style={{ left: cell.left, width: scale.dayWidth }}
                    >
                      <span
                        className={`text-[9px] leading-none ${
                          cell.isToday ? 'font-bold text-blue-700' : cell.isWeekend ? 'text-red-400' : 'text-gray-500'
                        }`}
                      >
                        {cell.label}
                      </span>
                      {scale.dayWidth >= 40 && (
                        <span className="text-[8px] leading-none text-gray-400">{cell.weekdayLabel}</span>
                      )}
                    </div>
                  ))}
              </div>

              {/* Workload: how many open tasks run on each day */}
              <div className="relative h-4 bg-white" title="Khối lượng công việc song song mỗi ngày">
                {workload.counts.map((count, index) =>
                  count > 0 ? (
                    <div
                      key={index}
                      className="absolute bottom-0 bg-indigo-400/70"
                      style={{
                        left: index * scale.dayWidth,
                        width: Math.max(1, scale.dayWidth - 1),
                        height: `${Math.max(12, (count / Math.max(workload.peak, 1)) * 100)}%`,
                      }}
                      title={`${count} task song song`}
                    />
                  ) : null
                )}
              </div>
            </div>
          </div>

          {/* ── Rows ── */}
          <div className="relative">
            {/* Weekend / month gridlines + today line, drawn behind the rows */}
            <div
              className="absolute inset-y-0 pointer-events-none z-0"
              style={{ left: LABEL_WIDTH, width: scale.width }}
            >
              {dayCells.map((cell) =>
                cell.isWeekend || cell.isMonthStart ? (
                  <div
                    key={cell.date.getTime()}
                    className={`absolute inset-y-0 ${cell.isMonthStart ? 'border-l border-gray-200' : 'bg-gray-50'}`}
                    style={{ left: cell.left, width: cell.isMonthStart ? 1 : scale.dayWidth }}
                  />
                ) : null
              )}
              {todayOffset !== null && (
                <div className="absolute inset-y-0 z-10" style={{ left: todayOffset }}>
                  <div className="w-0.5 h-full bg-blue-500" />
                </div>
              )}
            </div>

            {rows.map((row) => (
              <TimelineRow
                key={row.key}
                row={row}
                scale={scale}
                onToggleGoal={onToggleGoal}
                onSelectTask={onSelectTask}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 border-t border-gray-200 bg-gray-50 text-[11px] text-gray-600">
        <span className="flex items-center gap-1"><span className="w-3 h-2.5 rounded bg-blue-500" /> Đúng tiến độ</span>
        <span className="flex items-center gap-1"><span className="w-3 h-2.5 rounded bg-amber-400" /> Sắp đến hạn</span>
        <span className="flex items-center gap-1"><span className="w-3 h-2.5 rounded bg-red-500" /> Quá hạn</span>
        <span className="flex items-center gap-1"><span className="w-3 h-2.5 rounded bg-gray-300 border-2 border-dashed border-red-400" /> Bị chặn</span>
        <span className="flex items-center gap-1"><span className="w-3 h-2.5 rounded bg-green-500/70" /> Hoàn thành</span>
        <span className="flex items-center gap-1"><span className="w-3 h-2.5 rounded bg-purple-400" /> Subtask</span>
        <span className="flex items-center gap-1"><span className="w-0.5 h-3 bg-blue-500" /> Hôm nay</span>
        <span className="flex items-center gap-1"><span className="w-3 h-2.5 bg-indigo-400/70" /> Khối lượng/ngày</span>
      </div>
    </div>
  )
}

function TimelineRow({ row, scale, onToggleGoal, onSelectTask }) {
  const isGoal = row.kind === 'goal'

  return (
    <div
      className={`flex border-b border-gray-100 ${
        isGoal ? 'bg-gray-50/80' : row.kind === 'subtask' ? 'bg-white' : 'bg-white hover:bg-blue-50/40'
      }`}
      style={{ height: ROW_HEIGHT }}
    >
      {/* Sticky label column */}
      <div
        className={`sticky left-0 z-20 shrink-0 flex items-center gap-1.5 px-2 border-r border-gray-200 ${
          isGoal ? 'bg-gray-50' : 'bg-white'
        }`}
        style={{ width: LABEL_WIDTH, paddingLeft: 8 + row.depth * 18 }}
      >
        {isGoal ? (
          <>
            <button
              type="button"
              onClick={() => onToggleGoal?.(row.goal.id)}
              className="w-5 h-5 shrink-0 flex items-center justify-center rounded hover:bg-gray-200 text-gray-500"
              title={row.expanded ? 'Thu gọn' : 'Mở rộng'}
            >
              <svg
                className={`w-3.5 h-3.5 transition-transform ${row.expanded ? 'rotate-90' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <span className="shrink-0">{row.goal.icon}</span>
            <span className="text-xs font-bold text-gray-900 truncate" title={row.goal.name}>
              {row.goal.name}
            </span>
            <span
              className={`shrink-0 w-2 h-2 rounded-full ${row.goal.health.meta.dot}`}
              title={row.goal.health.meta.label}
            />
            <span className="ml-auto shrink-0 text-[10px] text-gray-500">{row.goal.tasks.length} task</span>
          </>
        ) : row.kind === 'task' ? (
          <>
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                row.task.status === 'completed' ? 'bg-green-500' : row.task.is_overdue ? 'bg-red-500' : 'bg-gray-400'
              }`}
            />
            <span
              className={`text-xs truncate ${
                row.task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-800'
              }`}
              title={row.task.title}
            >
              {row.task.title}
            </span>
            <span className="ml-auto shrink-0">
              <DueDateBadge
                date={getTaskDeadline(row.task)}
                isCompleted={row.task.status === 'completed'}
                compact
              />
            </span>
          </>
        ) : (
          <>
            <span className="text-purple-400 text-[10px] shrink-0">└</span>
            <span
              className={`text-[11px] truncate ${
                row.subtask.is_completed ? 'text-gray-400 line-through' : 'text-gray-600'
              }`}
              title={row.subtask.title}
            >
              {row.subtask.title}
            </span>
            {row.subtask.date && (
              <span className="ml-auto shrink-0 text-[10px] text-gray-400">
                {row.subtask.date.toLocaleDateString('vi-VN')}
              </span>
            )}
          </>
        )}
      </div>

      {/* Bar lane */}
      <div className="relative z-10" style={{ width: scale.width }}>
        {isGoal && <GoalBar goal={row.goal} scale={scale} />}
        {row.kind === 'task' && (
          <TaskBar task={row.task} goalColor={row.goalColor} scale={scale} onSelect={onSelectTask} />
        )}
        {row.kind === 'subtask' && (
          <SubtaskMarker subtask={row.subtask} goalColor={row.goalColor} scale={scale} />
        )}
      </div>
    </div>
  )
}
