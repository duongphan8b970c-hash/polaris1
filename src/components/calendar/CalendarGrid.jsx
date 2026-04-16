import { getDaysInMonth, isSameDay } from '../../utils/calendar'
import CalendarDay from './CalendarDay'

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

export default function CalendarGrid({ year, month, items, selectedDate, onDateClick }) {
  const days = getDaysInMonth(year, month)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {WEEKDAYS.map((day, index) => (
          <div
            key={index}
            className={`text-center text-xs font-bold py-2 ${
              index === 0 || index === 6 ? 'text-red-600' : 'text-gray-600'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => (
          <CalendarDay
            key={index}
            day={day}
            items={items}
            isSelected={selectedDate && isSameDay(day.date, selectedDate)}
            onClick={() => onDateClick(day.date)}
          />
        ))}
      </div>
    </div>
  )
}