import { useState } from 'react'
import { useCalendarItemsForMonth } from '../../hooks/goals/useCalendarItems'
import { getItemsForDate, formatDateKey } from '../../utils/calendar'
import CalendarMonthNav from '../../components/calendar/CalendarMonthNav'
import CalendarStatsSection from '../../components/calendar/CalendarStatsSection'
import CalendarGrid from '../../components/calendar/CalendarGrid'
import TodayTasksPanel from '../../components/calendar/TodayTasksPanel'
import Loading from '../../components/common/Loading'
import ErrorMessage from '../../components/common/ErrorMessage'

export default function GoalsCalendarDashboard() {
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState(today)
  const [viewMode, setViewMode] = useState('team') // 'team' or 'personal'

  const { items, loading, error, refetch } = useCalendarItemsForMonth(
    currentYear,
    currentMonth,
    { includeTeam: viewMode === 'team' }
  )

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
  }

  const todayItems = getItemsForDate(items, selectedDate)

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
            📅 Calendar Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Theo dõi và quản lý công việc theo ngày
          </p>
        </div>

        {/* View Mode Toggle */}
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
      </div>

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

      {/* Calendar Grid */}
      <CalendarGrid
        year={currentYear}
        month={currentMonth}
        items={items}
        selectedDate={selectedDate}
        onDateClick={handleDateClick}
      />

      {/* Today's Tasks Panel */}
      <TodayTasksPanel
        date={selectedDate}
        items={todayItems}
        onRefresh={refetch}
      />
    </div>
  )
}