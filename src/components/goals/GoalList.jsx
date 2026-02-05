import GoalCard from './GoalCard'

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
    <div className="space-y-6">
      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Đang thực hiện ({activeGoals.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {activeGoals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={onEdit}
                onDelete={onDelete}
                onComplete={onComplete}
                onClick={() => onGoalClick && onGoalClick(goal)}
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {completedGoals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={onEdit}
                onDelete={onDelete}
                onComplete={onComplete}
                onClick={() => onGoalClick && onGoalClick(goal)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}