import { useState, useMemo } from 'react'
import { useCalendarItemsForMonth } from '../../hooks/goals/useCalendarItems'
import { useAnalytics } from '../../hooks/analytics/useAnalytics'
import { getItemsForDate } from '../../utils/calendar'
import CalendarMonthNav from '../../components/calendar/CalendarMonthNav'
import CalendarStatsSection from '../../components/calendar/CalendarStatsSection'
import CalendarGrid from '../../components/calendar/CalendarGrid'
import CalendarFilter from '../../components/calendar/CalendarFilter'
import TodayTasksPanel from '../../components/calendar/TodayTasksPanel'
import StatsCard from '../../components/analytics/StatsCard'
import Loading from '../../components/common/Loading'
import ErrorMessage from '../../components/common/ErrorMessage'

export default function GoalsCalendarDashboard() {
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState(today)
  const [viewMode, setViewMode] = useState('team')
  const [activeTab, setActiveTab] = useState('calendar') 
  const [dateRange, setDateRange] = useState('month') 
  const [calendarFilter, setCalendarFilter] = useState({ type: 'all', goalId: 'all' })

  const { items, loading, error, refetch } = useCalendarItemsForMonth(
    currentYear,
    currentMonth,
    { includeTeam: viewMode === 'team' }
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

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const handleToday = () => {
    const now = new Date()
    setCurrentYear(now.getFullYear())
    setCurrentMonth(now.getMonth())
    setSelectedDate(now)
  }

  const handleDateClick = (date) => {
    setSelectedDate(date)

    console.log('📅 Clicked date:', {
    date: date,
    formatted: formatDateString(date),
    items: getItemsForDate(filteredItems, date)
  })
  }

  const todayItems = getItemsForDate(filteredItems, selectedDate)

  if (loading) {
    return <Loading message="Đang tải calendar..." />
  }

  if (error) {
    return <ErrorMessage message={error} />
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
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

      {/* ✅ NEW: Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
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

      {/* ✅ Calendar Tab Content */}
      {activeTab === 'calendar' && (
        <>
          {/* Stats Cards */}
          <CalendarStatsSection
            items={items}
            year={currentYear}
            month={currentMonth}
          />

          {/* Month Navigation */}
          <CalendarMonthNav
            year={currentYear}
            month={currentMonth}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onToday={handleToday}
          />

          {/* Calendar Filter */}
          <CalendarFilter
            filter={calendarFilter}
            onChange={setCalendarFilter}
            goals={availableGoals}
          />

          {/* Calendar Grid */}
          <CalendarGrid
            year={currentYear}
            month={currentMonth}
            items={filteredItems}
            selectedDate={selectedDate}
            onDateClick={handleDateClick}
          />

          {/* Today's Tasks Panel */}
          <TodayTasksPanel
            date={selectedDate}
            items={todayItems}
            onRefresh={refetch}
          />
        </>
      )}

      {/* ✅ Analytics Tab Content */}
      {activeTab === 'analytics' && (
        <>
          {analyticsLoading ? (
            <Loading message="Đang tải analytics..." />
          ) : analytics ? (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Priority Distribution */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
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
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
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