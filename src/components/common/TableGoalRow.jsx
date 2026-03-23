import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTasks } from '../../hooks/goals/useTasks'
import TableTaskRow from './TableTaskRow'
import TaskForm from '../goals/TaskForm'
import Modal from './Modal'

const PRIORITY_CONFIG = {
  urgent: { label: 'Khẩn cấp', bg: 'bg-red-100',    text: 'text-red-700' },
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

// Inline goal detail panel
function GoalInlineDetail({ goal, onEdit, onClose }) {
  const progress = parseFloat(goal.progress) || 0
  return (
    <tr>
      <td colSpan={6} className="p-0">
        <div className="bg-blue-50 border-l-4 border-blue-400 px-6 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <span className="text-3xl flex-shrink-0">{goal.icon}</span>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-gray-900">{goal.name}</h3>
                {goal.category && (
                  <span className="text-xs text-gray-500">{goal.category}</span>
                )}
                {goal.description && (
                  <p className="text-sm text-gray-700 mt-1">{goal.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                  {goal.target_date && (
                    <span className="text-gray-600">
                      🎯 Hạn: {new Date(goal.target_date).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                  <span className="text-gray-600">
                    📋 {goal.completed_tasks || 0}/{goal.total_tasks || 0} tasks
                  </span>
                  <span className="text-gray-600">
                    📊 {progress.toFixed(1)}%
                  </span>
                </div>
                {/* Progress bar */}
                <div className="mt-2 w-48 bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={onEdit}
                className="text-xs px-2 py-1 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
              >
                ✏️ Sửa
              </button>
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </td>
    </tr>
  )
}

// Lazy-loaded task rows for an expanded goal
function TaskLoader({ goalId, depth, onCreateTask }) {
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
      <tr>
        <td colSpan={6} className="py-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 pl-12">
            <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            Đang tải tasks...
          </div>
        </td>
      </tr>
    )
  }

  return (
    <>
      {tasks.length === 0 ? (
        <tr>
          <td colSpan={6} className="py-1">
            <span className="text-xs text-gray-400 italic pl-16">
              Chưa có task nào
            </span>
          </td>
        </tr>
      ) : (
        tasks.map((task) => (
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
        <td colSpan={6} className="py-1 border-b border-gray-100">
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
  const [showDetail, setShowDetail] = useState(false)

  const isCompleted = goal.status === 'completed'
  const progress = parseFloat(goal.progress) || 0
  const priority = PRIORITY_CONFIG[goal.priority]

  const getTimeRemaining = () => {
    if (!goal.target_date) return null
    const diffDays = Math.ceil(
      (new Date(goal.target_date) - new Date()) / (1000 * 60 * 60 * 24)
    )
    if (diffDays < 0) return { type: 'overdue', days: Math.abs(diffDays) }
    if (diffDays === 0) return { type: 'today' }
    if (diffDays <= 7) return { type: 'soon', days: diffDays }
    return { type: 'normal', days: diffDays }
  }

  const timeRemaining = getTimeRemaining()

  const handleRowClick = () => setShowDetail((v) => !v)
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

        {/* Status */}
        <td className="px-3 py-3 whitespace-nowrap">
          {isCompleted ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              ✓ Hoàn thành
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              ⚡ Đang làm
            </span>
          )}
        </td>

        {/* Priority */}
        <td className="px-3 py-3 whitespace-nowrap">
          {priority ? (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${priority.bg} ${priority.text}`}>
              {priority.label}
            </span>
          ) : <span className="text-gray-400 text-xs">—</span>}
        </td>

        {/* Progress */}
        <td className="px-3 py-3">
          <div className="flex items-center gap-2 min-w-[80px]">
            <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  progress >= 100 ? 'bg-green-500' :
                  progress >= 75  ? 'bg-blue-500' :
                  progress >= 50  ? 'bg-yellow-500' :
                  'bg-gray-400'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <span className="text-xs text-gray-700 w-8 text-right">{progress.toFixed(0)}%</span>
          </div>
        </td>

        {/* Deadline */}
        <td className="px-3 py-3 whitespace-nowrap text-xs">
          {timeRemaining ? (
            <span className={`font-medium ${
              timeRemaining.type === 'overdue' ? 'text-red-600' :
              timeRemaining.type === 'today'   ? 'text-yellow-600' :
              timeRemaining.type === 'soon'    ? 'text-orange-600' :
              'text-gray-600'
            }`}>
              {new Date(goal.target_date).toLocaleDateString('vi-VN')}
              {timeRemaining.type === 'overdue' && <span className="ml-1">(quá hạn)</span>}
              {timeRemaining.type === 'today'   && <span className="ml-1">(hôm nay)</span>}
              {timeRemaining.type === 'soon'    && <span className="ml-1">(còn {timeRemaining.days} ngày)</span>}
            </span>
          ) : <span className="text-gray-400">—</span>}
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

      {/* Inline Goal Details */}
      {showDetail && (
        <GoalInlineDetail
          goal={goal}
          onEdit={() => { setShowDetail(false); onEdit(goal) }}
          onClose={() => setShowDetail(false)}
        />
      )}

      {/* Expanded Tasks (lazy loaded) */}
      {expanded && (
        <TaskLoader goalId={goal.id} depth={0} />
      )}
    </>
  )
}
