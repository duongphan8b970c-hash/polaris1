export default function TaskCard({ task, onEdit, onDelete, onToggleStatus, onClick }) {
  const isCompleted = task.status === 'completed'
  const isInProgress = task.status === 'in_progress'
  const isBlocked = task.status === 'blocked'
  
  // ✅ Status color mapping
  const getStatusColor = () => {
    if (isCompleted) return '#10b981' // green
    if (isInProgress) return '#3b82f6' // blue
    if (isBlocked) return '#ef4444' // red
    return '#6b7280' // gray for todo
  }

  const statusColor = getStatusColor()

  return (
    <div 
      className="bg-white border-2 rounded-xl shadow-sm hover:shadow-lg transition-all cursor-pointer relative overflow-hidden group"
      onClick={onClick}
      style={{ 
        borderLeftWidth: '5px',
        borderLeftColor: statusColor,
        borderColor: `${statusColor}30`
      }}
    >
      {/* ✅ Colored top accent bar */}
      <div 
        className="absolute top-0 left-0 right-0 h-1 transition-all group-hover:h-1.5"
        style={{ 
          background: `linear-gradient(90deg, ${statusColor}, ${statusColor}aa)`
        }}
      />

      <div className="p-5 pt-6">
        {/* Header with colored checkbox */}
        <div className="flex items-start gap-3 mb-3">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleStatus(task)
            }}
            className="flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all hover:scale-110"
            style={{ 
              borderColor: statusColor,
              backgroundColor: isCompleted ? statusColor : 'transparent'
            }}
          >
            {isCompleted && (
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          <div className="flex-1 min-w-0">
            <h3 className={`font-bold text-lg mb-1 ${isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>
              {task.title}
            </h3>
            {task.description && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit(task)
              }}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (confirm(`Xóa task "${task.title}"?`)) {
                  onDelete(task)
                }
              }}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Status badge with color */}
        <div className="flex items-center gap-2 mb-3">
          <span 
            className="px-2.5 py-1 rounded-lg text-xs font-medium"
            style={{ 
              backgroundColor: `${statusColor}15`,
              color: statusColor
            }}
          >
            {isCompleted && '✅ Hoàn thành'}
            {isInProgress && '⏳ Đang làm'}
            {isBlocked && '🚫 Bị chặn'}
            {task.status === 'todo' && '📝 Cần làm'}
          </span>
          
          {task.priority && (
            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
              task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
              task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {task.priority === 'urgent' ? '🔴 Khẩn cấp' :
               task.priority === 'high' ? '🟠 Cao' :
               task.priority === 'medium' ? '🟡 TB' : '🔵 Thấp'}
            </span>
          )}
        </div>

        {/* Assignees */}
        {task.assigned_to && task.assigned_to.length > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-gray-600">👥</span>
            <div className="flex -space-x-2">
              {task.assigned_to.slice(0, 3).map((userId, index) => (
                <div key={userId} style={{ zIndex: 10 - index }}>
                  <UserAvatar userId={userId} size="sm" />
                </div>
              ))}
              {task.assigned_to.length > 3 && (
                <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-semibold text-gray-600">
                  +{task.assigned_to.length - 3}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Due date */}
        {task.due_date && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Hạn: {new Date(task.due_date).toLocaleDateString('vi-VN')}</span>
          </div>
        )}
      </div>

      {/* ✅ Colored bottom accent */}
      <div 
        className="h-1 transition-all group-hover:h-1.5"
        style={{ 
          background: `linear-gradient(90deg, ${statusColor}40, ${statusColor}10)`
        }}
      />
    </div>
  )
}