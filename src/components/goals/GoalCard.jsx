export default function GoalCard({ goal, onEdit, onDelete, onComplete, onClick }) {
  const isCompleted = goal.status === 'completed'
  const progress = parseFloat(goal.progress) || 0

  const getTimeRemaining = () => {
    if (!goal.target_date) return null
    
    const today = new Date()
    const target = new Date(goal.target_date)
    const diffTime = target - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return { type: 'overdue', days: Math.abs(diffDays) }
    if (diffDays === 0) return { type: 'today', days: 0 }
    if (diffDays <= 7) return { type: 'soon', days: diffDays }
    return { type: 'normal', days: diffDays }
  }

  const timeRemaining = getTimeRemaining()

  return (
    <div 
      className={`card hover:shadow-xl transition-all cursor-pointer ${
        isCompleted ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' : ''
      }`}
      onClick={onClick}
      style={{ 
        borderLeftWidth: '4px',
        borderLeftColor: goal.color 
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-4xl flex-shrink-0">{goal.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-bold text-lg text-gray-900 truncate" title={goal.name}>
                {goal.name}
              </h3>
              {isCompleted && (
                <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  ✓ Hoàn thành
                </span>
              )}
            </div>
            {goal.description && (
              <p className="text-sm text-gray-600 line-clamp-2" title={goal.description}>
                {goal.description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Tiến độ</span>
          <span className="font-bold" style={{ color: goal.color }}>
            {progress.toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="h-2.5 rounded-full transition-all duration-500"
            style={{ 
              width: `${Math.min(progress, 100)}%`,
              backgroundColor: goal.color 
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-2">
          <span>{goal.completed_tasks || 0} / {goal.total_tasks || 0} tasks</span>
        </div>
      </div>

      {timeRemaining && !isCompleted && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
          timeRemaining.type === 'overdue' ? 'bg-red-100 text-red-700' :
          timeRemaining.type === 'today' ? 'bg-yellow-100 text-yellow-700' :
          timeRemaining.type === 'soon' ? 'bg-orange-100 text-orange-700' :
          'bg-blue-50 text-blue-700'
        }`}>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">
            {timeRemaining.type === 'overdue' && `Quá hạn ${timeRemaining.days} ngày`}
            {timeRemaining.type === 'today' && 'Hết hạn hôm nay!'}
            {timeRemaining.type === 'soon' && `Còn ${timeRemaining.days} ngày`}
            {timeRemaining.type === 'normal' && `Còn ${timeRemaining.days} ngày`}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
        <div className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Bắt đầu: {new Date(goal.start_date).toLocaleDateString('vi-VN')}</span>
        </div>
        {goal.target_date && (
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Đích: {new Date(goal.target_date).toLocaleDateString('vi-VN')}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-4 border-t" onClick={(e) => e.stopPropagation()}>
        {!isCompleted && progress >= 100 && (
          <button
            onClick={() => onComplete(goal)}
            className="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            ✓ Hoàn thành
          </button>
        )}
        <button
          onClick={() => onEdit(goal)}
          className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Sửa
        </button>
        <button
          onClick={() => onDelete(goal)}
          className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Xóa
        </button>
      </div>
    </div>
  )
}