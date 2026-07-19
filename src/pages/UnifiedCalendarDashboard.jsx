import { useState, useMemo } from 'react'
import { useCalendarItemsForMonth } from '../hooks/goals/useCalendarItems'
import { usePaybackGoals } from '../hooks/finance/usePaybackGoals'
import { getDaysInMonth, getMonthName, isSameDay, getItemsForDate } from '../utils/calendar'
import { formatNumber } from '../utils'
import PageHeader from '../components/layout/PageHeader'
import TodayTasksPanel from '../components/calendar/TodayTasksPanel'
import Loading from '../components/common/Loading'
import ErrorMessage from '../components/common/ErrorMessage'

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

// Normalize a stored deadline (YYYY-MM-DD) to a local midnight Date
function normalizeDeadline(deadline) {
  const d = new Date(deadline)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function isSameCalendarDay(deadline, date) {
  const d = normalizeDeadline(deadline)
  return (
    d.getFullYear() === date.getFullYear() &&
    d.getMonth() === date.getMonth() &&
    d.getDate() === date.getDate()
  )
}

const FILTERS = [
  { value: 'all', label: '🗓️ Tất cả' },
  { value: 'tasks', label: '📝 Công việc' },
  { value: 'payback', label: '💳 Payback' },
  { value: 'plan', label: '📋 Plan' },
]

export default function UnifiedCalendarDashboard() {
  const today = useMemo(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }, [])
  const [currentYear, setCurrentYear] = useState(() => today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(() => today.getMonth())
  const [selectedDate, setSelectedDate] = useState(() => today)
  const [viewMode, setViewMode] = useState('team') // 'team' | 'personal' (tasks only)
  const [filter, setFilter] = useState('all')

  // Data sources
  const {
    items: taskItems,
    loading: tasksLoading,
    error: tasksError,
    refetch: refetchTasks,
  } = useCalendarItemsForMonth(currentYear, currentMonth, { includeTeam: viewMode === 'team' })

  const { goals: paybackGoals, loading: paybackLoading, error: paybackError } = usePaybackGoals('payback')
  const { goals: planGoals, loading: planLoading, error: planError } = usePaybackGoals('plan')

  const loading = tasksLoading || paybackLoading || planLoading
  const error = tasksError || paybackError || planError

  const showTasks = filter === 'all' || filter === 'tasks'
  const showPayback = filter === 'all' || filter === 'payback'
  const showPlan = filter === 'all' || filter === 'plan'

  // Merge finance goals (active + has deadline), tagged with their type
  const financeItems = useMemo(() => {
    const tagged = [
      ...paybackGoals.map(g => ({ ...g, goalType: 'payback' })),
      ...planGoals.map(g => ({ ...g, goalType: 'plan' })),
    ]
    return tagged.filter(g => g.deadline && g.status !== 'completed')
  }, [paybackGoals, planGoals])

  const getFinanceForDate = (date) => {
    return financeItems.filter(g => {
      if (g.goalType === 'payback' && !showPayback) return false
      if (g.goalType === 'plan' && !showPlan) return false
      return isSameCalendarDay(g.deadline, date)
    })
  }

  // Month-level finance items (for stats)
  const monthFinance = useMemo(
    () => financeItems.filter(g => {
      if (g.goalType === 'payback' && !showPayback) return false
      if (g.goalType === 'plan' && !showPlan) return false
      const d = normalizeDeadline(g.deadline)
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth
    }),
    [financeItems, currentYear, currentMonth, showPayback, showPlan]
  )

  // Stats
  const stats = useMemo(() => {
    const monthTasks = showTasks ? taskItems : []
    const completedTasks = monthTasks.filter(item =>
      item.type === 'task' ? item.status === 'completed' : item.is_completed === true
    ).length
    const financeAmount = monthFinance.reduce(
      (s, g) => s + (g.goalType === 'plan' ? g.target_amount : (g.remaining ?? g.target_amount)),
      0
    )
    const overdue = monthFinance.filter(g => normalizeDeadline(g.deadline) < today).length
    return {
      taskTotal: monthTasks.length,
      taskCompleted: completedTasks,
      financeCount: monthFinance.length,
      financeAmount,
      overdue,
    }
  }, [taskItems, monthFinance, showTasks, today])

  const days = getDaysInMonth(currentYear, currentMonth)
  const isCurrentMonth = currentYear === today.getFullYear() && currentMonth === today.getMonth()

  const selectedTaskItems = showTasks ? getItemsForDate(taskItems, selectedDate) : []
  const selectedFinance = getFinanceForDate(selectedDate)

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

  if (loading) {
    return <Loading message="Đang tải tổng quan..." />
  }

  if (error) {
    return <ErrorMessage message={error} />
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="🗓️ Tổng quan"
        action={
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('personal')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'personal' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              👤 Cá nhân
            </button>
            <button
              onClick={() => setViewMode('team')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'team' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              👥 Team
            </button>
          </div>
        }
      />

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              filter === f.value
                ? 'bg-gray-900 text-white shadow-md'
                : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow">
          <p className="text-blue-100 text-sm font-medium">Công việc</p>
          <p className="text-3xl font-bold mt-1">{stats.taskTotal}</p>
          <p className="text-blue-100 text-xs">{stats.taskCompleted} hoàn thành</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-4 text-white shadow">
          <p className="text-indigo-100 text-sm font-medium">Các khoản đã lên kế hoạch</p>
          <p className="text-3xl font-bold mt-1">{stats.financeCount}</p>
          <p className="text-teal-100 text-xs">khoản</p>
        </div>
        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-4 text-white shadow">
          <p className="text-teal-100 text-sm font-medium">Tổng tiền</p>
          <p className="text-3xl font-bold mt-1">{formatNumber(stats.financeAmount)}</p>
          <p className="text-teal-100 text-xs">VND</p>
        </div>
        <div className={`bg-gradient-to-br ${stats.overdue > 0 ? 'from-rose-500 to-rose-600' : 'from-green-500 to-green-600'} rounded-xl p-4 text-white shadow`}>
          <p className="text-white/80 text-sm font-medium">Quá hạn</p>
          <p className="text-3xl font-bold mt-1">{stats.overdue}</p>
          <p className="text-white/80 text-xs">{stats.overdue > 0 ? 'cần xử lý' : 'không có'}</p>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
          {getMonthName(currentMonth)} {currentYear}
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Tháng trước">
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleToday}
            disabled={isCurrentMonth}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              isCurrentMonth ? 'bg-blue-100 text-blue-600 cursor-default' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Hôm nay
          </button>
          <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Tháng sau">
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-blue-500 inline-block"></span>
          <span className="text-gray-600">📝 Công việc</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-orange-500 inline-block"></span>
          <span className="text-gray-600">💳 Payback</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-teal-500 inline-block"></span>
          <span className="text-gray-600">📋 Plan</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {WEEKDAYS.map((d, i) => (
            <div key={i} className={`text-center text-xs font-bold py-2 ${i === 0 || i === 6 ? 'text-red-600' : 'text-gray-600'}`}>
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            const dayTasks = showTasks ? getItemsForDate(taskItems, day.date) : []
            const dayFinance = getFinanceForDate(day.date)
            const paybackCount = dayFinance.filter(g => g.goalType === 'payback').length
            const planCount = dayFinance.filter(g => g.goalType === 'plan').length
            const taskCompleted = dayTasks.filter(item =>
              item.type === 'task' ? item.status === 'completed' : item.is_completed === true
            ).length

            const hasAny = dayTasks.length > 0 || dayFinance.length > 0
            const hasOverdueFinance = dayFinance.some(g => normalizeDeadline(g.deadline) < today)

            const isTodayCell = isSameDay(day.date, today)
            const isSelected = isSameDay(day.date, selectedDate)

            let borderClass = 'border-gray-200'
            if (hasAny) borderClass = hasOverdueFinance ? 'border-red-300 bg-red-50' : 'border-gray-300'

            return (
              <button
                key={index}
                onClick={() => setSelectedDate(day.date)}
                className={`
                  relative h-24 border-2 rounded-lg transition-all hover:shadow-md p-1
                  ${day.isCurrentMonth ? 'bg-white' : 'bg-gray-100 opacity-60'}
                  ${isSelected ? 'ring-2 ring-blue-500 border-blue-500' : borderClass}
                  ${isTodayCell && !isSelected ? 'ring-2 ring-blue-400' : ''}
                `}
              >
                {/* Date Number */}
                <div className="absolute top-1 left-2">
                  <span className={`text-sm font-semibold ${
                    !day.isCurrentMonth ? 'text-gray-400' : isTodayCell ? 'text-blue-600' : 'text-gray-700'
                  }`}>
                    {day.date.getDate()}
                  </span>
                </div>

                {/* Today Badge */}
                {isTodayCell && (
                  <div className="absolute top-1 right-1">
                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  </div>
                )}

                {/* Category pills */}
                {hasAny && (
                  <div className="absolute bottom-1 left-0 right-0 px-1 flex flex-wrap justify-center gap-1">
                    {dayTasks.length > 0 && (
                      <span className="text-[10px] font-bold bg-blue-500 text-white rounded px-1 leading-4">
                        📝 {taskCompleted}/{dayTasks.length}
                      </span>
                    )}
                    {paybackCount > 0 && (
                      <span className="text-[10px] font-bold bg-orange-500 text-white rounded px-1 leading-4">
                        💳 {paybackCount}
                      </span>
                    )}
                    {planCount > 0 && (
                      <span className="text-[10px] font-bold bg-teal-500 text-white rounded px-1 leading-4">
                        📋 {planCount}
                      </span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Finance details for selected date */}
      {(showPayback || showPlan) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="text-base font-bold text-gray-900 mb-3">
            💰 Tài chính đến hạn
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({selectedFinance.length} khoản) — {selectedDate.getDate()}/{selectedDate.getMonth() + 1}/{selectedDate.getFullYear()}
            </span>
          </h3>

          {selectedFinance.length > 0 ? (
            <div className="space-y-2">
              {selectedFinance.map(goal => {
                const deadline = normalizeDeadline(goal.deadline)
                const daysRemaining = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24))
                const isOverdue = daysRemaining < 0
                const isPlan = goal.goalType === 'plan'
                const amount = isPlan ? goal.target_amount : (goal.remaining ?? goal.target_amount)

                return (
                  <div
                    key={`${goal.goalType}-${goal.id}`}
                    className={`flex items-center justify-between p-3 rounded-xl border ${
                      isOverdue
                        ? 'bg-red-50 border-red-200'
                        : daysRemaining <= 7
                        ? (isPlan ? 'bg-teal-50 border-teal-200' : 'bg-orange-50 border-orange-200')
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{isPlan ? '📋' : '💳'}</span>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {goal.name}
                          <span className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isPlan ? 'bg-teal-100 text-teal-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {isPlan ? 'PLAN' : 'PAYBACK'}
                          </span>
                        </p>
                        {goal.description && (
                          <p className="text-xs text-gray-500">{goal.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-gray-900">{formatNumber(amount)} ₫</p>
                      <p className={`text-xs font-medium ${
                        isOverdue ? 'text-red-600' :
                        daysRemaining <= 7 ? (isPlan ? 'text-teal-600' : 'text-orange-600') :
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
          ) : (
            <div className="text-center py-6 text-gray-400 text-sm">
              <p>📅 Không có khoản tài chính nào đến hạn ngày này</p>
            </div>
          )}
        </div>
      )}

      {/* Tasks panel for selected date */}
      {showTasks && (
        <TodayTasksPanel
          date={selectedDate}
          items={selectedTaskItems}
          allMonthItems={taskItems}
          onRefresh={refetchTasks}
        />
      )}
    </div>
  )
}
