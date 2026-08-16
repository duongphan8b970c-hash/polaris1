import { ZOOM_LEVELS } from '../../utils/timelineScale'
import { GOAL_HEALTH_META, PRIORITY_META } from '../../utils/taskHealth'

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'open', label: 'Chưa xong' },
  { value: 'todo', label: '📝 Cần làm' },
  { value: 'in_progress', label: '⏳ Đang làm' },
  { value: 'blocked', label: '🚫 Bị chặn' },
  { value: 'overdue', label: '⚠️ Quá hạn' },
  { value: 'completed', label: '✅ Hoàn thành' },
]

const RANGE_OPTIONS = [
  { value: 'month', label: 'Tháng này' },
  { value: 'quarter', label: '3 tháng' },
  { value: 'half', label: '6 tháng' },
  { value: 'all', label: 'Toàn bộ' },
]

const SORT_OPTIONS = [
  { value: 'urgency', label: 'Ưu tiên + hạn chót' },
  { value: 'start', label: 'Ngày bắt đầu' },
  { value: 'due', label: 'Hạn chót' },
  { value: 'priority', label: 'Độ ưu tiên' },
  { value: 'title', label: 'Tên A→Z' },
]

const GOAL_SORT_OPTIONS = [
  { value: 'health', label: 'Sức khỏe (rủi ro trước)' },
  { value: 'start', label: 'Ngày bắt đầu' },
  { value: 'due', label: 'Hạn mục tiêu' },
  { value: 'priority', label: 'Độ ưu tiên' },
  { value: 'name', label: 'Tên A→Z' },
]

function Select({ label, value, onChange, options }) {
  return (
    <label className="flex items-center gap-1.5">
      <span className="text-xs text-gray-500 whitespace-nowrap">{label}:</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 max-w-[190px]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

/**
 * Filter + sort controls for the timeline: goal, priority, status, owner, date
 * range and goal health, plus the zoom level of the date axis.
 */
export default function TimelineToolbar({
  filters,
  onFiltersChange,
  sort,
  onSortChange,
  goalSort,
  onGoalSortChange,
  zoom,
  onZoomChange,
  goals,
  owners,
  visibleCounts,
}) {
  const update = (patch) => onFiltersChange({ ...filters, ...patch })

  const hasActiveFilter =
    filters.goalId !== 'all' ||
    filters.priority !== 'all' ||
    filters.status !== 'all' ||
    filters.ownerId !== 'all' ||
    filters.health !== 'all' ||
    filters.range !== 'quarter'

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 shrink-0">🔍 Lọc</span>

        <Select
          label="Mục tiêu"
          value={filters.goalId}
          onChange={(goalId) => update({ goalId })}
          options={[
            { value: 'all', label: `Tất cả (${goals.length})` },
            ...goals.map((goal) => ({ value: goal.id, label: `${goal.icon || '🎯'} ${goal.name}` })),
          ]}
        />

        <Select
          label="Ưu tiên"
          value={filters.priority}
          onChange={(priority) => update({ priority })}
          options={[
            { value: 'all', label: 'Tất cả' },
            ...['urgent', 'high', 'medium', 'low'].map((key) => ({
              value: key,
              label: `${PRIORITY_META[key].icon} ${PRIORITY_META[key].label}`,
            })),
          ]}
        />

        <Select
          label="Trạng thái"
          value={filters.status}
          onChange={(status) => update({ status })}
          options={STATUS_OPTIONS}
        />

        <Select
          label="Người thực hiện"
          value={filters.ownerId}
          onChange={(ownerId) => update({ ownerId })}
          options={[
            { value: 'all', label: 'Tất cả' },
            { value: 'unassigned', label: 'Chưa gán' },
            ...owners.map((owner) => ({
              value: owner.id,
              label: owner.full_name || owner.email || owner.id.slice(0, 8),
            })),
          ]}
        />

        <Select
          label="Sức khỏe"
          value={filters.health}
          onChange={(health) => update({ health })}
          options={[
            { value: 'all', label: 'Tất cả' },
            ...['off_track', 'at_risk', 'on_track', 'completed', 'no_data'].map((key) => ({
              value: key,
              label: `${GOAL_HEALTH_META[key].icon} ${GOAL_HEALTH_META[key].label}`,
            })),
          ]}
        />

        <Select
          label="Khoảng thời gian"
          value={filters.range}
          onChange={(range) => update({ range })}
          options={RANGE_OPTIONS}
        />

        {hasActiveFilter && (
          <button
            onClick={() =>
              onFiltersChange({
                goalId: 'all',
                priority: 'all',
                status: 'all',
                ownerId: 'all',
                health: 'all',
                range: 'quarter',
              })
            }
            className="text-xs text-gray-500 hover:text-red-600 transition-colors shrink-0"
          >
            ✕ Xóa lọc
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100">
        <span className="text-sm font-semibold text-gray-700 shrink-0">↕️ Sắp xếp</span>

        <Select label="Mục tiêu" value={goalSort} onChange={onGoalSortChange} options={GOAL_SORT_OPTIONS} />
        <Select label="Task" value={sort} onChange={onSortChange} options={SORT_OPTIONS} />

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500 whitespace-nowrap">Thu phóng:</span>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {Object.values(ZOOM_LEVELS).map((level) => (
              <button
                key={level.key}
                onClick={() => onZoomChange(level.key)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  zoom === level.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        {visibleCounts && (
          <span className="ml-auto text-xs text-gray-500">
            {visibleCounts.goals} mục tiêu · {visibleCounts.tasks} task · {visibleCounts.subtasks} subtask
            {visibleCounts.undated > 0 && (
              <span className="text-amber-600"> · {visibleCounts.undated} task chưa có ngày (ẩn)</span>
            )}
          </span>
        )}
      </div>
    </div>
  )
}
