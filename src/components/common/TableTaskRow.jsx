import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useSubtasks } from '../../hooks/goals/useSubtasks'
import TableSubTaskRow from './TableSubTaskRow'
import TaskForm from '../goals/TaskForm'
import Modal from './Modal'

const STATUS_CONFIG = {
  todo:        { label: 'Cần làm',     bg: 'bg-gray-100',   text: 'text-gray-700',  icon: '📝' },
  in_progress: { label: 'Đang làm',    bg: 'bg-blue-100',   text: 'text-blue-700',  icon: '⏳' },
  completed:   { label: 'Hoàn thành',  bg: 'bg-green-100',  text: 'text-green-700', icon: '✅' },
  blocked:     { label: 'Bị chặn',     bg: 'bg-red-100',    text: 'text-red-700',   icon: '🚫' },
}

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

// Inline task detail panel
function TaskInlineDetail({ task, onEdit, onClose, indentPx }) {
  const status = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo
  const priority = PRIORITY_CONFIG[task.priority]

  return (
    <tr>
      <td colSpan={6} className="p-0">
        <div
          className="bg-indigo-50 border-l-4 border-indigo-400 py-3 pr-4"
          style={{ paddingLeft: `${indentPx}px` }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-bold text-gray-900">{task.title}</p>
              {task.description && (
                <p className="text-sm text-gray-600 mt-1">{task.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                  {status.icon} {status.label}
                </span>
                {priority && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${priority.bg} ${priority.text}`}>
                    {priority.label}
                  </span>
                )}
                {task.due_date && (
                  <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs">
                    📅 {new Date(task.due_date).toLocaleDateString('vi-VN')}
                  </span>
                )}
                {task.total_subtasks > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs">
                    📋 {task.completed_subtasks}/{task.total_subtasks} subtasks
                  </span>
                )}
              </div>
              {task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {task.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 text-xs bg-white border border-gray-200 rounded-full text-gray-600">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
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

// Lazy-loaded subtask rows
function SubtaskLoader({ taskId, depth }) {
  const {
    subtasks,
    loading,
    toggleSubtask,
    updateSubtask,
    deleteSubtask,
    createSubtask,
  } = useSubtasks(taskId)

  if (loading) {
    return (
      <tr>
        <td colSpan={6} className="py-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-400" style={{ paddingLeft: `${(depth + 1) * 28 + 8}px` }}>
            <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            Đang tải subtasks...
          </div>
        </td>
      </tr>
    )
  }

  return (
    <>
      {subtasks.length === 0 ? (
        <tr>
          <td colSpan={6} className="py-1">
            <span className="text-xs text-gray-400 italic" style={{ paddingLeft: `${(depth + 1) * 28 + 36}px` }}>
              Chưa có subtask
            </span>
          </td>
        </tr>
      ) : (
        subtasks.map((st) => (
          <TableSubTaskRow
            key={st.id}
            subtask={st}
            depth={depth + 1}
            onToggle={(id, current) => toggleSubtask(id, current)}
            onUpdate={updateSubtask}
            onDelete={(id) => deleteSubtask(id)}
          />
        ))
      )}
    </>
  )
}

export default function TableTaskRow({
  task,
  depth = 1,
  goalId,
  onEdit,
  onDelete,
  onToggle,
}) {
  const [expanded, setExpanded] = useState(false)
  const [showDetail, setShowDetail] = useState(false)

  const indentPx = depth * 28 + 8
  const detailIndentPx = depth * 28 + 28

  const isCompleted = task.status === 'completed'
  const status = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo
  const priority = PRIORITY_CONFIG[task.priority]

  const handleRowClick = () => setShowDetail((v) => !v)

  const handleExpandClick = (e) => {
    e.stopPropagation()
    setExpanded((v) => !v)
  }

  const handleToggleClick = (e) => {
    e.stopPropagation()
    onToggle(task)
  }

  return (
    <>
      <tr
        className={`border-b border-gray-100 transition-colors cursor-pointer ${
          isCompleted ? 'bg-gray-50/60 hover:bg-gray-100' : 'hover:bg-blue-50/60'
        } ${expanded ? 'bg-blue-50/30' : ''}`}
        onClick={handleRowClick}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleRowClick()
          if (e.key === 'ArrowRight' && !expanded) { e.stopPropagation(); setExpanded(true) }
          if (e.key === 'ArrowLeft' && expanded)  { e.stopPropagation(); setExpanded(false) }
        }}
        aria-label={`Task: ${task.title}`}
        aria-expanded={expanded}
      >
        {/* Name */}
        <td className="py-2.5 pr-3" style={{ paddingLeft: `${indentPx}px` }}>
          <div className="flex items-center gap-1.5">
            {/* Expand chevron */}
            <button
              onClick={handleExpandClick}
              className={`w-5 h-5 flex-shrink-0 flex items-center justify-center rounded hover:bg-white/70 transition-colors ${
                task.total_subtasks > 0 ? 'text-gray-500' : 'text-gray-200 cursor-default'
              }`}
              title={task.total_subtasks > 0 ? 'Mở/đóng subtasks' : 'Không có subtask'}
              tabIndex={-1}
            >
              <ChevronIcon expanded={expanded} />
            </button>
            {/* Status toggle checkbox */}
            <button
              onClick={handleToggleClick}
              className={`w-4 h-4 flex-shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                isCompleted
                  ? 'bg-green-500 border-green-500'
                  : 'border-gray-400 hover:border-blue-500'
              }`}
              title={isCompleted ? 'Đánh dấu chưa xong' : 'Đánh dấu hoàn thành'}
            >
              {isCompleted && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <span className={`text-sm font-medium ${isCompleted ? 'line-through text-gray-400' : 'text-gray-800'}`}>
              {task.title}
            </span>
          </div>
        </td>

        {/* Status */}
        <td className="px-3 py-2.5 whitespace-nowrap">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
            {status.icon} {status.label}
          </span>
        </td>

        {/* Priority */}
        <td className="px-3 py-2.5 whitespace-nowrap">
          {priority ? (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${priority.bg} ${priority.text}`}>
              {priority.label}
            </span>
          ) : <span className="text-gray-400 text-xs">—</span>}
        </td>

        {/* Subtasks count */}
        <td className="px-3 py-2.5 text-xs">
          {task.total_subtasks > 0 ? (
            <span className={task.completed_subtasks === task.total_subtasks ? 'text-green-600 font-medium' : 'text-gray-600'}>
              {task.completed_subtasks}/{task.total_subtasks}
            </span>
          ) : <span className="text-gray-400">—</span>}
        </td>

        {/* Deadline */}
        <td className="px-3 py-2.5 text-xs whitespace-nowrap">
          {task.due_date ? (
            <span className={task.is_overdue ? 'text-red-600 font-medium' : 'text-gray-600'}>
              {new Date(task.due_date).toLocaleDateString('vi-VN')}
              {task.is_overdue && ' ⚠️'}
            </span>
          ) : <span className="text-gray-400">—</span>}
        </td>

        {/* Actions - ALWAYS VISIBLE */}
        <td className="px-3 py-2.5">
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(task) }}
              className="p-1 text-blue-500 hover:bg-blue-50 rounded transition-colors"
              title="Sửa"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (confirm(`Xóa task "${task.title}"?`)) onDelete(task)
              }}
              className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Xóa"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </td>
      </tr>

      {/* Inline Task Detail */}
      {showDetail && (
        <TaskInlineDetail
          task={task}
          onEdit={() => { setShowDetail(false); onEdit(task) }}
          onClose={() => setShowDetail(false)}
          indentPx={detailIndentPx}
        />
      )}

      {/* Expanded Subtasks (lazy loaded) */}
      {expanded && (
        <SubtaskLoader taskId={task.id} depth={depth} />
      )}
    </>
  )
}
