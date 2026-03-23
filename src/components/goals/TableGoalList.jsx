import TableGoalRow from '../common/TableGoalRow'

export default function TableGoalList({
  goals,
  onEdit,
  onDelete,
  onComplete,
}) {
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
        <p className="text-gray-600 max-w-md mx-auto">
          Tạo mục tiêu đầu tiên để bắt đầu theo dõi tiến độ và hoàn thành các dự án của bạn
        </p>
      </div>
    )
  }

  const activeGoals = safeGoals.filter((g) => g.status !== 'completed')
  const completedGoals = safeGoals.filter((g) => g.status === 'completed')

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          {/* Table Header */}
          <thead>
            <tr className="bg-gray-50 border-b-2 border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Tên
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                Trạng thái
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                Ưu tiên
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                Tiến độ
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                Thời lượng
              </th>
              <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                Thao tác
              </th>
            </tr>
          </thead>

          <tbody>
            {/* Active goals section */}
            {activeGoals.length > 0 && (
              <>
                <tr className="bg-gray-50 border-t-2 border-gray-200">
                  <td colSpan={6} className="px-4 py-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                      <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Đang thực hiện ({activeGoals.length})
                    </div>
                  </td>
                </tr>
                {activeGoals.map((goal) => (
                  <TableGoalRow
                    key={goal.id}
                    goal={goal}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onComplete={onComplete}
                  />
                ))}
              </>
            )}

            {/* Completed goals section */}
            {completedGoals.length > 0 && (
              <>
                <tr className="bg-gray-50 border-t-2 border-gray-200">
                  <td colSpan={6} className="px-4 py-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                      <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Đã hoàn thành ({completedGoals.length})
                    </div>
                  </td>
                </tr>
                {completedGoals.map((goal) => (
                  <TableGoalRow
                    key={goal.id}
                    goal={goal}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onComplete={onComplete}
                  />
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
