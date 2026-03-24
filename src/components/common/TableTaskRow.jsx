import { useState, useRef, useEffect } from 'react'
import { useSubtasks } from '../../hooks/goals/useSubtasks'
import TableSubTaskRow from './TableSubTaskRow'

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

// Mini subtask progress indicator
function SubtaskProgress({ completed, total }) {
  const pct = Math.round((completed / total) * 100)
  const allDone = completed === total
  return (
    <div className="flex flex-col gap-1 min-w-[80px]">
      <div className="flex items-center justify-between text-xs">
        <span className={allDone ? 'text-green-600 font-medium' : 'text-gray-600'}>
          {completed}/{total}
        </span>
        <span className={`font-semibold ${allDone ? 'text-green-600' : 'text-gray-500'}`}>
          {pct}%
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${allDone ? 'bg-green-500' : pct >= 50 ? 'bg-blue-500' : 'bg-yellow-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
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

// Inline task detail panel – compact strip (like GoalInfoStrip)
function TaskInlineDetail({ task, onEdit, onClose, indentPx }) {
  const hasInfo = task.description || (task.tags && task.tags.length > 0)

  return (
    <tr>
      <td colSpan={6} className="p-0">
        <div
          className="bg-indigo-50/60 border-b border-indigo-100 py-2 pr-4 flex flex-wrap items-center gap-x-4 gap-y-1"
          style={{ paddingLeft: `${indentPx}px` }}
        >
          {task.description && (
            <span className="text-xs text-gray-600 italic">{task.description}</span>
          )}
          {task.tags?.map((tag) => (
            <span key={tag} className="px-2 py-0.5 text-xs bg-white border border-indigo-200 rounded-full text-indigo-700">
              {tag}
            </span>
          ))}
          {!hasInfo && (
            <span className="text-xs text-gray-400 italic">Không có mô tả</span>
          )}
          <div className="ml-auto flex items-center gap-1 flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit() }}
              className="text-xs px-2 py-0.5 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
            >
              ✏️ Sửa
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onClose() }}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
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

  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [showInput, setShowInput] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (showInput && inputRef.current) inputRef.current.focus()
  }, [showInput])

  const handleAdd = async () => {
    if (!newSubtaskTitle.trim()) return
    setIsAdding(true)
    const result = await createSubtask({ title: newSubtaskTitle.trim() })
    if (!result.success) {
      alert('Lỗi: ' + result.error)
    } else {
      setNewSubtaskTitle('')
      setShowInput(false)
    }
    setIsAdding(false)
  }

  const addIndentPx = (depth + 1) * 28 + 36

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

      {/* Add subtask row */}
      {showInput ? (
        <tr>
          <td colSpan={6} className="py-1">
            <div className="flex items-center gap-1.5" style={{ paddingLeft: `${addIndentPx}px` }}>
              <input
                ref={inputRef}
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); handleAdd() }
                  if (e.key === 'Escape') { setShowInput(false); setNewSubtaskTitle('') }
                }}
                placeholder="Tên subtask mới..."
                className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-purple-400 focus:border-purple-400 max-w-xs"
              />
              <button
                onClick={handleAdd}
                disabled={isAdding || !newSubtaskTitle.trim()}
                className="text-xs px-2 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 transition-colors"
              >
                {isAdding ? '...' : 'Thêm'}
              </button>
              <button
                onClick={() => { setShowInput(false); setNewSubtaskTitle('') }}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Huỷ
              </button>
            </div>
          </td>
        </tr>
      ) : (
        <tr>
          <td colSpan={6} className="py-1">
            <button
              onClick={(e) => { e.stopPropagation(); setShowInput(true) }}
              className="flex items-center gap-1 text-xs text-purple-500 hover:text-purple-700 hover:bg-purple-50 rounded px-2 py-1 transition-colors"
              style={{ marginLeft: `${addIndentPx - 8}px` }}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Thêm subtask
            </button>
          </td>
        </tr>
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

  const handleRowClick = () => setShowDetail(true)

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

        {/* Subtasks progress */}
        <td className="px-3 py-2.5">
          {task.total_subtasks > 0 ? (
            <SubtaskProgress
              completed={task.completed_subtasks}
              total={task.total_subtasks}
            />
          ) : (
            <span className="text-gray-400 text-xs">—</span>
          )}
        </td>

        {/* Deadline - hidden per requirements */}
        <td className="px-3 py-2.5 text-xs whitespace-nowrap">
          <span className="text-gray-400">—</span>
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
