const PRIORITY_COLORS = {
  low: 'gray',
  medium: 'blue',
  high: 'orange',
  urgent: 'red'
}

const STATUS_INFO = {
  planning: { label: 'Lên kế hoạch', icon: '📋', color: 'gray' },
  in_progress: { label: 'Đang thực hiện', icon: '🚀', color: 'blue' },
  completed: { label: 'Hoàn thành', icon: '✅', color: 'green' },
  on_hold: { label: 'Tạm dừng', icon: '⏸️', color: 'yellow' },
  cancelled: { label: 'Hủy bỏ', icon: '❌', color: 'red' },
}

export default function ProjectCard({ project, onEdit, onDelete, onClick }) {
  const statusInfo = STATUS_INFO[project.status] || STATUS_INFO.planning
  const progress = parseFloat(project.progress) || 0
  const priorityColor = PRIORITY_COLORS[project.priority] || 'gray'

  return (
    <div 
      className="card hover:shadow-lg transition-all cursor-pointer"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-gray-900 truncate mb-1" title={project.name}>
            {project.name}
          </h4>
          {project.description && (
            <p className="text-sm text-gray-600 line-clamp-2" title={project.description}>
              {project.description}
            </p>
          )}
        </div>
      </div>

      {/* Status & Priority Badges */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-${statusInfo.color}-100 text-${statusInfo.color}-700`}>
          <span>{statusInfo.icon}</span>
          <span>{statusInfo.label}</span>
        </span>
        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-${priorityColor}-100 text-${priorityColor}-700`}>
          {project.priority === 'low' && '🔵'}
          {project.priority === 'medium' && '🟡'}
          {project.priority === 'high' && '🟠'}
          {project.priority === 'urgent' && '🔴'}
          <span className="ml-1 capitalize">{project.priority}</span>
        </span>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-600">Tiến độ</span>
          <span className="font-semibold text-gray-900">{progress.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all bg-${statusInfo.color}-500`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {project.completed_tasks || 0} / {project.total_tasks || 0} tasks
        </p>
      </div>

      {/* Dates */}
      {project.due_date && (
        <div className="text-xs text-gray-500 mb-3">
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Hạn: {new Date(project.due_date).toLocaleDateString('vi-VN')}</span>
          </div>
        </div>
      )}

      {/* Category */}
      {project.category && (
        <div className="text-xs text-gray-500 mb-3">
          <span>{project.category.icon} {project.category.name}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onEdit(project)}
          className="flex-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium transition-colors"
        >
          Sửa
        </button>
        <button
          onClick={() => onDelete(project)}
          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-medium transition-colors"
        >
          Xóa
        </button>
      </div>
    </div>
  )
}