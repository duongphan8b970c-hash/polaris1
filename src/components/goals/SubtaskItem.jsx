import { useState } from 'react'
import { formatRecurrenceRule } from '../../utils/recurrence'

export default function SubtaskItem({ subtask, onToggle, onEdit, onDelete, onOpenRecurrence }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(subtask.title)

  const handleSave = () => {
    if (editTitle.trim() && editTitle !== subtask.title) {
      onEdit(subtask.id, { title: editTitle.trim() })
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditTitle(subtask.title)
    setIsEditing(false)
  }

  return (
    <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors group border border-gray-100">
      {/* Checkbox */}
      <button
        onClick={() => onToggle(subtask.id, subtask.is_completed)}
        className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
          subtask.is_completed
            ? 'bg-green-500 border-green-500'
            : 'border-gray-300 hover:border-green-400'
        }`}
      >
        {subtask.is_completed && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Title / Edit Input */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleSave()
              if (e.key === 'Escape') handleCancel()
            }}
            onBlur={handleSave}
            className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        ) : (
          <div className="flex items-center gap-2">
            <span
              onClick={() => setIsEditing(true)}
              className={`text-sm cursor-pointer ${
                subtask.is_completed
                  ? 'line-through text-gray-400'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              {subtask.title}
            </span>

            {/* Calendar badge */}
            {subtask.is_calendar_visible && (
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-medium rounded">
                📅
              </span>
            )}

            {/* Recurring badge */}
            {subtask.recurrence_rule && (
              <span 
                className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-medium rounded"
                title={formatRecurrenceRule(subtask.recurrence_rule)}
              >
                🔁
              </span>
            )}

            {/* Scheduled date */}
            {subtask.scheduled_date && (
              <span className="text-[10px] text-gray-500">
                {new Date(subtask.scheduled_date).toLocaleDateString('vi-VN')}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Schedule/Recurrence Button */}
        <button
          onClick={() => onOpenRecurrence(subtask)}
          className={`p-1 rounded hover:bg-gray-200 transition-colors ${
            subtask.recurrence_rule || subtask.scheduled_date ? 'text-purple-600' : 'text-gray-400'
          }`}
          title="Đặt lịch / Lặp lại"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {/* Delete Button */}
        <button
          onClick={() => {
            if (confirm(`Xóa subtask "${subtask.title}"?`)) {
              onDelete(subtask.id)
            }
          }}
          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          title="Xóa"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}