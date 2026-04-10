import { formatNumber, formatDate } from '../../utils'

export default function PaybackGoalList({ goals, goalType = 'payback', onEdit, onDelete, onComplete }) {
  const isPlan = goalType === 'plan'

  if (goals.length === 0) {
    return (
      <div className="card text-center py-12">
        <div className={`w-20 h-20 bg-gradient-to-br ${isPlan ? 'from-teal-100 to-emerald-100' : 'from-orange-100 to-red-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
          <svg className={`w-10 h-10 ${isPlan ? 'text-teal-600' : 'text-orange-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <p className="text-gray-500 font-medium">
          {isPlan ? 'Chưa có kế hoạch nào' : 'Chưa có mục tiêu nào'}
        </p>
        <p className="text-gray-400 text-sm mt-1">
          {isPlan ? 'Tạo kế hoạch chi tiêu đầu tiên' : 'Tạo mục tiêu đầu tiên để bắt đầu theo dõi'}
        </p>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {isPlan ? 'Kế hoạch' : 'Tên mục tiêu'}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Trạng thái</th>
              {!isPlan && (
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ưu tiên</th>
              )}
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {isPlan ? 'Dự kiến' : 'Mục tiêu'}
              </th>
              {!isPlan && (
                <>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Đã trả</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Còn lại</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tiến độ</th>
                </>
              )}
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {isPlan ? 'Ngày chi tiêu' : 'Hạn chót'}
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Còn lại</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {goals.map(goal => (
              <PaybackGoalRow
                key={goal.id}
                goal={goal}
                goalType={goalType}
                onEdit={onEdit}
                onDelete={onDelete}
                onComplete={onComplete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PaybackGoalRow({ goal, goalType = 'payback', onEdit, onDelete, onComplete }) {
  const isPlan = goalType === 'plan'
  const isCompleted = goal.status === 'completed'
  const isOverdue = goal.is_overdue && !isCompleted

  const today = new Date()
  const deadline = new Date(goal.deadline)
  const daysRemaining = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24))

  return (
    <tr className={isPlan ? 'hover:bg-teal-50 transition-colors group' : 'hover:bg-orange-50 transition-colors group'}>
      {/* Name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xl flex-shrink-0">{isPlan ? '📋' : '💳'}</span>
          <div className="min-w-0">
            <p className={`font-medium text-gray-900 truncate ${isCompleted ? 'line-through text-gray-400' : ''}`}>
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
        ) : isOverdue ? (
          <span className={`inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium`}>
            ⚠ Quá hạn
          </span>
        ) : (
          <span className={`inline-flex items-center gap-1 px-2 py-1 ${isPlan ? 'bg-teal-100 text-teal-700' : 'bg-orange-100 text-orange-700'} rounded-full text-xs font-medium`}>
            {isPlan ? '📅 Đang lên kế hoạch' : '⏳ Đang trả'}
          </span>
        )}
      </td>

      {/* Priority - only for payback */}
      {!isPlan && (
        <td className="px-4 py-3 whitespace-nowrap">
          {goal.priority ? (
            <span
              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
              style={{
                backgroundColor: `${goal.priority.color}20`,
                color: goal.priority.color,
                border: `1px solid ${goal.priority.color}40`
              }}
            >
              {goal.priority.icon} {goal.priority.name}
            </span>
          ) : (
            <span className="text-gray-400 text-xs">—</span>
          )}
        </td>
      )}

      {/* Target Amount */}
      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
        {formatNumber(goal.target_amount)} ₫
      </td>

      {/* Paid & Remaining & Progress - only for payback */}
      {!isPlan && (
        <>
          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-semibold text-green-600">
            {formatNumber(goal.current_paid)} ₫
          </td>

          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-bold">
            {isCompleted ? (
              <span className="text-green-600">—</span>
            ) : (
              <span className="text-red-600">{formatNumber(goal.remaining)} ₫</span>
            )}
          </td>

          <td className="px-4 py-3">
            <div className="flex items-center gap-2 min-w-[100px]">
              <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    isCompleted ? 'bg-green-500' :
                    isOverdue ? 'bg-red-500' :
                    goal.progress > 80 ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(goal.progress, 100)}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-700 w-9 text-right">{goal.progress.toFixed(1)}%</span>
            </div>
          </td>
        </>
      )}

      {/* Deadline */}
      <td className="px-4 py-3 whitespace-nowrap text-sm">
        {isCompleted ? (
          <span className="text-green-600 font-medium">
            🎉 {formatDate(goal.completed_date)}
          </span>
        ) : (
          <span className={`font-medium ${isOverdue ? 'text-red-600' : daysRemaining <= 7 ? 'text-orange-600' : 'text-gray-700'}`}>
            {formatDate(goal.deadline)}
          </span>
        )}
      </td>

      {/* Countdown - prominent for all goals */}
      <td className="px-4 py-3 whitespace-nowrap text-center">
        {isCompleted ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
            ✓ Xong
          </span>
        ) : isOverdue ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">
            ⚠ Quá {Math.abs(daysRemaining)} ngày
          </span>
        ) : daysRemaining === 0 ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
            🔥 Hôm nay
          </span>
        ) : daysRemaining <= 3 ? (
          <span className={`inline-flex items-center gap-1 px-2.5 py-1.5 ${isPlan ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'} rounded-full text-xs font-bold`}>
            ⏰ {daysRemaining} ngày
          </span>
        ) : daysRemaining <= 7 ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">
            📅 {daysRemaining} ngày
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">
            📅 {daysRemaining} ngày
          </span>
        )}
      </td>

      {/* Actions */}
      <td className="px-4 py-3 whitespace-nowrap text-right">
        <div className="flex items-center justify-end gap-1 transition-opacity">
          {!isCompleted && goal.progress >= 100 && (
            <button
              onClick={() => onComplete(goal)}
              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Đánh dấu hoàn thành"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}
          <button
            onClick={() => onEdit(goal)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Sửa"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(goal)}
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