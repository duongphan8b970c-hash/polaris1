import { useState } from 'react'

export default function SubtaskItem({ subtask, onToggle, onEdit, onDelete }) {
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
    <div className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded-md transition-colors group">
      {/* Checkbox */}
      <button
        onClick={() => onToggle(subtask.id, subtask.is_completed)}
        className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
          subtask.is_completed
            ? 'bg-green-500 border-green-500'
            : 'border-gray-300 hover:border-green-500'
        }`}
      >
        {subtask.is_completed && (
          <svg className="w-2.5 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Title */}
      {isEditing ? (
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleSave()
            }
            if (e.key === 'Escape') {
              e.preventDefault()
              handleCancel()
            }
          }}
          onBlur={() => {
            // Delay to allow Enter key to trigger first
            setTimeout(() => handleSave(), 100)
          }}
          className="flex-1 px-2 py-1 border border-blue-500 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      ) : (
        <span
          className={`flex-1 text-xs ${
            subtask.is_completed ? 'line-through text-gray-400' : 'text-gray-700'
          }`}
          onDoubleClick={() => setIsEditing(true)}
          title="Double click để sửa"
        >
          {subtask.title}
        </span>
      )}

      {/* Actions */}
      {!isEditing && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Sửa"
          >
            <svg className="w-3.5 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(subtask.id)}
            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Xóa"
          >
            <svg className="w-3.5 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}