import { useState } from 'react'
import SubtaskItem from './SubtaskItem'

export default function SubtaskList({ subtasks, onToggle, onEdit, onDelete, onAdd, loading }) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const handleAdd = async () => {
    if (!newSubtaskTitle.trim()) return

    setIsAdding(true)
    await onAdd({ title: newSubtaskTitle.trim() })
    setNewSubtaskTitle('')
    setIsAdding(false)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900">
          Subtasks ({subtasks.filter(s => s.is_completed).length} / {subtasks.length})
        </h4>
      </div>

      {/* Subtasks List */}
      {subtasks.length > 0 ? (
        <div className="space-y-2">
          {subtasks.map(subtask => (
            <SubtaskItem
              key={subtask.id}
              subtask={subtask}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 text-center py-4">
          Chưa có subtask nào. Thêm subtask để chia nhỏ công việc.
        </p>
      )}

      {/* Add New Subtask */}
      <div className="flex gap-2 mt-4">
        <input
          type="text"
          value={newSubtaskTitle}
          onChange={(e) => setNewSubtaskTitle(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Thêm subtask mới..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          disabled={isAdding || loading}
        />
        <button
          onClick={handleAdd}
          disabled={isAdding || loading || !newSubtaskTitle.trim()}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAdding ? '...' : 'Thêm'}
        </button>
      </div>
    </div>
  )
}