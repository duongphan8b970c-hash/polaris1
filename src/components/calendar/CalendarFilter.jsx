const TYPE_OPTIONS = [
  { value: 'all', label: 'Tất cả', icon: '📋' },
  { value: 'task', label: 'Task', icon: '✅' },
  { value: 'subtask', label: 'Subtask', icon: '📌' },
]

export default function CalendarFilter({ filter, onChange, goals }) {
  const handleTypeChange = (type) => {
    onChange({ ...filter, type })
  }

  const handleGoalChange = (goalId) => {
    onChange({ ...filter, goalId })
  }

  const hasActiveFilter = filter.type !== 'all' || filter.goalId !== 'all'

  const handleClear = () => {
    onChange({ type: 'all', goalId: 'all' })
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Label */}
        <span className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 shrink-0">
          🔍 Lọc:
        </span>

        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 shrink-0">Loại:</span>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleTypeChange(option.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  filter.type === option.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {option.icon} {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Goal Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 shrink-0">Goal:</span>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => handleGoalChange('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                filter.goalId === 'all'
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900'
              }`}
            >
              Tất cả
            </button>
            {goals.map((goal) => (
              <button
                key={goal.id}
                onClick={() => handleGoalChange(goal.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border flex items-center gap-1 ${
                  filter.goalId === goal.id
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900'
                }`}
                style={
                  filter.goalId === goal.id && goal.color
                    ? { borderColor: goal.color, backgroundColor: `${goal.color}1a`, color: goal.color }
                    : {}
                }
              >
                {goal.icon && <span>{goal.icon}</span>}
                <span className="max-w-[120px] truncate">{goal.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Clear Filter Button */}
        {hasActiveFilter && (
          <button
            onClick={handleClear}
            className="ml-auto text-xs text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1 shrink-0"
          >
            ✕ Xóa lọc
          </button>
        )}
      </div>
    </div>
  )
}
