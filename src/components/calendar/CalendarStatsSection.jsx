import CalendarStatsCard from './CalendarStatsCard'
import { useCalendarStats } from '../../hooks/calendar/useCalendarStats'

export default function CalendarStatsSection({ items, year, month }) {
  const stats = useCalendarStats(items, year, month)

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Total Scheduled */}
      <CalendarStatsCard
        icon="📋"
        label="Đã lên lịch"
        value={stats.totalScheduled}
        color="blue"
        trend={`${stats.daysWithItems} ngày có việc`}
      />

      {/* Completed */}
      <CalendarStatsCard
        icon="✅"
        label="Hoàn thành"
        value={stats.totalCompleted}
        color="green"
        trend={`${stats.completionRate}% tỷ lệ hoàn thành`}
      />

      {/* Current Streak */}
      <CalendarStatsCard
        icon="🔥"
        label="Streak hiện tại"
        value={stats.currentStreak}
        color="orange"
        trend={`Kỷ lục: ${stats.longestStreak} ngày`}
      />

      {/* Completion Rate */}
      <CalendarStatsCard
        icon="📈"
        label="Tỷ lệ hoàn thành"
        value={`${stats.completionRate}%`}
        color="purple"
        trend={`${stats.totalCompleted}/${stats.totalScheduled} tasks`}
      />
    </div>
  )
}