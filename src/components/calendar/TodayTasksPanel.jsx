import { useState } from 'react'
import TaskCheckInCard from './TaskCheckInCard'
import { supabase } from '../../lib/supabase'

const VIEW_OPTIONS = [
  { value: 'all', label: 'Tất cả', icon: '👥' },
  { value: 'my', label: 'Của tôi', icon: '👤' },
]

export default function TodayTasksPanel({ date, items, onRefresh }) {
  const [view, setView] = useState('all')
  const [updating, setUpdating] = useState(false)

  const handleCheckIn = async (item) => {
    try {
      setUpdating(true)

      if (item.type === 'task') {
        // Update task status
        const newStatus = item.status === 'completed' ? 'todo' : 'completed'
        const { error } = await supabase
          .from('tasks')
          .update({ status: newStatus })
          .eq('id', item.original_id)

        if (error) throw error
      } else {
        // Update subtask
        const newCompleted = !item.is_completed
        const { error } = await supabase
          .from('subtasks')
          .update({ 
            is_completed: newCompleted,
            completed_date: newCompleted ? new Date().toISOString() : null
          })
          .eq('id', item.original_id)

        if (error) throw error
      }

      await onRefresh()
    } catch (err) {
      console.error('Error checking in:', err)
      alert('Lỗi: ' + err.message)
    } finally {
      setUpdating(false)
    }
  }

  // Filter items based on view
  const filteredItems = items // TODO: Add user filter when view === 'my'

  const dateStr = date.toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            📝 Công việc trong ngày
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {dateStr}
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {VIEW_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={() => setView(option.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === option.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {option.icon} {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-2">
        {filteredItems.length > 0 ? (
          filteredItems.map((item, index) => (
            <TaskCheckInCard
              key={`${item.type}-${item.original_id}-${index}`}
              item={item}
              onCheckIn={handleCheckIn}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎉</div>
            <p className="text-gray-600 font-medium">
              Không có công việc nào trong ngày này
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Hãy tận hưởng ngày nghỉ!
            </p>
          </div>
        )}
      </div>

      {/* Stats */}
      {filteredItems.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-sm">
          <span className="text-gray-600">
            Tổng cộng: <strong>{filteredItems.length}</strong> việc
          </span>
          <span className="text-gray-600">
            Hoàn thành: <strong className="text-green-600">
              {filteredItems.filter(item => 
                item.type === 'task' 
                  ? item.status === 'completed' 
                  : item.is_completed
              ).length}
            </strong>
          </span>
        </div>
      )}
    </div>
  )
}