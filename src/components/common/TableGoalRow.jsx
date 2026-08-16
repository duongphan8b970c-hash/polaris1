import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTasks } from '../../hooks/goals/useTasks'
import TableTaskRow from './TableTaskRow'
import TaskForm from '../goals/TaskForm'
import Modal from './Modal'
import GoalHealthBadge from './GoalHealthBadge'
import DueDateBadge from './DueDateBadge'
import { computeGoalHealth, sortTasksByUrgency } from '../../utils/taskHealth'

const PRIORITY_CONFIG = {
  high:   { label: 'Cao',       bg: 'bg-orange-100', text: 'text-orange-700' },
  medium: { label: 'TB',        bg: 'bg-yellow-100', text: 'text-yellow-700' },
  low:    { label: 'Thấp',      bg: 'bg-blue-100',   text: 'text-blue-700' },
}

// Chevron icon
function ChevronIcon({ expanded }) {
  return (
    <svg
      className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}

// Duration cell: shows start_date → target_date range (dates only)
function DurationCell({ goal }) {
  if (!goal.start_date && !goal.target_date) {
    return <span className="text-gray-400">—</span>
  }
  return (
    <div className="flex items-center gap-1 text-xs text-gray-600">
      {goal.start_date ? (
        <span>{new Date(goal.start_date).toLocaleDateString('vi-VN')}</span>
      ) : (
        <span className="text-gray-400">?</span>
      )}
      <span className="text-gray-400">→</span>
      {goal.target_date ? (
        <span className="font-medium text-gray-700">
          {new Date(goal.target_date).toLocaleDateString('vi-VN')}
        </span>
      ) : (
        <span className="text-gray-400">?</span>
      )}
    </div>
  )
}

// Compact goal info strip: member count + description only.
function GoalInfoStrip({ goal }) {
  const memberCount = goal.assigned_to?.length || 0
  if (memberCount === 0 && !goal.description) return null

  return (
    <tr>
      <td colSpan={7} className="p-0">
        <div className="bg-blue-50/60 border-b border-blue-100 px-12 py-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          {memberCount > 0 && (
            <span className="text-xs text-gray-500">👥 {memberCount} thành viên</span>
          )}
          {goal.description && (
            <span className="text-xs text-gray-600 italic">{goal.description}</span>
          )}
        </div>
      </td>
    </tr>
  )
}

// Lazy-loaded task rows for an expanded goal
function TaskLoader({ goal, depth }) {
  const goalId = goal.id
  const {
    tasks,
    loading,
    updateTask,
    deleteTask,
    createTask,
    toggleTaskStatus,
  } = useTasks(goalId)

  const [editingTask, setEditingTask] = useState(null)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleEdit = (task) => {
    setEditingTask(task)
    setShowTaskForm(true)
  }

  const handleCreate = () => {
    setEditingTask(null)
    setShowTaskForm(true)
  }

  const handleSubmit = async (formData) => {
    setSubmitting(true)
    const result = editingTask
      ? await updateTask(editingTask.id, formData)
      : await createTask({ ...formData, goal_id: goalId })
    if (result?.success) {
      setShowTaskForm(false)
      setEditingTask(null)
    } else {
      alert('Lỗi: ' + (result?.error || 'Unknown error'))
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <>
        <GoalInfoStrip goal={goal} />
        <tr>
          <td colSpan={7} className="py-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-400 pl-12">
              <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              Đang tải tasks...
            </div>
          </td>
        </tr>
      </>
    )
  }

  return (
    <>
      <GoalInfoStrip goal={goal} />
      {tasks.length === 0 ? (
        <tr>
          <td colSpan={7} className="py-1">
            <span className="text-xs text-gray-400 italic pl-16">
              Chưa có task nào
            </span>
          </td>
        </tr>
      ) : (
        // High priority + near deadline first; completed sinks to the bottom.
        sortTasksByUrgency(tasks).map((task) => (
          <TableTaskRow
            key={task.id}
            task={task}
            depth={depth + 1}
            goalId={goalId}
            onEdit={handleEdit}
            onDelete={(t) => {
              if (confirm(`Xóa task "${t.title}"?`)) deleteTask(t.id)
            }}
            onToggle={(t) => toggleTaskStatus(t.id, t.status)}
          />
        ))
      )}

      {/* Add task button row */}
      <tr>
        <td colSpan={7} className="py-1 border-b border-gray-100">
          <button
            onClick={handleCreate}
            className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded px-2 py-1 transition-colors"
            style={{ marginLeft: `${(depth + 2) * 28 - 4}px` }}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Thêm task
          </button>
        </td>
      </tr>

      {/* Task form modal (portaled to body to avoid invalid HTML in <tbody>) */}
      {showTaskForm &&
        createPortal(
          <Modal
            isOpen
            onClose={() => { setShowTaskForm(false); setEditingTask(null) }}
            title={editingTask ? 'Sửa task' : 'Thêm task mới'}
          >
            <TaskForm
              task={editingTask}
              goalId={goalId}
              siblingTasks={tasks}
              onSubmit={handleSubmit}
              onCancel={() => { setShowTaskForm(false); setEditingTask(null) }}
              loading={submitting}
            />
          </Modal>,
          document.body
        )}
    </>
  )
}

export default function TableGoalRow({
  goal,
  onEdit,
  onDelete,
  onComplete,
}) {
  const [expanded, setExpanded] = useState(false)

  const isCompleted = goal.status === 'completed'
  const progress = parseFloat(goal.progress) || 0
  const priority = PRIORITY_CONFIG[goal.priority]

  // useGoals attaches `health`; recompute as a fallback so the row also works
  // when it is rendered from a goal object that has not been through the hook.
  const health = useMemo(
    () => goal.health || computeGoalHealth(goal, goal.tasks_summary || []),
    [goal]
  )

  const handleRowClick = () => setExpanded((v) => !v)
  const handleExpandClick = (e) => { e.stopPropagation(); setExpanded((v) => !v) }

  return (
    <>
      <tr
        className={`border-b border-gray-200 transition-colors cursor-pointer ${
          isCompleted ? 'bg-gray-50/50 hover:bg-gray-100/60' : 'hover:bg-blue-50/40'
        } ${expanded ? 'bg-blue-50/20' : ''}`}
        onClick={handleRowClick}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleRowClick()
          if (e.key === 'ArrowRight' && !expanded) { e.stopPropagation(); setExpanded(true) }
          if (e.key === 'ArrowLeft' && expanded)  { e.stopPropagation(); setExpanded(false) }
        }}
        aria-label={`Mục tiêu: ${goal.name}`}
        aria-expanded={expanded}
      >
        {/* Name */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {/* Expand chevron */}
            <button
              onClick={handleExpandClick}
              className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded hover:bg-white/70 text-gray-500 transition-colors"
              title="Mở/đóng tasks"
              tabIndex={-1}
            >
              <ChevronIcon expanded={expanded} />
            </button>
            {/* Color indicator */}
            <div
              className="w-1 self-stretch rounded-full flex-shrink-0"
              style={{ backgroundColor: goal.color || '#6B7280', minWidth: '4px' }}
            />
            <span className="text-xl flex-shrink-0">{goal.icon}</span>
            <div className="min-w-0">
              <p className={`font-semibold text-gray-900 truncate ${isCompleted ? 'line-through text-gray-400' : ''}`}>
                {goal.name}
              </p>
              {goal.category && (
                <span className="text-xs text-gray-500">{goal.category}</span>
              )}
            </div>
          </div>
        </td>

        {/* Overall health only (On Track / At Risk / Off Track / Completed) */}
        <td className="px-3 py-3">
          <GoalHealthBadge health={health} />
        </td>

        {/* Priority */}
        <td className="px-3 py-3 whitespace-nowrap">
          {priority ? (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${priority.bg} ${priority.text}`}>
              {priority.label}
            </span>
          ) : <span className="text-gray-400 text-xs">—</span>}
        </td>

        {/* Progress (with a marker for where the plan says we should be) */}
        <td className="px-3 py-3">
          <div className="flex items-center gap-2 min-w-[80px]">
            <div className="relative flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  progress >= 100 ? 'bg-green-500' :
                  progress >= 75  ? 'bg-blue-500' :
                  progress >= 50  ? 'bg-yellow-500' :
                  'bg-gray-400'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
              {!isCompleted && health.expectedProgress !== null && (
                <span
                  className="absolute top-0 bottom-0 w-0.5 bg-gray-600/70"
                  style={{ left: `${Math.min(health.expectedProgress, 100)}%` }}
                  title={`Kế hoạch: ${health.expectedProgress.toFixed(0)}%`}
                />
              )}
            </div>
            <span className="text-xs text-gray-700 w-8 text-right">{progress.toFixed(0)}%</span>
          </div>
        </td>

        {/* Duration: start_date → target_date */}
        <td className="px-3 py-3 whitespace-nowrap">
          <DurationCell goal={goal} />
        </td>

        {/* Countdown: days remaining / overdue, plus the tasks that are late */}
        <td className="px-3 py-3 whitespace-nowrap text-center">
          <div className="flex flex-col items-center gap-1">
            <DueDateBadge date={goal.target_date} isCompleted={isCompleted} compact />
            {!isCompleted && health.lateTasks?.length > 0 && (
              <span
                className="text-[10px] text-red-600 font-medium"
                title={health.lateTasks.map((t) => `${t.title} — trễ ${t.daysOverdue} ngày`).join('\n')}
              >
                ⚠️ {health.lateTasks.length} task trễ
              </span>
            )}
          </div>
        </td>

        {/* Actions - ALWAYS VISIBLE */}
        <td className="px-3 py-3 whitespace-nowrap">
          <div className="flex items-center justify-end gap-1">
            {!isCompleted && progress >= 100 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onComplete(goal, new Date().toISOString().split('T')[0])
                }}
                className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                title="Đánh dấu hoàn thành"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(goal) }}
              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Sửa"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (confirm(`Xóa mục tiêu "${goal.name}"?\n\nTất cả tasks bên trong cũng sẽ bị xóa.`)) onDelete(goal)
              }}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Xóa"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded Tasks + goal info strip (lazy loaded) */}
      {expanded && (
        <TaskLoader goal={goal} depth={0} />
      )}
    </>
  )
}
