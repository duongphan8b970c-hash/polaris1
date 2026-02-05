import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGoals } from '../hooks/goals/useGoals'
import { useTasks } from '../hooks/goals/useTasks'
import { useSubtasks } from '../hooks/goals/useSubtasks'
import { useCheckins } from '../hooks/goals/useCheckins'
import Modal from '../components/common/Modal'
import Loading from '../components/common/Loading'

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const MONTHS = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
                'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12']

export default function CheckinCalendar() {
  const { goalId } = useParams()
  const navigate = useNavigate()
  
  const { goals, loading: goalsLoading } = useGoals()
  const { tasks } = useTasks(goalId)
  
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  const [selectedSubtask, setSelectedSubtask] = useState(null)
  const [showCheckinModal, setShowCheckinModal] = useState(false)
  const [checkinNotes, setCheckinNotes] = useState('')
  
  const { subtasks } = useSubtasks(selectedTask?.id)
  
  // Get date range for current month
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  
  const dateRange = {
    from: firstDay.toISOString().split('T')[0],
    to: lastDay.toISOString().split('T')[0]
  }
  
  const { checkins, loading: checkinsLoading, createCheckin, toggleCheckin, refetch } = useCheckins(goalId, dateRange)
  
  const goal = goals.find(g => g.id === goalId)

  // Generate calendar days
  const getCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    
    const startingDayOfWeek = firstDayOfMonth.getDay()
    const daysInMonth = lastDayOfMonth.getDate()
    
    const days = []
    
    // Previous month's trailing days
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const calendarDays = getCalendarDays()

  // Get checkins for a specific date
  const getCheckinsForDate = (date) => {
    if (!date) return []
    const dateStr = date.toISOString().split('T')[0]
    return checkins.filter(c => c.date === dateStr)
  }

  // Check if date has completed checkin
  const hasCompletedCheckin = (date) => {
    const dayCheckins = getCheckinsForDate(date)
    return dayCheckins.some(c => c.is_completed)
  }

  // Get checkin count for date
  const getCheckinCount = (date) => {
    return getCheckinsForDate(date).length
  }

  // Handle date click
  const handleDateClick = (date) => {
    if (!date) return
    setSelectedDate(date)
    setShowCheckinModal(true)
  }

  // Handle create checkin
  const handleCreateCheckin = async () => {
    if (!selectedDate) return
    
    const checkinData = {
      goal_id: goalId,
      task_id: selectedTask?.id || null,
      subtask_id: selectedSubtask?.id || null,
      date: selectedDate.toISOString().split('T')[0],
      is_completed: true,
      notes: checkinNotes
    }
    
    const result = await createCheckin(checkinData)
    
    if (result.success) {
      setShowCheckinModal(false)
      setSelectedTask(null)
      setSelectedSubtask(null)
      setCheckinNotes('')
      refetch()
    } else {
      alert('Lỗi: ' + result.error)
    }
  }

  // Handle toggle checkin
  const handleToggleCheckin = async (checkin) => {
    await toggleCheckin(checkin.id, checkin.is_completed)
    refetch()
  }

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Calculate stats
  const stats = {
    totalDays: calendarDays.filter(d => d !== null).length,
    checkedDays: calendarDays.filter(d => d && hasCompletedCheckin(d)).length,
    currentStreak: calculateCurrentStreak(),
    completionRate: 0
  }
  stats.completionRate = stats.totalDays > 0 ? (stats.checkedDays / stats.totalDays) * 100 : 0

  function calculateCurrentStreak() {
    let streak = 0
    const today = new Date()
    const sortedDays = calendarDays
      .filter(d => d && d <= today)
      .sort((a, b) => b - a)
    
    for (let day of sortedDays) {
      if (hasCompletedCheckin(day)) {
        streak++
      } else {
        break
      }
    }
    
    return streak
  }

  if (goalsLoading || checkinsLoading) {
    return <Loading message="Đang tải lịch checkin..." />
  }

  if (!goal) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Không tìm thấy mục tiêu</p>
        <button onClick={() => navigate('/goals')} className="btn btn-primary mt-4">
          ← Quay lại
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(`/goals/${goalId}`)}
          className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại mục tiêu
        </button>

        <div 
          className="p-6 rounded-xl shadow-lg"
          style={{ 
            backgroundColor: `${goal.color}15`,
            borderLeft: `4px solid ${goal.color}`
          }}
        >
          <div className="flex items-center gap-4 mb-4">
            <span className="text-4xl">{goal.icon}</span>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{goal.name}</h1>
              <p className="text-gray-600">Lịch Checkin & Theo Dõi Tiến Độ</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <p className="text-xs text-gray-600 mb-1">Số ngày checkin</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.checkedDays}/{stats.totalDays}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <p className="text-xs text-gray-600 mb-1">Tỷ lệ hoàn thành</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.completionRate.toFixed(0)}%
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <p className="text-xs text-gray-600 mb-1">Chuỗi hiện tại</p>
              <p className="text-2xl font-bold text-orange-600">
                {stats.currentStreak} 🔥
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <p className="text-xs text-gray-600 mb-1">Tổng checkins</p>
              <p className="text-2xl font-bold text-purple-600">
                {checkins.filter(c => c.is_completed).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="card">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h2 className="text-xl font-bold text-gray-900">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <button
            onClick={goToToday}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors text-sm"
          >
            Hôm nay
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {WEEKDAYS.map((day, index) => (
            <div
              key={index}
              className={`text-center text-sm font-semibold py-2 ${
                index === 0 ? 'text-red-600' : 'text-gray-600'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((date, index) => {
            const isToday = date && 
              date.toDateString() === new Date().toDateString()
            
            const hasCheckin = date && hasCompletedCheckin(date)
            const checkinCount = date ? getCheckinCount(date) : 0
            const isPast = date && date < new Date().setHours(0, 0, 0, 0)
            
            return (
              <button
                key={index}
                onClick={() => handleDateClick(date)}
                disabled={!date}
                className={`
                  aspect-square p-2 rounded-lg transition-all relative
                  ${!date ? 'invisible' : ''}
                  ${isToday ? 'ring-2 ring-primary-500' : ''}
                  ${hasCheckin 
                    ? 'bg-green-100 hover:bg-green-200 border-2 border-green-500' 
                    : isPast 
                      ? 'bg-gray-50 hover:bg-gray-100 text-gray-400' 
                      : 'bg-white hover:bg-gray-50 border-2 border-gray-200'
                  }
                `}
              >
                {date && (
                  <>
                    <div className={`text-sm font-semibold ${
                      hasCheckin ? 'text-green-700' : 
                      isPast ? 'text-gray-400' : 'text-gray-900'
                    }`}>
                      {date.getDate()}
                    </div>
                    
                    {hasCheckin && (
                      <div className="absolute top-1 right-1">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    
                    {checkinCount > 1 && (
                      <div className="absolute bottom-1 right-1 text-xs bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {checkinCount}
                      </div>
                    )}
                  </>
                )}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-6 pt-4 border-t text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-100 border-2 border-green-500 rounded"></div>
            <span className="text-gray-600">Đã checkin</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white border-2 border-gray-200 rounded"></div>
            <span className="text-gray-600">Chưa checkin</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 ring-2 ring-primary-500 rounded"></div>
            <span className="text-gray-600">Hôm nay</span>
          </div>
        </div>
      </div>

      {/* Checkin List for Selected Date */}
      {selectedDate && (
        <div className="card mt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Checkin ngày {selectedDate.getDate()}/{selectedDate.getMonth() + 1}/{selectedDate.getFullYear()}
          </h3>
          
          {getCheckinsForDate(selectedDate).length > 0 ? (
            <div className="space-y-3">
              {getCheckinsForDate(selectedDate).map(checkin => (
                <div
                  key={checkin.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <button
                    onClick={() => handleToggleCheckin(checkin)}
                    className="flex-shrink-0 mt-0.5"
                  >
                    {checkin.is_completed ? (
                      <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </button>
                  
                  <div className="flex-1">
                    {checkin.task && (
                      <p className="font-medium text-gray-900">
                        📋 {checkin.task.title}
                      </p>
                    )}
                    {checkin.subtask && (
                      <p className="text-sm text-gray-600">
                        └ {checkin.subtask.title}
                      </p>
                    )}
                    {!checkin.task && !checkin.subtask && (
                      <p className="font-medium text-gray-900">
                        🎯 Checkin chung
                      </p>
                    )}
                    {checkin.notes && (
                      <p className="text-sm text-gray-600 mt-1">{checkin.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Chưa có checkin nào cho ngày này</p>
            </div>
          )}
        </div>
      )}

      {/* Checkin Modal */}
      <Modal
        isOpen={showCheckinModal}
        onClose={() => {
          setShowCheckinModal(false)
          setSelectedTask(null)
          setSelectedSubtask(null)
          setCheckinNotes('')
        }}
        title={`Checkin ngày ${selectedDate?.getDate()}/${selectedDate?.getMonth() + 1}`}
      >
        <div className="space-y-4">
          {/* Task Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Liên kết với công việc (tùy chọn)
            </label>
            <select
              value={selectedTask?.id || ''}
              onChange={(e) => {
                const task = tasks.find(t => t.id === e.target.value)
                setSelectedTask(task || null)
                setSelectedSubtask(null)
              }}
              className="input"
            >
              <option value="">-- Không liên kết --</option>
              {tasks.map(task => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
          </div>

          {/* Subtask Selector */}
          {selectedTask && subtasks.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subtask (tùy chọn)
              </label>
              <select
                value={selectedSubtask?.id || ''}
                onChange={(e) => {
                  const subtask = subtasks.find(s => s.id === e.target.value)
                  setSelectedSubtask(subtask || null)
                }}
                className="input"
              >
                <option value="">-- Không chọn subtask --</option>
                {subtasks.map(subtask => (
                  <option key={subtask.id} value={subtask.id}>
                    {subtask.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ghi chú
            </label>
            <textarea
              value={checkinNotes}
              onChange={(e) => setCheckinNotes(e.target.value)}
              rows="3"
              className="input"
              placeholder="Ghi chú về tiến độ hôm nay..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                setShowCheckinModal(false)
                setSelectedTask(null)
                setSelectedSubtask(null)
                setCheckinNotes('')
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleCreateCheckin}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              ✓ Checkin
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}