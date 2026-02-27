import { useState } from 'react'
import UserAvatar from '../common/UserAvatar'
import { useNavigate } from 'react-router-dom'

export default function TaskCheckInCard({ item, onCheckIn, isUpdating = false }) { // ✅ FIXED: isUpdating (not isUpdateting)
  const [isChecking, setIsChecking] = useState(false)
  const navigate = useNavigate()

  const isCompleted = item.type === 'task' 
    ? item.status === 'completed' 
    : item.is_completed === true

  const handleCheckIn = async (e) => {
    e.stopPropagation()
    setIsChecking(true)
    try {
      await onCheckIn(item)
    } catch (error) {
      console.error('Check-in error:', error)
    } finally {
      setIsChecking(false) // ✅ Always clear
    }
  }

  const handleNavigate = () => {
    if (item.type === 'task') {
      navigate(`/goals/${item.goal_id}/tasks/${item.id}`)
    } else if (item.type === 'subtask') {
      navigate(`/goals/${item.goal?.id}/tasks/${item.task_id}`)
    }
  }

  const statusColor = item.type === 'task'
    ? (item.status === 'completed' ? '#10b981' :
       item.status === 'in_progress' ? '#3b82f6' :
       item.status === 'blocked' ? '#ef4444' : '#6b7280')
    : (isCompleted ? '#10b981' : '#6b7280')

  return (
    <div
      onClick={handleNavigate}
      className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg border border-gray-200 transition-all cursor-pointer group"
      style={{ borderLeftWidth: '4px', borderLeftColor: statusColor }}
    >
      {/* Checkbox */}
      <button
        onClick={handleCheckIn}
        disabled={isChecking || isUpdating} // ✅ Now this matches the prop name
        className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed ${
          isCompleted
            ? 'bg-green-500 border-green-500'
            : 'border-gray-300 hover:border-green-400'
        }`}
      >
        {(isChecking || isUpdating) ? ( // ✅ Show spinner
          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : isCompleted ? (
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ) : null}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title */}
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-sm font-medium ${
            isCompleted ? 'line-through text-gray-400' : 'text-gray-900'
          }`}>
            {item.type === 'subtask' && '└ '}
            {item.title}
          </span>

          {/* Recurring badge */}
          {item.is_recurring && (
            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-medium rounded">
              🔁
            </span>
          )}
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-2 flex-wrap text-xs text-gray-600">
          {/* Goal */}
          {item.goal && (
            <span className="flex items-center gap-1">
              <span>{item.goal.icon}</span>
              <span>{item.goal.name}</span>
            </span>
          )}

          {/* Type badge */}
          <span className={`px-2 py-0.5 rounded ${
            item.type === 'task' 
              ? 'bg-blue-100 text-blue-700' 
              : 'bg-green-100 text-green-700'
          }`}>
            {item.type === 'task' ? 'Task' : 'Subtask'}
          </span>

          {/* Status badge for tasks */}
          {item.type === 'task' && (
            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
              item.status === 'completed' ? 'bg-green-100 text-green-700' :
              item.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
              item.status === 'blocked' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {item.status === 'completed' ? '✓ Hoàn thành' :
               item.status === 'in_progress' ? '⟳ Đang làm' :
               item.status === 'blocked' ? '⊘ Bị chặn' :
               '○ Chưa bắt đầu'}
            </span>
          )}

          {/* Priority for tasks */}
          {item.type === 'task' && item.priority && (
            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
              item.priority === 'high' ? 'bg-red-100 text-red-700' :
              item.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {item.priority === 'high' ? '🔥 Cao' :
               item.priority === 'medium' ? '⚡ Trung bình' :
               '📌 Thấp'}
            </span>
          )}

          {/* Assigned users */}
          {item.assigned_users && item.assigned_users.length > 0 && (
            <div className="flex -space-x-1">
              {item.assigned_users.slice(0, 3).map((user, index) => (
                <UserAvatar
                  key={user.id || index}
                  user={user}
                  size="xs"
                  className="ring-2 ring-white"
                />
              ))}
              {item.assigned_users.length > 3 && (
                <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 text-[10px] flex items-center justify-center ring-2 ring-white">
                  +{item.assigned_users.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigate Arrow */}
      <div className="flex-shrink-0 text-gray-400 group-hover:text-gray-600 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  )
}