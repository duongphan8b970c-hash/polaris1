import { useState } from 'react'
import SubtaskItem from './SubtaskItem'
import RecurrenceModal from './RecurrenceModal'

export default function SubtaskList({ subtasks, onAdd, onToggle, onEdit, onDelete, loading }) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [showRecurrenceModal, setShowRecurrenceModal] = useState(false)
  const [selectedSubtask, setSelectedSubtask] = useState(null)

  const handleAdd = async () => {
    if (!newSubtaskTitle.trim()) return

    setIsAdding(true)
    await onAdd({ title: newSubtaskTitle.trim() })
    setNewSubtaskTitle('')
    setIsAdding(false)
  }

  const handleOpenRecurrence = (subtask) => {
    setSelectedSubtask(subtask)
    setShowRecurrenceModal(true)
  }

  const handleSaveRecurrence = async (recurrenceData) => {
    if (!selectedSubtask) return

    const result = await onEdit(selectedSubtask.id, recurrenceData)
    
    if (result.success) {
      setShowRecurrenceModal(false)
      setSelectedSubtask(null)
    } else {
      alert('Lỗi: ' + result.error)
    }
  }

  return (
    <>
      <div className="space-y-1.5">
        {/* Subtasks List */}
        {subtasks.length > 0 ? (
          <div className="space-y-1.5">
            {subtasks.map(subtask => (
              <SubtaskItem
                key={subtask.id}
                subtask={subtask}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
                onOpenRecurrence={handleOpenRecurrence}
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500 text-center py-3">
            Chưa có subtask nào. Thêm subtask để chia nhỏ công việc.
          </p>
        )}

        {/* Add New Subtask */}
        <div className="flex gap-2 mt-3">
          <input
            type="text"
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Thêm subtask mới..."
            className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
            disabled={isAdding || loading}
          />
          <button
            onClick={handleAdd}
            disabled={isAdding || loading || !newSubtaskTitle.trim()}
            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAdding ? '...' : 'Thêm'}
          </button>
        </div>
      </div>

      {/* Recurrence Modal */}
      <RecurrenceModal
        isOpen={showRecurrenceModal}
        onClose={() => {
          setShowRecurrenceModal(false)
          setSelectedSubtask(null)
        }}
        onSave={handleSaveRecurrence}
        initialData={selectedSubtask}
        loading={isAdding}
      />
    </>
  )
}