import { useState } from 'react'
import TaskCheckInCard from './TaskCheckInCard'
import { supabase } from '../../lib/supabase'

const VIEW_OPTIONS = [
  { value: 'all', label: 'Tất cả', icon: '👥' },
  { value: 'my', label: 'Của tôi', icon: '👤' },
]

const TAB_OPTIONS = [
  { value: 'today', label: 'Công việc trong ngày', icon: '📝' },
  { value: 'month', label: 'Còn lại trong tháng', icon: '📅' },
]

export default function TodayTasksPanel({ date, items, allMonthItems, onRefresh }) {
  const [view, setView] = useState('all')
  const [activeTab, setActiveTab] = useState('today')
  const [updating, setUpdating] = useState({})

  const handleCheckIn = async (item) => {
    const itemKey = `${item.type}-${item.original_id}`
    
    try {
      setUpdating(prev => ({ ...prev, [itemKey]: true }))

      if (item.type === 'task') {
        const newStatus = item.status === 'completed' ? 'in_progress' : 'completed'
        const { error } = await supabase
          .from('tasks')
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.original_id)
          .select()

        if (error) {
          throw error
        }
        
      } else if (item.type === 'subtask') {
        const newCompleted = !item.is_completed
        const { error } = await supabase
          .from('subtasks')
          .update({ 
            is_completed: newCompleted,
            completed_date: newCompleted ? new Date().toISOString() : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.original_id)
          .select()

        if (error) {
          throw error
        }
      }

      // Call onRefresh in background with defensive checks
      if (onRefresh && typeof onRefresh === 'function') {
        await onRefresh()
      }
      
    } catch (err) {
      console.error('Error checking in:', err)
      alert('Lỗi: ' + err.message)
    } finally {
      // ✅ ALWAYS clear loading state immediately
      console.log('🧹 Clearing loading state for:', itemKey)
      setUpdating(prev => {
        const newState = { ...prev }
        delete newState[itemKey]
        return newState
      })
    }
  }

  // Filter items based on view
  const filteredItems = items

  // Get remaining items in month (all uncompleted tasks in the month)
  const remainingMonthItems = (() => {
    if (!allMonthItems || activeTab !== 'month') return {}
    
    // Group all uncompleted items by date (entire month)
    const grouped = {}
    allMonthItems.forEach(item => {
      if (!item.instance_date) return
      
      // Check if item is NOT completed
      const isCompleted = item.type === 'task' 
        ? item.status === 'completed' 
        : item.is_completed === true
      if (isCompleted) return
      
      if (!grouped[item.instance_date]) {
        grouped[item.instance_date] = []
      }
      grouped[item.instance_date].push(item)
    })
    
    return grouped
  })()

  const sortedRemainingDates = Object.keys(remainingMonthItems).sort()

  const dateStr = date.toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Tab Navigation */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-4">
        {TAB_OPTIONS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Today Tab */}
      {activeTab === 'today' && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                📝 Công việc trong ngày
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {dateStr}
              </p>
            </div>

            {/* View Toggle */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              {VIEW_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => setView(option.value)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    view === option.value
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {option.icon} {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-2">
            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => {
                const itemKey = `${item.type}-${item.original_id}`
                return (
                  <TaskCheckInCard
                    key={`${item.type}-${item.original_id}-${index}`}
                    item={item}
                    onCheckIn={handleCheckIn}
                    isUpdating={updating[itemKey] || false}
                  />
                )
              })
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎉</div>
                <p className="text-gray-600 font-medium">
                  Không có công việc nào trong ngày này
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Hãy tận hưởng ngày nghỉ!
                </p>
              </div>
            )}
          </div>

          {/* Stats */}
          {filteredItems.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Tổng cộng: <strong>{filteredItems.length}</strong> việc
              </span>
              <span className="text-gray-600">
                Hoàn thành: <strong className="text-green-600">
                  {filteredItems.filter(item => 
                    item.type === 'task' 
                      ? item.status === 'completed' 
                      : item.is_completed
                  ).length}
                </strong>
              </span>
            </div>
          )}
        </>
      )}

      {/* Month Tab */}
      {activeTab === 'month' && (
        <>
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              📅 Công việc còn lại trong tháng
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Tất cả công việc chưa hoàn thành trong tháng
            </p>
          </div>

          {sortedRemainingDates.length > 0 ? (
            <div className="space-y-4">
              {sortedRemainingDates.map(dateKey => {
                const dayItems = remainingMonthItems[dateKey]
                const dayDate = new Date(dateKey + 'T00:00:00')
                const dayStr = dayDate.toLocaleDateString('vi-VN', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'numeric'
                })
                const isToday = dateKey === new Date().toISOString().split('T')[0]
                const isPast = dateKey < new Date().toISOString().split('T')[0]

                return (
                  <div key={dateKey}>
                    {/* Day Header */}
                    <div className={`flex items-center gap-2 mb-2 px-2 py-1.5 rounded-lg ${
                      isToday ? 'bg-blue-50 border border-blue-200' : isPast ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
                    }`}>
                      <span className={`text-sm font-bold ${isToday ? 'text-blue-700' : isPast ? 'text-red-700' : 'text-gray-700'}`}>
                        {isToday ? '🔥 Hôm nay' : isPast ? '⚠️ Quá hạn' : '📌'} {dayStr}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        isToday ? 'bg-blue-100 text-blue-700' : isPast ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {dayItems.length} việc
                      </span>
                    </div>

                    {/* Day Items */}
                    <div className="space-y-2 ml-2">
                      {dayItems.map((item, index) => {
                        const itemKey = `${item.type}-${item.original_id}`
                        return (
                          <TaskCheckInCard
                            key={`month-${item.type}-${item.original_id}-${dateKey}-${index}`}
                            item={item}
                            onCheckIn={handleCheckIn}
                            isUpdating={updating[itemKey] || false}
                          />
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✨</div>
              <p className="text-gray-600 font-medium">
                Không còn công việc nào trong tháng này
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Tất cả đã hoàn thành!
              </p>
            </div>
          )}

          {/* Month Summary */}
          {sortedRemainingDates.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Tổng cộng: <strong>{sortedRemainingDates.reduce((sum, d) => sum + remainingMonthItems[d].length, 0)}</strong> việc chưa hoàn thành
              </span>
              <span className="text-gray-600">
                Trải trên: <strong>{sortedRemainingDates.length}</strong> ngày
              </span>
            </div>
          )}
        </>
      )}
    </div>
  )
}