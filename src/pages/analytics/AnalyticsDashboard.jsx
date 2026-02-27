import { useState } from 'react'
import { useAnalytics } from '../../hooks/analytics/useAnalytics'
import StatsCard from '../../components/analytics/StatsCard'
import Loading from '../../components/common/Loading'
import ErrorMessage from '../../components/common/ErrorMessage'

export default function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState('month')
  const { analytics, loading, refetch } = useAnalytics(dateRange)

  if (loading) {
    return <Loading message="Đang tải analytics..." />
  }

  if (!analytics) {
    return <ErrorMessage message="Không thể tải dữ liệu analytics" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            📊 Analytics & Insights
          </h1>
          <p className="text-gray-600 mt-1">
            Theo dõi hiệu suất và tiến độ công việc
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          {[
            { value: 'week', label: '7 ngày' },
            { value: 'month', label: '30 ngày' },
            { value: 'quarter', label: '3 tháng' },
            { value: 'year', label: '1 năm' }
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
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Tasks */}
        <StatsCard
          icon="📋"
          label="Tổng số tasks"
          value={analytics.totalTasks}
          subtext={`${analytics.completedTasks} hoàn thành`}
          color="blue"
        />

        {/* Completion Rate */}
        <StatsCard
          icon="✅"
          label="Tỷ lệ hoàn thành"
          value={`${analytics.completionRate}%`}
          subtext={`${analytics.completedTasks}/${analytics.totalTasks} tasks`}
          color="green"
        />

        {/* Productivity Score */}
        <StatsCard
          icon="🎯"
          label="Điểm hiệu suất"
          value={analytics.productivityScore}
          subtext="Dựa trên nhiều yếu tố"
          color="purple"
        />

        {/* Current Streak */}
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
        {/* Active Goals */}
        <StatsCard
          icon="🎯"
          label="Goals đang thực hiện"
          value={analytics.activeGoals}
          subtext={`${analytics.completedGoals} đã hoàn thành`}
          color="blue"
        />

        {/* Average Completion Time */}
        <StatsCard
          icon="⏱️"
          label="Thời gian hoàn thành TB"
          value={`${analytics.avgCompletionTime} ngày`}
          subtext="Trung bình mỗi task"
          color="purple"
        />

        {/* In Progress */}
        <StatsCard
          icon="🚀"
          label="Đang thực hiện"
          value={analytics.tasksByStatus.in_progress}
          subtext={`${analytics.tasksByStatus.todo} chưa bắt đầu`}
          color="orange"
        />
      </div>

      {/* Charts Section - Will add in next step */}
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

      {/* Completion Trend - Placeholder for chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          📈 Xu hướng hoàn thành công việc
        </h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <p className="text-sm">Chart sẽ được thêm ở bước tiếp theo</p>
            <p className="text-xs mt-1">Sử dụng Chart.js hoặc Recharts</p>
          </div>
        </div>
      </div>
    </div>
  )
}