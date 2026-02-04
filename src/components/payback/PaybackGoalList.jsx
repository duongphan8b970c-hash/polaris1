export default function PaybackGoalList({ goals, onEdit, onDelete, onComplete }) {
  if (goals.length === 0) {
    return (
      <div className="card text-center py-12">
        <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <p className="text-gray-500 font-medium">Chưa có mục tiêu nào</p>
        <p className="text-gray-400 text-sm mt-1">Tạo mục tiêu đầu tiên để bắt đầu theo dõi</p>
      </div>
    )
  }

  // Separate active and completed goals
  const activeGoals = goals.filter(g => g.status === 'active')
  const completedGoals = goals.filter(g => g.status === 'completed')

  return (
    <div className="space-y-6">
      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Đang trả ({activeGoals.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeGoals.map(goal => (
              <PaybackGoalCard 
                key={goal.id} 
                goal={goal} 
                onEdit={onEdit}
                onDelete={onDelete}
                onComplete={onComplete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Đã hoàn thành ({completedGoals.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedGoals.map(goal => (
              <PaybackGoalCard 
                key={goal.id} 
                goal={goal} 
                onEdit={onEdit}
                onDelete={onDelete}
                onComplete={onComplete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ✅ Card component for individual goal
function PaybackGoalCard({ goal, onEdit, onDelete, onComplete }) {
  const isCompleted = goal.status === 'completed'
  const isOverdue = goal.is_overdue && !isCompleted

  // Calculate days remaining
  const today = new Date()
  const deadline = new Date(goal.deadline)
  const daysRemaining = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24))

  return (
    <div className={`card hover:shadow-lg transition-shadow ${
      isCompleted ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' :
      isOverdue ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200' :
      'bg-white'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-gray-900 truncate">{goal.name}</h3>
            {isCompleted && (
              <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                ✓ Hoàn thành
              </span>
            )}
            {isOverdue && (
              <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                ⚠ Quá hạn
              </span>
            )}
          </div>
          {goal.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{goal.description}</p>
          )}
        </div>
        <span className="text-3xl ml-2 flex-shrink-0">💳</span>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Đã trả:</span>
          <span className="font-bold text-gray-900">
            {goal.current_paid.toLocaleString('vi-VN')} ₫
          </span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Mục tiêu:</span>
          <span className="font-bold text-gray-900">
            {goal.target_amount.toLocaleString('vi-VN')} ₫
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Tiến độ</span>
            <span className="font-semibold">{goal.progress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all ${
                isCompleted ? 'bg-green-500' :
                isOverdue ? 'bg-red-500' :
                goal.progress > 80 ? 'bg-yellow-500' :
                'bg-blue-500'
              }`}
              style={{ width: `${Math.min(goal.progress, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Remaining */}
        {!isCompleted && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Còn lại:</span>
            <span className="font-bold text-red-600">
              {goal.remaining.toLocaleString('vi-VN')} ₫
            </span>
          </div>
        )}
      </div>

      {/* Deadline Info */}
      <div className={`mb-4 p-3 rounded-lg ${
        isCompleted ? 'bg-green-100 border border-green-200' :
        isOverdue ? 'bg-red-100 border border-red-200' :
        daysRemaining <= 7 ? 'bg-yellow-100 border border-yellow-200' :
        'bg-blue-50 border border-blue-200'
      }`}>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-700 font-medium">
            {isCompleted ? '🎉 Hoàn thành:' :
             isOverdue ? '⏰ Quá hạn:' :
             '📅 Hạn chót:'}
          </span>
          <span className="font-bold text-gray-900">
            {new Date(isCompleted ? goal.completed_date : goal.deadline).toLocaleDateString('vi-VN')}
          </span>
        </div>
        {!isCompleted && (
          <p className="text-xs text-gray-600 mt-1">
            {isOverdue 
              ? `Đã quá ${Math.abs(daysRemaining)} ngày`
              : daysRemaining === 0
                ? 'Hết hạn hôm nay!'
                : `Còn ${daysRemaining} ngày`
            }
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {!isCompleted && goal.progress >= 100 && (
          <button
            onClick={() => onComplete(goal)}
            className="flex-1 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            ✓ Đánh dấu hoàn thành
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

      {/* Initial Amount (if set) */}
      {goal.initial_amount > 0 && (
        <div className="mt-3 pt-3 border-t text-xs text-gray-500">
          <div className="flex justify-between">
            <span>Tổng tiền ban đầu:</span>
            <span className="font-medium">{goal.initial_amount.toLocaleString('vi-VN')} ₫</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>% đã trả (so với tổng tiền ban đầu):</span>
            <span className="font-medium">
              {((goal.current_paid / goal.initial_amount) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      )}
    </div>
  )
}