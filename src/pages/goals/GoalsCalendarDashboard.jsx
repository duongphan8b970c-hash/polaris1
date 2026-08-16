import { useState, useMemo } from 'react'
import { useCalendarItems } from '../../hooks/goals/useCalendarItems'
import { useAnalytics } from '../../hooks/analytics/useAnalytics'
import { useCalendarCheckIn } from '../../hooks/calendar/useCalendarCheckIn'
import { getItemsForDate, getMonthName, getWeekLabel } from '../../utils/calendar'
import CalendarStatsSection from '../../components/calendar/CalendarStatsSection'
import CalendarGrid from '../../components/calendar/CalendarGrid'
import CalendarWeekView from '../../components/calendar/CalendarWeekView'
import CalendarDayView from '../../components/calendar/CalendarDayView'
import CalendarViewSwitcher from '../../components/calendar/CalendarViewSwitcher'
import CalendarFilter from '../../components/calendar/CalendarFilter'
import SelectedDatePanel from '../../components/calendar/SelectedDatePanel'
import StatsCard from '../../components/analytics/StatsCard'
import Loading from '../../components/common/Loading'
import ErrorMessage from '../../components/common/ErrorMessage'

export default function GoalsCalendarDashboard({ embedded = false }) {
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState(today)
  const [viewMode, setViewMode] = useState('team')
  const [activeTab, setActiveTab] = useState('calendar')
  const [dateRange, setDateRange] = useState('month')
  const [calendarFilter, setCalendarFilter] = useState({ type: 'all', goalId: 'all' })
  const [calendarView, setCalendarView] = useState('month')

  // Fetch the month padded by a week so the month grid's leading/trailing cells
  // and any week that straddles two months are fully populated.
  const fetchStart = useMemo(
    () => new Date(currentYear, currentMonth, 1 - 7, 0, 0, 0, 0),
    [currentYear, currentMonth]
  )
  const fetchEnd = useMemo(
    () => new Date(currentYear, currentMonth + 1, 7, 23, 59, 59, 999),
    [currentYear, currentMonth]
  )

  const { items, loading, error, refetch } = useCalendarItems(fetchStart, fetchEnd, {
    includeTeam: viewMode === 'team',
  })

  const { checkIn, updating } = useCalendarCheckIn(refetch)

  // The fetch window is padded, so narrow back down when we mean "this month".
  const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-`

  // Stats describe the month itself, not the padding days.
  const monthItems = useMemo(
    () => items.filter((item) => item.instance_date?.startsWith(monthPrefix)),
    [items, monthPrefix]
  )

  const { analytics, loading: analyticsLoading } = useAnalytics(dateRange)

  // Derive unique goals from loaded calendar items (no extra API call needed)
  const availableGoals = useMemo(() => {
    const goalsMap = new Map()
    items.forEach(item => {
      if (item.goal && item.goal.id && !goalsMap.has(item.goal.id)) {
        goalsMap.set(item.goal.id, item.goal)
      }
    })
    return Array.from(goalsMap.values())
  }, [items])

  // Apply filters client-side
  const filteredItems = useMemo(() => {
    let result = items
    if (calendarFilter.type !== 'all') {
      result = result.filter(item => item.type === calendarFilter.type)
    }
    if (calendarFilter.goalId !== 'all') {
      result = result.filter(item => item.goal?.id === calendarFilter.goalId)
    }
    return result
  }, [items, calendarFilter])

  // "Còn lại trong tháng" must respect the active filter too.
  const filteredMonthItems = useMemo(
    () => filteredItems.filter((item) => item.instance_date?.startsWith(monthPrefix)),
    [filteredItems, monthPrefix]
  )

  /** Keep the fetch window anchored on whatever date is selected. */
  const goToDate = (date) => {
    setSelectedDate(date)
    setCurrentYear(date.getFullYear())
    setCurrentMonth(date.getMonth())
  }

  /**
   * Step backwards/forwards by the unit the current view shows: a month, a week
   * or a day.
   */
  const shiftPeriod = (direction) => {
    if (calendarView === 'month') {
      const next = new Date(currentYear, currentMonth + direction, 1)
      setCurrentYear(next.getFullYear())
      setCurrentMonth(next.getMonth())
      // Keep the selection inside the month being viewed.
      const day = Math.min(selectedDate.getDate(), new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate())
      setSelectedDate(new Date(next.getFullYear(), next.getMonth(), day))
      return
    }

    const step = calendarView === 'week' ? 7 : 1
    const next = new Date(selectedDate)
    next.setDate(next.getDate() + step * direction)
    goToDate(next)
  }

  const handleToday = () => goToDate(new Date())

  const handleDateClick = (date) => {
    // Clicking a leading/trailing cell of the month grid also moves the month.
    if (calendarView === 'month' && date.getMonth() !== currentMonth) {
      goToDate(date)
      return
    }
    setSelectedDate(date)
  }

  const periodLabel =
    calendarView === 'month'
      ? `${getMonthName(currentMonth)} ${currentYear}`
      : calendarView === 'week'
      ? getWeekLabel(selectedDate)
      : selectedDate.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const isViewingToday =
    calendarView === 'month'
      ? currentYear === today.getFullYear() && currentMonth === today.getMonth()
      : selectedDate.toDateString() === today.toDateString()

  const selectedDateItems = getItemsForDate(filteredItems, selectedDate)

  if (loading) {
    return <Loading message="Đang tải calendar..." />
  }

  if (error) {
    return <ErrorMessage message={error} />
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      {!embedded && (
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            🎯 Goals Management
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý mục tiêu, công việc và theo dõi tiến độ
          </p>
        </div>

        {/* View Mode Toggle (Only show in calendar tab) */}
        {activeTab === 'calendar' && (
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('personal')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'personal'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              👤 Cá nhân
            </button>
            <button
              onClick={() => setViewMode('team')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'team'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              👥 Team
            </button>
          </div>
        )}

        {/* Date Range Toggle (Only show in analytics tab) */}
        {activeTab === 'analytics' && (
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            {[
              { value: 'week', label: '7 ngày' },
              { value: 'month', label: '30 ngày' },
              { value: 'quarter', label: '3 tháng' }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setDateRange(option.value)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  dateRange === option.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
      )}

      {embedded && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">🎯 Lịch Goal</h2>
            <p className="text-sm text-gray-600">Lịch công việc, task và subtask của Goal.</p>
          </div>
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
        </div>
      )}

      {/* ✅ NEW: Tab Navigation */}
      {!embedded && (
      <div className="border-b border-gray-200">
        <nav className="flex gap-5">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'calendar'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            📅 Calendar
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'analytics'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            📊 Analytics
          </button>
        </nav>
      </div>
      )}

      {/* ✅ Calendar Tab Content */}
      {(embedded || activeTab === 'calendar') && (
        <>
          {/* Stats Cards */}
          <CalendarStatsSection
            items={monthItems}
            year={currentYear}
            month={currentMonth}
          />

          {/* Period Navigation + Month / Week / Day switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => shiftPeriod(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Kỳ trước"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 min-w-[190px] text-center">
                {periodLabel}
              </h2>
              <button
                onClick={() => shiftPeriod(1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Kỳ sau"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={handleToday}
                disabled={isViewingToday}
                className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-colors ${
                  isViewingToday
                    ? 'bg-blue-100 text-blue-600 cursor-default'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Hôm nay
              </button>
            </div>

            <CalendarViewSwitcher value={calendarView} onChange={setCalendarView} />
          </div>

          {/* Calendar Filter */}
          <CalendarFilter
            filter={calendarFilter}
            onChange={setCalendarFilter}
            goals={availableGoals}
          />

          {/* Calendar + selected-date tasks side by side (no scrolling needed) */}
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-4 items-start">
            <div className="min-w-0">
              {calendarView === 'month' && (
                <CalendarGrid
                  year={currentYear}
                  month={currentMonth}
                  items={filteredItems}
                  selectedDate={selectedDate}
                  onDateClick={handleDateClick}
                />
              )}

              {calendarView === 'week' && (
                <CalendarWeekView
                  anchorDate={selectedDate}
                  items={filteredItems}
                  selectedDate={selectedDate}
                  onDateClick={handleDateClick}
                />
              )}

              {calendarView === 'day' && (
                <CalendarDayView
                  date={selectedDate}
                  items={filteredItems}
                  onToggleItem={checkIn}
                  updating={updating}
                />
              )}
            </div>

            {/* Day view already lists the selected day, so the panel opens on
                the month backlog instead of repeating it. */}
            <SelectedDatePanel
              key={calendarView === 'day' ? 'day-view' : 'grid-view'}
              date={selectedDate}
              items={selectedDateItems}
              allMonthItems={filteredMonthItems}
              defaultTab={calendarView === 'day' ? 'upcoming' : 'day'}
              onCheckIn={checkIn}
              updating={updating}
            />
          </div>
        </>
      )}

      {/* ✅ Analytics Tab Content */}
      {!embedded && activeTab === 'analytics' && (
        <>
          {analyticsLoading ? (
            <Loading message="Đang tải analytics..." />
          ) : analytics ? (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                  icon="📋"
                  label="Tổng số tasks"
                  value={analytics.totalTasks}
                  subtext={`${analytics.completedTasks} hoàn thành`}
                  color="blue"
                />
                <StatsCard
                  icon="✅"
                  label="Tỷ lệ hoàn thành"
                  value={`${analytics.completionRate}%`}
                  subtext={`${analytics.completedTasks}/${analytics.totalTasks} tasks`}
                  color="green"
                />
                <StatsCard
                  icon="🎯"
                  label="Điểm hiệu suất"
                  value={analytics.productivityScore}
                  subtext="Dựa trên nhiều yếu tố"
                  color="purple"
                />
                <StatsCard
                  icon="🔥"
                  label="Streak hiện tại"
                  value={analytics.currentStreak}
                  subtext={`${analytics.currentStreak} ngày liên tiếp`}
                  color="orange"
                />
              </div>

              {/* Secondary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatsCard
                  icon="🎯"
                  label="Goals đang thực hiện"
                  value={analytics.activeGoals}
                  subtext={`${analytics.completedGoals} đã hoàn thành`}
                  color="blue"
                />
                <StatsCard
                  icon="⏱️"
                  label="Thời gian hoàn thành TB"
                  value={analytics.avgCompletionTime >= 0 ? `${analytics.avgCompletionTime} ngày` : 'N/A'}
                  subtext="Trung bình mỗi task"
                  color="purple"
                />
                <StatsCard
                  icon="🚀"
                  label="Đang thực hiện"
                  value={analytics.tasksByStatus.in_progress}
                  subtext={`${analytics.tasksByStatus.todo} chưa bắt đầu`}
                  color="orange"
                />
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Priority Distribution */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">
                    📊 Phân bố theo độ ưu tiên
                  </h3>
                  <div className="space-y-3">
                    {[
                      { label: 'High Priority', value: analytics.tasksByPriority.high, color: 'red' },
                      { label: 'Medium Priority', value: analytics.tasksByPriority.medium, color: 'yellow' },
                      { label: 'Low Priority', value: analytics.tasksByPriority.low, color: 'green' }
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">{item.label}</span>
                            <span className="text-sm font-bold text-gray-900">{item.value}</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                item.color === 'red' ? 'bg-red-500' :
                                item.color === 'yellow' ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}
                              style={{ 
                                width: `${analytics.totalTasks > 0 ? (item.value / analytics.totalTasks) * 100 : 0}%` 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status Distribution */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">
                    📈 Trạng thái công việc
                  </h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Todo', value: analytics.tasksByStatus.todo, color: 'gray' },
                      { label: 'In Progress', value: analytics.tasksByStatus.in_progress, color: 'blue' },
                      { label: 'Blocked', value: analytics.tasksByStatus.blocked, color: 'red' },
                      { label: 'Completed', value: analytics.tasksByStatus.completed, color: 'green' }
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">{item.label}</span>
                            <span className="text-sm font-bold text-gray-900">{item.value}</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                item.color === 'gray' ? 'bg-gray-500' :
                                item.color === 'blue' ? 'bg-blue-500' :
                                item.color === 'red' ? 'bg-red-500' :
                                'bg-green-500'
                              }`}
                              style={{ 
                                width: `${analytics.totalTasks > 0 ? (item.value / analytics.totalTasks) * 100 : 0}%` 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <ErrorMessage message="Không thể tải analytics" />
          )}
        </>
      )}
    </div>
  )
}
