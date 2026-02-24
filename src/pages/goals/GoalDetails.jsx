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
      {/* Back Button */}
      <button
        onClick={() => navigate('/goals')}
        className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2 transition-colors text-sm"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Quay lại
      </button>

      {/* Combined Header Card */}
      <div className="card mb-6 p-6"> {/* ✅ Consistent padding */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4 flex-1">
            <span className="text-5xl">{goal.icon}</span>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{goal.name}</h1> {/* ✅ Reduced from 3xl */}
                {isCompleted && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ✓ Hoàn thành
                  </span>
                )}
              </div>
              {goal.description && (
                <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
              )}
              
              {/* Goal Stats */}
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-600">
                  📋 {goal.completed_tasks || 0}/{goal.total_tasks || 0} tasks
                </span>
                <span className="text-gray-600">
                  📊 {progress.toFixed(1)}%
                </span>
                {goal.category && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
                    {goal.category}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowGoalForm(true)}
            className="btn btn-outline flex items-center gap-2 flex-shrink-0 text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Sửa
          </button>
        </div>

        {/* Progress Bar */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 font-medium">Tiến độ</span>
            <span className="font-semibold text-gray-900">{progress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden"> {/* ✅ Reduced from h-4 */}
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                progress >= 100 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                progress >= 75 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                progress >= 50 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                'bg-gradient-to-r from-gray-400 to-gray-500'
              }`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      </div>

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
                      🟡 TB
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
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, priority: 'urgent' }))}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                        filters.priority === 'urgent'
                          ? 'bg-gray-900 text-white shadow-sm'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      🔴 KCấp
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