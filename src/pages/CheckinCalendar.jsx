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
  
  // ✅ NEW: Modal states
  const [showCheckinModal, setShowCheckinModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedCheckin, setSelectedCheckin] = useState(null)
  
  const [checkinNotes, setCheckinNotes] = useState('')
  
  const { subtasks } = useSubtasks(selectedTask?.id)
  
  // Get date range for current month
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  
  const dateRange = {
    from: firstDay.toISOString().split('T')[0],
    to: lastDay.toISOString().split('T')[0]
  }
  
  const { 
    checkins, 
    loading: checkinsLoading, 
    createCheckin, 
    deleteCheckin,  // ✅ NEW
    refetch 
  } = useCheckins(goalId, dateRange)
  
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

 const calculateProgress = () => {
  const daysInMonth = lastDay.getDate()
  let targetDays = daysInMonth
  
  console.log('🔍 Goal settings:', {
    checkin_target_days: goal?.checkin_target_days,
    checkin_frequency: goal?.checkin_frequency,
    checkin_days_per_week: goal?.checkin_days_per_week,
    is_checkin_enabled: goal?.is_checkin_enabled
  })
  
  // ✅ FIX: Check custom first (highest priority)
  if (goal?.checkin_frequency === 'custom' && goal?.checkin_target_days) {
    targetDays = goal.checkin_target_days
    console.log('✅ Using CUSTOM target:', targetDays)
  } else if (goal?.checkin_frequency) {
    switch (goal.checkin_frequency) {
      case 'daily':
        targetDays = daysInMonth
        console.log('✅ Using DAILY target:', targetDays)
        break

      case 'weekdays':
        let weekdayCount = 0
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()
        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(year, month, day)
          const dayOfWeek = date.getDay()
          if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            weekdayCount++
          }
        }
        targetDays = weekdayCount
        console.log('✅ Using WEEKDAYS target:', targetDays)
        break

      case 'weekly':
        const daysPerWeek = goal.checkin_days_per_week || 7
        const weeksInMonth = daysInMonth / 7
        targetDays = Math.round(daysPerWeek * weeksInMonth)
        console.log('✅ Using WEEKLY target:', targetDays, `(${daysPerWeek} days/week)`)
        break

      default:
        targetDays = daysInMonth
        console.log('⚠️ Using DEFAULT target:', targetDays)
    }
  } else {
    console.log('⚠️ No frequency set, using days in month:', targetDays)
  }

  const completedDays = checkins.filter(c => c.is_completed).length
  const progress = targetDays > 0 ? (completedDays / targetDays) * 100 : 0
  const remaining = Math.max(0, targetDays - completedDays)

  console.log('📊 Progress stats:', {
    targetDays,
    completedDays,
    progress: progress.toFixed(1) + '%',
    remaining
  })

  return {
    targetDays,
    completedDays,
    progress: Math.min(progress, 100).toFixed(1),
    remaining
  }
}

  const progressStats = calculateProgress()

  const handleDateClick = (date) => {
    if (!date) return
    
    const dayCheckins = getCheckinsForDate(date)
    const existingCheckin = dayCheckins.find(c => c.is_completed)
    
    if (existingCheckin) {
      setSelectedCheckin(existingCheckin)
      setSelectedDate(date)
      setShowDeleteModal(true)
    } else {
      setSelectedDate(date)
      setShowCheckinModal(true)
    }
  }

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

  const handleDeleteCheckin = async () => {
    if (!selectedCheckin) return
    
    const result = await deleteCheckin(selectedCheckin.id)
    
    if (result.success) {
      setShowDeleteModal(false)
      setSelectedCheckin(null)
      setSelectedDate(null)
      refetch()
    } else {
      alert('Lỗi: ' + result.error)
    }
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
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
          <div className="flex items-center gap-4">
            <span className="text-4xl">{goal.icon}</span>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{goal.name}</h1>
              <p className="text-gray-600">Lịch Checkin & Theo Dõi Tiến Độ</p>
              
              {/* ✅ NEW: Checkin frequency info */}
              {goal.is_checkin_enabled && goal.checkin_frequency && (
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-full text-sm border border-gray-200">
                  <span className="text-gray-600">📅</span>
                  <span className="text-gray-700 font-medium">
                    {goal.checkin_frequency === 'daily' && 'Checkin mỗi ngày'}
                    {goal.checkin_frequency === 'weekdays' && 'Checkin T2-T6'}
                    {goal.checkin_frequency === 'weekly' && `${goal.checkin_days_per_week} ngày/tuần`}
                    {goal.checkin_frequency === 'custom' && `${goal.checkin_target_days} ngày/tháng`}
                  </span>
                </div>
              )}
            </div>
            
            {/* ✅ ENHANCED: Progress Stats */}
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">
                Tiến độ tháng {currentDate.getMonth() + 1}/{currentDate.getFullYear()}
              </p>
              <p className="text-3xl font-bold" style={{ color: goal.color }}>
                {progressStats.progress}%
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {progressStats.completedDays} / {progressStats.targetDays} ngày
              </p>
              {progressStats.remaining > 0 && (
                <p className="text-xs font-medium mt-1" style={{ color: goal.color }}>
                  Còn {progressStats.remaining} ngày
                </p>
              )}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="h-3 rounded-full transition-all duration-500"
                style={{ 
                  width: `${progressStats.progress}%`,
                  backgroundColor: goal.color 
                }}
              />
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
            const isPast = date && date < new Date().setHours(0, 0, 0, 0)
            
            return (
              <button
                key={index}
                onClick={() => handleDateClick(date)}
                disabled={!date}
                className={`
                  aspect-square p-2 rounded-lg transition-all relative group
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
                      <>
                        {/* ✅ Checkmark */}
                        <div className="absolute top-1 right-1">
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        
                        {/* ✅ Hover hint */}
                        <div className="absolute inset-0 bg-red-500 bg-opacity-0 group-hover:bg-opacity-10 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-xs text-red-600 font-semibold">Hủy</span>
                        </div>
                      </>
                    )}
                  </>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ✅ CREATE Checkin Modal */}
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

      {/* ✅ DELETE Checkin Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setSelectedCheckin(null)
          setSelectedDate(null)
        }}
        title="Hủy checkin"
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex gap-3">
              <svg className="w-6 h-6 text-yellow-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="font-semibold text-yellow-900 mb-1">
                  Xác nhận hủy checkin
                </h3>
                <p className="text-sm text-yellow-700">
                  Bạn có chắc muốn hủy checkin ngày {selectedDate?.getDate()}/{selectedDate?.getMonth() + 1}?
                  Hành động này không thể hoàn tác.
                </p>
                {selectedCheckin?.notes && (
                  <div className="mt-3 p-2 bg-white rounded border border-yellow-300">
                    <p className="text-xs text-gray-600 mb-1">Ghi chú:</p>
                    <p className="text-sm text-gray-900">{selectedCheckin.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setShowDeleteModal(false)
                setSelectedCheckin(null)
                setSelectedDate(null)
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Giữ lại
            </button>
            <button
              onClick={handleDeleteCheckin}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              Hủy checkin
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}