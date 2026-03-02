import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGoals } from '../../hooks/goals/useGoals'
import { useTasks } from '../../hooks/goals/useTasks'
import TaskCard from '../../components/goals/TaskCard'
import TaskForm from '../../components/goals/TaskForm'
import GoalForm from '../../components/goals/GoalForm'
import AssignmentHistory from '../../components/goals/AssignmentHistory'
import Modal from '../../components/common/Modal'
import Loading from '../../components/common/Loading'
import ErrorMessage from '../../components/common/ErrorMessage'
import UserAvatar from '../../components/common/UserAvatar'
import Breadcrumb from '../../components/common/Breadcrumb'


export default function GoalDetails() {
  const { goalId } = useParams()
  const navigate = useNavigate()
  
  const { goals, loading: goalsLoading, updateGoal } = useGoals()
  const [filters, setFilters] = useState({ status: '', priority: '' })
  const { tasks, loading: tasksLoading, createTask, updateTask, deleteTask, toggleTaskStatus } = useTasks(goalId, filters)
  
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [submittingTask, setSubmittingTask] = useState(false)
  const [submittingGoal, setSubmittingGoal] = useState(false)
  const [activeTab, setActiveTab] = useState('tasks')

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

  const handleUpdateGoal = async (goalData) => {
    setSubmittingGoal(true)
    
    const result = await updateGoal(goalId, goalData)
    
    if (result.success) {
      setShowGoalForm(false)
    } else {
      alert('Lỗi: ' + result.error)
    }
    
    setSubmittingGoal(false)
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

  const progress = parseFloat(goal.progress) || 0
  const isCompleted = goal.status === 'completed'

  return (
    <div className="max-w-7xl mx-auto"> {/* ✅ Increased max-width */}
      <Breadcrumb
        items={[
          { label: 'Mục tiêu', href: '/goals/list' },
          { label: goal.name }
        ]}
      />
      {/* Back Button */}
      <button
        onClick={() => navigate('/goals/list')}
        className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2 transition-colors text-sm"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Quay lại
      </button>

      {/* ✅ COLORFUL Header Card with Gradient Background */}
      <div 
        className="card mb-6 p-6 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${goal.color}15 0%, ${goal.color}05 100%)`,
          borderTop: `3px solid ${goal.color}`
        }}
      >
        {/* Decorative gradient overlay */}
        <div 
          className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20"
          style={{ background: goal.color }}
        />
        
        <div className="relative z-10">
          {/* Header Row */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4 flex-1">
              {/* ✅ Icon with colored background */}
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-lg"
                style={{ 
                  background: `linear-gradient(135deg, ${goal.color}20, ${goal.color}40)`,
                  border: `2px solid ${goal.color}30`
                }}
              >
                {goal.icon}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{goal.name}</h1>
                  {isCompleted && (
                    <span 
                      className="px-3 py-1 rounded-full text-sm font-medium shadow-sm"
                      style={{ 
                        backgroundColor: `${goal.color}20`,
                        color: goal.color,
                        border: `1px solid ${goal.color}40`
                      }}
                    >
                      ✓ Hoàn thành
                    </span>
                  )}
                </div>
                {goal.description && (
                  <p className="text-sm text-gray-700 mb-3 font-medium">{goal.description}</p>
                )}
                
                {/* ✅ Colorful Stats Pills */}
                <div className="flex items-center gap-3 text-sm">
                  <span 
                    className="px-3 py-1.5 rounded-lg font-semibold shadow-sm"
                    style={{ 
                      backgroundColor: `${goal.color}15`,
                      color: goal.color
                    }}
                  >
                    📋 {goal.completed_tasks || 0}/{goal.total_tasks || 0} tasks
                  </span>
                  <span 
                    className="px-3 py-1.5 rounded-lg font-semibold shadow-sm"
                    style={{ 
                      backgroundColor: `${goal.color}15`,
                      color: goal.color
                    }}
                  >
                    📊 {progress.toFixed(1)}%
                  </span>
                  {goal.category && (
                    <span className="px-3 py-1.5 rounded-lg text-xs bg-white/60 backdrop-blur-sm text-gray-700 font-medium shadow-sm border border-gray-200">
                      {goal.category}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowGoalForm(true)}
              className="btn btn-outline flex items-center gap-2 flex-shrink-0 text-sm hover:scale-105 transition-transform"
              style={{ 
                borderColor: goal.color,
                color: goal.color
              }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Sửa
            </button>
          </div>

          {/* ✅ Colorful Progress Bar */}
          <div className="pt-4 border-t border-white/40">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-700 font-semibold">Tiến độ</span>
              <span className="font-bold" style={{ color: goal.color }}>{progress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-white/60 backdrop-blur-sm rounded-full h-3 overflow-hidden shadow-inner">
              <div 
                className="h-full rounded-full transition-all duration-500 shadow-lg relative overflow-hidden"
                style={{ 
                  width: `${Math.min(progress, 100)}%`,
                  background: progress >= 100 
                    ? `linear-gradient(90deg, ${goal.color}, ${goal.color}dd)` 
                    : `linear-gradient(90deg, ${goal.color}cc, ${goal.color})`
                }}
              >
                {/* Shimmer effect */}
                <div 
                  className="absolute inset-0 opacity-30"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
                    animation: progress < 100 ? 'shimmer 2s infinite' : 'none'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add shimmer animation to your CSS */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

      {/* Tabs Card */}
      <div className="card">
        {/* Tabs Navigation */}
        <div className="flex justify-center border-b border-gray-200">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`relative px-6 py-3 font-semibold text-sm transition-all duration-200 ${
                activeTab === 'tasks'
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="flex items-center gap-2">
                📋 Tasks ({tasks.length})
              </span>
              {activeTab === 'tasks' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('history')}
              className={`relative px-6 py-3 font-semibold text-sm transition-all duration-200 ${
                activeTab === 'history'
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="flex items-center gap-2">
                📜 Lịch sử
              </span>
              {activeTab === 'history' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              {/* ✅ ENHANCED: Filters in Single Row, Smaller Size */}
              <div className="flex items-center justify-between gap-6">
                {/* Status Filter */}
                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
                    Trạng thái:
                  </label>
                  <div className="inline-flex rounded-lg border border-gray-300 bg-white p-0.5 shadow-sm">
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, status: '' }))}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                        filters.status === ''
                          ? 'bg-gray-900 text-white shadow-sm'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Tất cả
                    </button>
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, status: 'todo' }))}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                        filters.status === 'todo'
                          ? 'bg-gray-900 text-white shadow-sm'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      📝 Cần làm
                    </button>
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, status: 'in_progress' }))}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                        filters.status === 'in_progress'
                          ? 'bg-gray-900 text-white shadow-sm'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      ⏳ Đang làm
                    </button>
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, status: 'completed' }))}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                        filters.status === 'completed'
                          ? 'bg-gray-900 text-white shadow-sm'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      ✅ Hoàn thành
                    </button>
                  </div>
                </div>

                {/* Priority Filter */}
                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
                    Độ ưu tiên:
                  </label>
                  <div className="inline-flex rounded-lg border border-gray-300 bg-white p-0.5 shadow-sm">
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, priority: '' }))}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                        filters.priority === ''
                          ? 'bg-gray-900 text-white shadow-sm'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Tất cả
                    </button>
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, priority: 'low' }))}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                        filters.priority === 'low'
                          ? 'bg-gray-900 text-white shadow-sm'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      🔵 Thấp
                    </button>
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, priority: 'medium' }))}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                        filters.priority === 'medium'
                          ? 'bg-gray-900 text-white shadow-sm'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      🟡 Trung bình
                    </button>
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, priority: 'high' }))}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                        filters.priority === 'high'
                          ? 'bg-gray-900 text-white shadow-sm'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      🟠 Cao
                    </button>
                  </div>
                </div>
              </div>

              {/* Header Row */}
              <div className="flex justify-between items-center py-2 border-y border-gray-200">
                <div className="text-xs font-medium text-gray-700">
                  {tasks.length} task{tasks.length !== 1 ? 's' : ''}
                  {(filters.status || filters.priority) && (
                    <span className="ml-2 text-blue-600">(đã lọc)</span>
                  )}
                </div>
                <button onClick={handleCreateTask} className="btn btn-primary btn-sm text-sm">
                  + Thêm task
                </button>
              </div>

              {/* ✅ ENHANCED: Larger Task Cards */}
              {tasks.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">📝</div>
                  <p className="text-base text-gray-600 mb-4">
                    {filters.status || filters.priority 
                      ? 'Không có task nào phù hợp'
                      : 'Chưa có task nào'
                    }
                  </p>
                  {!filters.status && !filters.priority && (
                    <button onClick={handleCreateTask} className="btn btn-primary btn-sm">
                      Tạo task đầu tiên
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"> {/* ✅ Increased gap */}
                  {tasks.map(task => (
                    <div key={task.id} className="transform transition-transform hover:scale-[1.02]">
                      <TaskCard
                        task={task}
                        onEdit={handleEditTask}
                        onDelete={() => handleDeleteTask(task)}
                        onToggleStatus={() => handleToggleTask(task)}
                        onClick={() => navigate(`/goals/${goalId}/tasks/${task.id}`)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Assignment History Tab */}
          {activeTab === 'history' && (
            <AssignmentHistory 
              resourceType="goal" 
              resourceId={goalId} 
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={showTaskForm}
        onClose={handleCloseTaskForm}
        title={editingTask ? 'Sửa công việc' : 'Tạo công việc mới'}
      >
        <TaskForm
          task={editingTask}
          goalId={goalId}
          onSubmit={handleSubmitTask}
          onCancel={handleCloseTaskForm}
          loading={submittingTask}
        />
      </Modal>

      <Modal
        isOpen={showGoalForm}
        onClose={() => setShowGoalForm(false)}
        title="Sửa mục tiêu"
      >
        <GoalForm
          goal={goal}
          onSubmit={handleUpdateGoal}
          onCancel={() => setShowGoalForm(false)}
          loading={submittingGoal}
        />
      </Modal>
    </div>
  )
}