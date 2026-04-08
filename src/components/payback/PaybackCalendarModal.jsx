import { useState } from 'react'
import { getDaysInMonth, getMonthName, isSameDay } from '../../utils/calendar'
import { formatNumber } from '../../utils'

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

function getPaybacksForDate(goals, date) {
  return goals.filter(g => {
    if (!g.deadline || g.status === 'completed') return false
    const deadline = new Date(g.deadline)
    return (
      deadline.getFullYear() === date.getFullYear() &&
      deadline.getMonth() === date.getMonth() &&
      deadline.getDate() === date.getDate()
    )
  })
}

function getPaybacksForMonth(goals, year, month) {
  return goals.filter(g => {
    if (!g.deadline || g.status === 'completed') return false
    const deadline = new Date(g.deadline)
    return deadline.getFullYear() === year && deadline.getMonth() === month
  })
}

export default function PaybackCalendarModal({ goals = [], onClose }) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()) // Normalized to midnight
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState(today)

  const days = getDaysInMonth(currentYear, currentMonth)
  const monthPaybacks = getPaybacksForMonth(goals, currentYear, currentMonth)
  const selectedPaybacks = getPaybacksForDate(goals, selectedDate)

  const isCurrentMonth = currentYear === today.getFullYear() && currentMonth === today.getMonth()

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(y => y - 1)
    } else {
      setCurrentMonth(m => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(y => y + 1)
    } else {
      setCurrentMonth(m => m + 1)
    }
  }

  const handleToday = () => {
    setCurrentYear(today.getFullYear())
    setCurrentMonth(today.getMonth())
    setSelectedDate(today)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📅</span>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Lịch Payback</h2>
              <p className="text-sm text-gray-500">Theo dõi các khoản sắp đến hạn</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              {getMonthName(currentMonth)} {currentYear}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={handleToday}
                disabled={isCurrentMonth}
                className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-colors ${
                  isCurrentMonth
                    ? 'bg-orange-100 text-orange-600 cursor-default'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tháng này
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Month summary */}
          {monthPaybacks.length > 0 && (
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-xl">
              <p className="text-sm font-medium text-orange-800">
                ⏰ {monthPaybacks.length} khoản đến hạn trong {getMonthName(currentMonth)}
              </p>
              <p className="text-sm text-orange-700 mt-1">
                Tổng: {formatNumber(monthPaybacks.reduce((s, g) => s + g.remaining, 0))} ₫ còn lại
              </p>
            </div>
          )}

          {/* Calendar Grid */}
          <div className="bg-white border border-gray-200 rounded-xl p-3 mb-4">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {WEEKDAYS.map((d, i) => (
                <div
                  key={i}
                  className={`text-center text-xs font-bold py-1 ${i === 0 || i === 6 ? 'text-red-500' : 'text-gray-500'}`}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                const dayPaybacks = getPaybacksForDate(goals, day.date)
                const isToday = isSameDay(day.date, today)
                const isSelected = isSameDay(day.date, selectedDate)

                // Determine urgency
                const hasOverdue = dayPaybacks.some(g => {
                  const d = new Date(g.deadline)
                  const deadline = new Date(d.getFullYear(), d.getMonth(), d.getDate())
                  return deadline < today
                })
                const hasDueSoon = dayPaybacks.some(g => {
                  const d = new Date(g.deadline)
                  const deadline = new Date(d.getFullYear(), d.getMonth(), d.getDate())
                  const diff = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24))
                  return diff >= 0 && diff <= 7
                })

                let bgClass = ''
                if (dayPaybacks.length > 0) {
                  if (hasOverdue) bgClass = 'bg-red-100 border-red-300'
                  else if (hasDueSoon) bgClass = 'bg-orange-100 border-orange-300'
                  else bgClass = 'bg-blue-50 border-blue-200'
                }

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(day.date)}
                    className={`
                      relative h-12 border rounded-lg transition-all text-sm
                      ${day.isCurrentMonth ? '' : 'opacity-30'}
                      ${isSelected ? 'ring-2 ring-orange-500 border-orange-500' : bgClass || 'border-gray-100'}
                      ${isToday && !isSelected ? 'ring-2 ring-orange-300' : ''}
                      hover:shadow-sm
                    `}
                  >
                    <span className={`text-xs font-semibold ${
                      isToday ? 'text-orange-600' :
                      !day.isCurrentMonth ? 'text-gray-300' :
                      'text-gray-700'
                    }`}>
                      {day.date.getDate()}
                    </span>
                    {dayPaybacks.length > 0 && (
                      <span className={`absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold text-white ${
                        hasOverdue ? 'bg-red-500' :
                        hasDueSoon ? 'bg-orange-500' :
                        'bg-blue-500'
                      }`}>
                        {dayPaybacks.length}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mb-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
              <span className="text-gray-600">Quá hạn</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-orange-500 inline-block"></span>
              <span className="text-gray-600">Sắp đến hạn (≤7 ngày)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>
              <span className="text-gray-600">Còn thời gian</span>
            </div>
          </div>

          {/* Selected date paybacks */}
          {selectedPaybacks.length > 0 ? (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                📋 Ngày {selectedDate.getDate()}/{selectedDate.getMonth() + 1}/{selectedDate.getFullYear()}
              </h4>
              <div className="space-y-2">
                {selectedPaybacks.map(goal => {
                  const d = new Date(goal.deadline)
                  const deadline = new Date(d.getFullYear(), d.getMonth(), d.getDate())
                  const daysRemaining = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24))
                  const isOverdue = daysRemaining < 0

                  return (
                    <div
                      key={goal.id}
                      className={`flex items-center justify-between p-3 rounded-xl border ${
                        isOverdue
                          ? 'bg-red-50 border-red-200'
                          : daysRemaining <= 7
                          ? 'bg-orange-50 border-orange-200'
                          : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">💳</span>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{goal.name}</p>
                          {goal.description && (
                            <p className="text-xs text-gray-500">{goal.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-gray-900">
                          {formatNumber(goal.remaining)} ₫
                        </p>
                        <p className={`text-xs font-medium ${
                          isOverdue ? 'text-red-600' :
                          daysRemaining <= 7 ? 'text-orange-600' :
                          'text-blue-600'
                        }`}>
                          {isOverdue
                            ? `Quá ${Math.abs(daysRemaining)} ngày`
                            : daysRemaining === 0
                            ? 'Hôm nay!'
                            : `Còn ${daysRemaining} ngày`}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-400 text-sm">
              <p>📅 Không có payback đến hạn ngày này</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
