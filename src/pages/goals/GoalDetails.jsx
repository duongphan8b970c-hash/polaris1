import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGoals } from '../../hooks/goals/useGoals'
import { useTasks } from '../../hooks/goals/useTasks'
import TaskCard from '../../components/goals/TaskCard'
import TaskForm from '../../components/goals/TaskForm'
import Modal from '../../components/common/Modal'
import Loading from '../../components/common/Loading'
import ErrorMessage from '../../components/common/ErrorMessage'

const STATUS_FILTERS = [
  { value: 'all', label: 'Tất cả', icon: '📋' },
  { value: 'todo', label: 'Cần làm', icon: '📝' },
  { value: 'in_progress', label: 'Đang làm', icon: '⏳' },
  { value: 'completed', label: 'Hoàn thành', icon: '✅' },
  { value: 'blocked', label: 'Bị chặn', icon: '🚫' },
]

export default function GoalDetails() {
  const { goalId } = useParams()
  const navigate = useNavigate()
  
  const { goals, loading: goalsLoading } = useGoals()
  const [filters, setFilters] = useState({ status: '', priority: '' })
  const { tasks, loading: tasksLoading, createTask, updateTask, deleteTask, toggleTaskStatus } = useTasks(goalId, filters)
  
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [submittingTask, setSubmittingTask] = useState(false)

  const goal = goals.find(g => g.id === goalId)

  const handleCreateTask = () => {
    setEditingTask(null)
    setShowTaskForm(true)
  }

  const handleEditTask = (task) => {
    setEditingTask(task)
    setShowTaskForm(true)
  }

  const handleDeleteTask = async (task) => {
    if (!confirm(`Xóa công việc "${task.title}"?`)) return
    
    const result = await deleteTask(task.id)
    if (!result.success) {
      alert('Lỗi: ' + result.error)
    }
  }

  const handleToggleTask = async (task) => {
    await toggleTaskStatus(task.id, task.status)
  }

  const handleCloseTaskForm = () => {
    setShowTaskForm(false)
    setEditingTask(null)
  }

  const handleSubmitTask = async (formData) => {
    setSubmittingTask(true)
    
    const result = editingTask
      ? await updateTask(editingTask.id, formData)
      : await createTask({ ...formData, goal_id: goalId })
    
    if (result.success) {
      handleCloseTaskForm()
    } else {
      alert('Lỗi: ' + result.error)
    }
    
    setSubmittingTask(false)
  }

  if (goalsLoading || tasksLoading) {
    return <Loading message="Đang tải chi tiết mục tiêu..." />
  }

  if (!goal) {
    return (
      <ErrorMessage 
        message="Không tìm thấy mục tiêu" 
        action={
          <button onClick={() => navigate('/goals')} className="btn btn-primary mt-4">
            ← Quay lại danh sách
          </button>
        }
      />
    )
  }

  return (
    <div>
      {/* Header */}
<div className="mb-6">
  <button
    onClick={() => navigate('/goals')}
    className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2 transition-colors"
  >
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
    Quay lại
  </button>

  <div 
    className="p-8 rounded-2xl shadow-xl relative overflow-hidden"
    style={{ 
      backgroundColor: `${goal.color}10`,
      borderLeft: `6px solid ${goal.color}`
    }}
  >
    <div className="flex items-start justify-between">
      <div className="flex items-start gap-6 flex-1">
        {/* Icon lớn */}
        <div 
          className="w-24 h-24 rounded-2xl flex items-center justify-center text-5xl shadow-lg"
          style={{ backgroundColor: `${goal.color}20` }}
        >
          {goal.icon}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-4xl font-bold text-gray-900">{goal.name}</h1>
            {/* Nút Lịch Checkin đẹp hơn */}
            <button
              onClick={() => navigate(`/goals/${goalId}/checkin`)}
              className="px-5 py-2.5 bg-white hover:bg-gray-50 border-2 border-gray-300 rounded-xl font-semibold transition-all hover:shadow-md flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Lịch Checkin
            </button>
          </div>
          
          {goal.description && (
            <p className="text-gray-600 text-lg mb-4">{goal.description}</p>
          )}
          
          {/* Dates */}
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <span className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {new Date(goal.start_date).toLocaleDateString('vi-VN')}
            </span>
            {goal.target_date && (
              <span className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {new Date(goal.target_date).toLocaleDateString('vi-VN')}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Progress bên phải */}
      <div className="text-right ml-6">
        <p className="text-sm text-gray-600 mb-2 font-medium">Tiến độ</p>
        <p className="text-6xl font-bold mb-2" style={{ color: goal.color }}>
          {parseFloat(goal.progress || 0).toFixed(0)}%
        </p>
        <p className="text-sm text-gray-600 bg-white px-3 py-1.5 rounded-lg inline-block">
          {goal.completed_tasks || 0} / {goal.total_tasks || 0} tasks
        </p>
      </div>
    </div>

    {/* Progress Bar */}
    <div className="mt-6">
      <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner">
        <div 
          className="h-4 rounded-full transition-all duration-500 shadow-md"
          style={{ 
            width: `${Math.min(parseFloat(goal.progress || 0), 100)}%`,
            backgroundColor: goal.color 
          }}
        />
          </div>
        </div>
      </div>
    </div>
      {/* Filters & Actions */}
    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
      {/* Status Filter - làm đẹp hơn */}
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_FILTERS.map(filter => (
          <button
            key={filter.value}
            onClick={() => setFilters(prev => ({ 
              ...prev, 
              status: filter.value === 'all' ? '' : filter.value 
            }))}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              (filter.value === 'all' && !filters.status) || filters.status === filter.value
                ? 'bg-blue-500 text-white shadow-lg scale-105'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
            }`}
          >
            <span className="mr-2 text-base">{filter.icon}</span>
            {filter.label}
          </button>
        ))}
      </div>

      {/* Add Task Button - nổi bật hơn */}
      <button 
        onClick={handleCreateTask} 
        className="btn bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Thêm công việc
      </button>
    </div>

      {/* Tasks Grid */}
      {tasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              onToggleStatus={handleToggleTask}
            />
          ))}
        </div>
      ) : (
        <div className="card text-center py-16">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <p className="text-gray-500 font-medium">Chưa có công việc nào</p>
          <p className="text-gray-400 text-sm mt-1 mb-4">Thêm công việc để bắt đầu mục tiêu</p>
          <button onClick={handleCreateTask} className="btn btn-primary">
            Thêm công việc đầu tiên
          </button>
        </div>
      )}

      {/* Task Form Modal */}
      <Modal
        isOpen={showTaskForm}
        onClose={handleCloseTaskForm}
        title={editingTask ? 'Sửa công việc' : 'Thêm công việc mới'}
      >
        <TaskForm
          task={editingTask}
          goalId={goalId}
          onSubmit={handleSubmitTask}
          onCancel={handleCloseTaskForm}
          loading={submittingTask}
        />
      </Modal>
    </div>
  )
}