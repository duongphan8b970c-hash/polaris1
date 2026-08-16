import { useMemo, useState } from 'react'
import { usePaybackGoals } from '../../hooks/finance/usePaybackGoals'
import { formatNumber } from '../../utils'
import { getDaysInMonth, getMonthName, isSameDay } from '../../utils/calendar'
import Loading from '../common/Loading'
import ErrorMessage from '../common/ErrorMessage'

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

function parseLocalDate(dateString) {
  if (!dateString) return null
  const [year, month, day] = dateString.slice(0, 10).split('-').map(Number)
  return new Date(year, month - 1, day)
}

function isSameCalendarDay(dateString, date) {
  const deadline = parseLocalDate(dateString)
  return deadline && isSameDay(deadline, date)
}

function getDaysRemaining(dateString, today) {
  const deadline = parseLocalDate(dateString)
  if (!deadline) return null
  return Math.round((deadline - today) / (24 * 60 * 60 * 1000))
}

/** Calendar for scheduled Payback and Plan items. Goal tasks intentionally live in the Goal calendar. */
export default function FinanceCalendar() {
  const today = useMemo(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }, [])
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState(today)
  const [filter, setFilter] = useState('all')

  const { goals: paybackGoals, loading: paybackLoading, error: paybackError } = usePaybackGoals('payback')
  const { goals: planGoals, loading: planLoading, error: planError } = usePaybackGoals('plan')

  const financeItems = useMemo(
    () => [
      ...paybackGoals.map((goal) => ({ ...goal, goalType: 'payback' })),
      ...planGoals.map((goal) => ({ ...goal, goalType: 'plan' })),
    ].filter((goal) => goal.deadline && goal.status !== 'completed'),
    [paybackGoals, planGoals]
  )

  const visibleItems = useMemo(
    () => financeItems.filter((goal) => filter === 'all' || goal.goalType === filter),
    [financeItems, filter]
  )

  const monthItems = useMemo(
    () => visibleItems.filter((goal) => {
      const deadline = parseLocalDate(goal.deadline)
      return deadline && deadline.getFullYear() === currentYear && deadline.getMonth() === currentMonth
    }),
    [visibleItems, currentYear, currentMonth]
  )

  const selectedItems = useMemo(
    () => visibleItems.filter((goal) => isSameCalendarDay(goal.deadline, selectedDate)),
    [visibleItems, selectedDate]
  )

  const totalDue = monthItems.reduce(
    (sum, goal) => sum + Number(goal.goalType === 'plan' ? goal.target_amount : goal.remaining ?? goal.target_amount ?? 0),
    0
  )
  const overdueCount = monthItems.filter((goal) => getDaysRemaining(goal.deadline, today) < 0).length
  const isCurrentMonth = currentYear === today.getFullYear() && currentMonth === today.getMonth()
  const days = getDaysInMonth(currentYear, currentMonth)

  const shiftMonth = (direction) => {
    const next = new Date(currentYear, currentMonth + direction, 1)
    setCurrentYear(next.getFullYear())
    setCurrentMonth(next.getMonth())
  }

  if (paybackLoading || planLoading) return <Loading message="Đang tải lịch tài chính..." />
  if (paybackError || planError) return <ErrorMessage message={paybackError || planError} />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {[
            { value: 'all', label: 'Tất cả' },
            { value: 'payback', label: '💳 Payback' },
            { value: 'plan', label: '📋 Plan' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === option.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <CalendarMetric label="Khoản đến hạn" value={monthItems.length} detail={`${monthItems.filter((goal) => goal.goalType === 'payback').length} Payback · ${monthItems.filter((goal) => goal.goalType === 'plan').length} Plan`} tone="blue" />
        <CalendarMetric label="Tổng cần chuẩn bị" value={`${formatNumber(totalDue)} ₫`} detail="Theo các khoản trong tháng" tone="teal" />
        <CalendarMetric label="Quá hạn" value={overdueCount} detail={overdueCount ? 'Cần xử lý sớm' : 'Không có khoản quá hạn'} tone={overdueCount ? 'red' : 'green'} />
      </div>

      <div className="flex items-center justify-between gap-2">
        <button onClick={() => shiftMonth(-1)} className="rounded-lg p-2 hover:bg-gray-100" title="Tháng trước">
          <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex items-center gap-2">
          <h3 className="min-w-[160px] text-center text-lg font-bold text-gray-900">{getMonthName(currentMonth)} {currentYear}</h3>
          <button
            onClick={() => { setCurrentYear(today.getFullYear()); setCurrentMonth(today.getMonth()); setSelectedDate(today) }}
            disabled={isCurrentMonth}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${isCurrentMonth ? 'cursor-default bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Hôm nay
          </button>
        </div>
        <button onClick={() => shiftMonth(1)} className="rounded-lg p-2 hover:bg-gray-100" title="Tháng sau">
          <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="mb-2 grid grid-cols-7 gap-1 sm:gap-2">
          {WEEKDAYS.map((day, index) => <div key={day} className={`py-1 text-center text-xs font-bold ${index === 0 || index === 6 ? 'text-red-600' : 'text-gray-600'}`}>{day}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {days.map((day, index) => {
            const dayItems = visibleItems.filter((goal) => isSameCalendarDay(goal.deadline, day.date))
            const paybackCount = dayItems.filter((goal) => goal.goalType === 'payback').length
            const planCount = dayItems.filter((goal) => goal.goalType === 'plan').length
            const hasOverdue = dayItems.some((goal) => getDaysRemaining(goal.deadline, today) < 0)
            const isToday = isSameDay(day.date, today)
            const isSelected = isSameDay(day.date, selectedDate)

            return (
              <button
                key={index}
                onClick={() => setSelectedDate(day.date)}
                className={`relative h-20 rounded-lg border p-1 text-left transition-all hover:shadow-sm sm:h-24 ${
                  day.isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'
                } ${isSelected ? 'border-blue-500 ring-2 ring-blue-500' : hasOverdue ? 'border-red-300 bg-red-50' : dayItems.length ? 'border-gray-300' : 'border-gray-100'} ${isToday && !isSelected ? 'ring-2 ring-blue-300' : ''}`}
              >
                <span className={`pl-1 text-sm font-semibold ${isToday ? 'text-blue-600' : ''}`}>{day.date.getDate()}</span>
                {dayItems.length > 0 && (
                  <div className="absolute bottom-1 left-0 right-0 flex flex-wrap justify-center gap-1 px-1">
                    {paybackCount > 0 && <span className="rounded bg-orange-500 px-1 text-[10px] font-bold leading-4 text-white">💳 {paybackCount}</span>}
                    {planCount > 0 && <span className="rounded bg-teal-500 px-1 text-[10px] font-bold leading-4 text-white">📋 {planCount}</span>}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-gray-600">
        <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded bg-orange-500" />Payback</span>
        <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded bg-teal-500" />Plan</span>
        <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded bg-red-500" />Quá hạn</span>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h3 className="text-base font-bold text-gray-900">
          Khoản đến hạn ngày {selectedDate.toLocaleDateString('vi-VN')}
          <span className="ml-2 text-sm font-normal text-gray-500">({selectedItems.length} khoản)</span>
        </h3>
        {selectedItems.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">Không có khoản Payback hoặc Plan đến hạn trong ngày này.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {selectedItems.map((goal) => <FinanceItem key={`${goal.goalType}-${goal.id}`} goal={goal} today={today} />)}
          </div>
        )}
      </section>
    </div>
  )
}

function CalendarMetric({ label, value, detail, tone }) {
  const tones = {
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    teal: 'border-teal-200 bg-teal-50 text-teal-700',
    red: 'border-red-200 bg-red-50 text-red-700',
    green: 'border-green-200 bg-green-50 text-green-700',
  }
  return <div className={`rounded-xl border p-3 ${tones[tone]} `}><p className="text-xs font-medium opacity-80">{label}</p><p className="mt-1 text-xl font-bold">{value}</p><p className="mt-1 text-xs opacity-80">{detail}</p></div>
}

function FinanceItem({ goal, today }) {
  const isPlan = goal.goalType === 'plan'
  const remaining = getDaysRemaining(goal.deadline, today)
  const amount = Number(isPlan ? goal.target_amount : goal.remaining ?? goal.target_amount ?? 0)
  const urgency = remaining < 0 ? 'text-red-600' : remaining <= 7 ? (isPlan ? 'text-teal-600' : 'text-orange-600') : 'text-blue-600'

  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${remaining < 0 ? 'border-red-200 bg-red-50' : isPlan ? 'border-teal-200 bg-teal-50' : 'border-orange-200 bg-orange-50'}`}>
      <div className="min-w-0"><p className="truncate text-sm font-semibold text-gray-900">{isPlan ? '📋' : '💳'} {goal.name}</p>{goal.description && <p className="mt-0.5 truncate text-xs text-gray-500">{goal.description}</p>}</div>
      <div className="shrink-0 text-right"><p className="text-sm font-bold text-gray-900">{formatNumber(amount)} ₫</p><p className={`text-xs font-medium ${urgency}`}>{remaining < 0 ? `Quá ${Math.abs(remaining)} ngày` : remaining === 0 ? 'Đến hạn hôm nay' : `Còn ${remaining} ngày`}</p></div>
    </div>
  )
}
