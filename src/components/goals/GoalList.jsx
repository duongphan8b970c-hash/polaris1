import UserAvatar from '../common/UserAvatar'

const PRIORITY_CONFIG = {
  urgent: { label: '🔴 Khẩn cấp', bg: 'bg-red-100', text: 'text-red-700' },
  high:   { label: '🟠 Cao',       bg: 'bg-orange-100', text: 'text-orange-700' },
  medium: { label: '🟡 Trung bình', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  low:    { label: '🔵 Thấp',      bg: 'bg-blue-100', text: 'text-blue-700' },
}

function GoalRow({ goal, onEdit, onDelete, onComplete, onGoalClick }) {
  const isCompleted = goal.status === 'completed'
  const progress = parseFloat(goal.progress) || 0

  const getTimeRemaining = () => {
    if (!goal.target_date) return null
    if (isCompleted) return null
    const today = new Date()
    const target = new Date(goal.target_date)
    const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24))
    if (diffDays < 0) return { type: 'overdue', days: Math.abs(diffDays) }
    if (diffDays === 0) return { type: 'today', days: 0 }
    if (diffDays <= 7) return { type: 'soon', days: diffDays }
    return { type: 'normal', days: diffDays }
  }

  const timeRemaining = getTimeRemaining()
  const priority = PRIORITY_CONFIG[goal.priority]

  return (
    <tr
      className="hover:bg-blue-50 transition-colors cursor-pointer group"
      onClick={() => onGoalClick && onGoalClick(goal)}
    >
      {/* Name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className="w-1 self-stretch rounded-full flex-shrink-0"
            style={{ backgroundColor: goal.color || '#6B7280', minWidth: '4px' }}
          />
          <span className="text-2xl flex-shrink-0">{goal.icon}</span>
          <div className="min-w-0">
            <p className={`font-medium text-gray-900 truncate group-hover:text-blue-700 ${isCompleted ? 'line-through text-gray-400' : ''}`}>
              {goal.name}
            </p>
            {goal.description && (
              <p className="text-xs text-gray-500 truncate max-w-xs">{goal.description}</p>
            )}
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-3 whitespace-nowrap">
        {isCompleted ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            ✓ Hoàn thành
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            ⚡ Đang thực hiện
          </span>
        )}
      </td>

      {/* Priority */}
      <td className="px-4 py-3 whitespace-nowrap">
        {priority ? (
          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${priority.bg} ${priority.text}`}>
            {priority.label}
          </span>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        )}
      </td>

      {/* Progress */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 min-w-[100px]">
          <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                progress >= 100 ? 'bg-green-500' :
                progress >= 75 ? 'bg-blue-500' :
                progress >= 50 ? 'bg-yellow-500' :
                'bg-gray-400'
              }`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-gray-700 w-9 text-right">{progress.toFixed(0)}%</span>
        </div>
      </td>

      {/* Tasks */}
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
        📋 {goal.completed_tasks || 0}/{goal.total_tasks || 0}
      </td>

      {/* Category */}
      <td className="px-4 py-3 whitespace-nowrap">
        {goal.category ? (
          <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700 font-medium">
            {goal.category}
          </span>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        )}
      </td>

      {/* Due Date */}
      <td className="px-4 py-3 whitespace-nowrap text-sm">
        {timeRemaining ? (
          <span className={`font-medium ${
            timeRemaining.type === 'overdue' ? 'text-red-600' :
            timeRemaining.type === 'today' ? 'text-yellow-600' :
            timeRemaining.type === 'soon' ? 'text-orange-600' :
            'text-gray-600'
          }`}>
            {new Date(goal.target_date).toLocaleDateString('vi-VN')}
            {timeRemaining.type === 'overdue' && <span className="ml-1 text-xs">(quá {timeRemaining.days} ngày)</span>}
            {timeRemaining.type === 'today' && <span className="ml-1 text-xs">(hôm nay)</span>}
            {timeRemaining.type === 'soon' && <span className="ml-1 text-xs">(còn {timeRemaining.days} ngày)</span>}
          </span>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        )}
      </td>

      {/* Assignees */}
      <td className="px-4 py-3 whitespace-nowrap">
        {goal.assigned_to && goal.assigned_to.length > 0 ? (
          <div className="flex -space-x-2">
            {goal.assigned_to.slice(0, 3).map((userId, index) => (
              <div key={userId} style={{ zIndex: 10 - index }}>
                <UserAvatar userId={userId} size="sm" />
              </div>
            ))}
            {goal.assigned_to.length > 3 && (
              <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 border-2 border-white">
                +{goal.assigned_to.length - 3}
              </div>
            )}
          </div>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        )}
      </td>

      {/* Actions */}
      <td className="px-4 py-3 whitespace-nowrap text-right">
        <div className="flex items-center justify-end gap-1 transition-opacity">
          {!isCompleted && progress >= 100 && (
            <button
              onClick={(e) => { e.stopPropagation(); onComplete(goal, new Date().toISOString().split('T')[0]) }}
              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Đánh dấu hoàn thành"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(goal) }}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Sửa"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); if (confirm(`Xóa mục tiêu "${goal.name}"?`)) onDelete(goal) }}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Xóa"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  )
}

function GoalSection({ title, icon, goals, onEdit, onDelete, onComplete, onGoalClick, defaultOpen = true }) {
  return (
    <tbody>
      {/* Section header row */}
      <tr className="bg-gray-50 border-t-2 border-gray-200">
        <td colSpan={9} className="px-4 py-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            {icon}
            {title}
          </div>
        </td>
      </tr>
      {goals.map(goal => (
        <GoalRow
          key={goal.id}
          goal={goal}
          onEdit={onEdit}
          onDelete={onDelete}
          onComplete={onComplete}
          onGoalClick={onGoalClick}
        />
      ))}
    </tbody>
  )
}

export default function GoalList({ goals, onEdit, onDelete, onComplete, onGoalClick }) {
  // ✅ FIX: Ensure goals is always an array
  const safeGoals = Array.isArray(goals) ? goals : []
  
  if (safeGoals.length === 0) {
    return (
      <div className="card text-center py-16">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có mục tiêu nào</h3>
        <p className="text-gray-600 max-w-md mx-auto mb-6">
          Tạo mục tiêu đầu tiên để bắt đầu theo dõi tiến độ và hoàn thành các dự án của bạn
        </p>
      </div>
    )
  }

  // ✅ FIX: Use safeGoals instead of goals
  const activeGoals = safeGoals.filter(g => g.status === 'active')
  const completedGoals = safeGoals.filter(g => g.status === 'completed')

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tên mục tiêu</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Trạng thái</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ưu tiên</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tiến độ</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tasks</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Danh mục</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Hạn chót</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Thành viên</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>

          {activeGoals.length > 0 && (
            <GoalSection
              title={`Đang thực hiện (${activeGoals.length})`}
              icon={
                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
              goals={activeGoals}
              onEdit={onEdit}
              onDelete={onDelete}
              onComplete={onComplete}
              onGoalClick={onGoalClick}
            />
          )}

          {completedGoals.length > 0 && (
            <GoalSection
              title={`Đã hoàn thành (${completedGoals.length})`}
              icon={
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              goals={completedGoals}
              onEdit={onEdit}
              onDelete={onDelete}
              onComplete={onComplete}
              onGoalClick={onGoalClick}
            />
          )}
        </table>
      </div>
    </div>
  )
}