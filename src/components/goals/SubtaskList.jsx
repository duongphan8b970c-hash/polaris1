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
    <div className="space-y-1.5">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-900">
          Subtasks ({subtasks.filter(s => s.is_completed).length} / {subtasks.length})
        </h4>
      </div>
    </div>
  )
}