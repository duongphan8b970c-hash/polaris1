import { getMonthName } from '../../utils/calendar'

export default function CalendarMonthNav({ year, month, onPrevMonth, onNextMonth, onToday }) {
  const today = new Date()
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth()

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {getMonthName(month)} {year}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Theo dõi tiến độ công việc hàng ngày
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* Previous Month */}
        <button
          onClick={onPrevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Tháng trước"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Today Button */}
        <button
          onClick={onToday}
          disabled={isCurrentMonth}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            isCurrentMonth
              ? 'bg-blue-100 text-blue-600 cursor-default'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Hôm nay
        </button>

        {/* Next Month */}
        <button
          onClick={onNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Tháng sau"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}