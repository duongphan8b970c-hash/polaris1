const VIEW_MODES = [
  { value: 'month', label: 'Tháng', icon: '🗓️', hint: 'Tổng quan deadline & workload' },
  { value: 'week', label: 'Tuần', icon: '📆', hint: 'Lên kế hoạch các task song song' },
  { value: 'day', label: 'Ngày', icon: '📋', hint: 'Chi tiết công việc trong ngày' },
]

/** Month / Week / Day toggle for the calendar. */
export default function CalendarViewSwitcher({ value, onChange, className = '' }) {
  return (
    <div className={`flex gap-1 bg-gray-100 p-1 rounded-lg ${className}`}>
      {VIEW_MODES.map((mode) => (
        <button
          key={mode.value}
          onClick={() => onChange(mode.value)}
          title={mode.hint}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
            value === mode.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {mode.icon} {mode.label}
        </button>
      ))}
    </div>
  )
}
