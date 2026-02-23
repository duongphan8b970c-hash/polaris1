import { useNavigate } from 'react-router-dom'
import UserAvatar from '../common/UserAvatar'

const STATUS_INFO = {
  todo: { label: 'Cần làm', icon: '📝', color: 'gray' },
  in_progress: { label: 'Đang làm', icon: '⏳', color: 'blue' },
  completed: { label: 'Hoàn thành', icon: '✅', color: 'green' },
  blocked: { label: 'Bị chặn', icon: '🚫', color: 'red' },
}

const PRIORITY_INFO = {
  low: { icon: '🔵', label: 'Thấp' },
  medium: { icon: '🟡', label: 'Trung bình' },
  high: { icon: '🟠', label: 'Cao' },
  urgent: { icon: '🔴', label: 'Khẩn cấp' },
}

export default function TaskCard({ task, onEdit, onDelete, onToggleStatus, onClick }) {
  const statusInfo = STATUS_INFO[task.status] || STATUS_INFO.todo
  const priorityInfo = PRIORITY_INFO[task.priority] || PRIORITY_INFO.medium
  const progress = parseFloat(task.progress) || 0
  const navigate = useNavigate()

  return (
    <div 
      className="card hover:shadow-lg transition-all cursor-pointer"
      onClick={() => navigate(`/goals/${task.goal_id}/tasks/${task.id}`)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {/* Checkbox */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleStatus(task)
              }}
              className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                task.status === 'completed'
                  ? 'bg-green-500 border-green-500'
                  : 'border-gray-300 hover:border-green-500'
              }`}
            >
              {task.status === 'completed' && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>

            <h4 className={`font-bold truncate flex-1 ${
              task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'
            }`} title={task.title}>
              {task.title}
            </h4>
          </div>
          
          {task.description && (
            <p className="text-sm text-gray-600 line-clamp-2 ml-7" title={task.description}>
              {task.description}
            </p>
          )}
        </div>
      </div>

      {/* Status & Priority */}
      <div className="flex items-center gap-2 mb-3 flex-wrap ml-7">
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-${statusInfo.color}-100 text-${statusInfo.color}-700`}>
          <span>{statusInfo.icon}</span>
          <span>{statusInfo.label}</span>
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
          <span>{priorityInfo.icon}</span>
          <span>{priorityInfo.label}</span>
        </span>
        {task.is_overdue && (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
            ⚠️ Quá hạn
          </span>
        )}
      </div>

      {/* Progress (Subtasks) */}
      {task.total_subtasks > 0 && (
        <div className="mb-3 ml-7">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-600">Subtasks</span>
            <span className="font-semibold text-gray-900">
              {task.completed_subtasks} / {task.total_subtasks}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="h-1.5 rounded-full transition-all bg-blue-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}
      {/* ✅ ADD THIS: Assignees - After progress, before tags */}
      {task.assigned_to && task.assigned_to.length > 0 && (
        <div className="flex items-center gap-2 mb-3 ml-7">
          <span className="text-xs text-gray-500">👥</span>
          <div className="flex -space-x-2">
            {task.assigned_to.slice(0, 3).map((userId, index) => (
              <div key={userId} style={{ zIndex: 10 - index }}>
                <UserAvatar userId={userId} size="xs" />
              </div>
            ))}
            {task.assigned_to.length > 3 && (
              <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[9px] font-semibold text-gray-600">
                +{task.assigned_to.length - 3}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3 ml-7">
          {task.tags.slice(0, 3).map((tag, index) => (
            <span key={index} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
              #{tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
              +{task.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Due Date */}
      {task.due_date && (
        <div className="text-xs text-gray-500 mb-3 ml-7">
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Hạn: {new Date(task.due_date).toLocaleDateString('vi-VN')}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 ml-7">
        <button
          onClick={(e) => {
            e.stopPropagation() // Prevent card click
            onEdit(task)
          }}
          className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
          title="Sửa"
        >
          {/* Edit icon */}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation() // Prevent card click
            onDelete(task)
          }}
          className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          title="Xóa"
        >
          {/* Delete icon */}
          </button>
        </div>
      </div>
    )
  }