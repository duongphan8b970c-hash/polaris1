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
  const [activeTab, setActiveTab] = useState('tasks') // 'tasks' | 'history'

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
    <div className="max-w-6xl mx-auto">
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

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <span className="text-5xl">{goal.icon}</span>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{goal.name}</h1>
                {isCompleted && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    ✓ Hoàn thành
                  </span>
                )}
              </div>
              {goal.description && (
                <p className="text-gray-600">{goal.description}</p>
              )}
              
              {/* Goal Stats */}
              <div className="flex items-center gap-4 mt-3 text-sm">
                <span className="text-gray-600">
                  📋 {goal.completed_tasks || 0}/{goal.total_tasks || 0} tasks
                </span>
                <span className="text-gray-600">
                  📊 {progress.toFixed(1)}% hoàn thành
                </span>
                {goal.category && (
                  <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                    {goal.category}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowGoalForm(true)}
            className="btn btn-outline flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Sửa mục tiêu
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="card mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Tiến độ tổng thể</span>
          <span className="font-semibold text-gray-900">{progress.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
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

      {/* Tabs & Content Card */}
      <div className="card">
        {/* Tabs Navigation */}
        <div className="flex gap-4 border-b border-gray-200 px-6">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-3 font-medium transition-colors relative ${
              activeTab === 'tasks'
                ? 'text-blue-600 border-b-2 border-blue-600 -mb-px'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📋 Tasks ({tasks.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-3 font-medium transition-colors relative ${
              activeTab === 'history'
                ? 'text-blue-600 border-b-2 border-blue-600 -mb-px'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📜 Lịch sử phân công
          </button>
        </div>

        {/* Tab Content - ADD proper padding */}
        <div className="p-6">
          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div className="space-y-4"> {/* ✅ ADD: space-y-4 for vertical spacing */}
              
              {/* Filters Section with proper spacing */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-4"> {/* ✅ ADD: background & padding */}
                
                {/* Status Filters */}
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-3">Trạng thái:</p>
                  <div className="flex flex-wrap gap-2">
                    {/* Filter buttons... */}
                  </div>
                </div>

                {/* Priority Filters */}
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-3">Độ ưu tiên:</p>
                  <div className="flex flex-wrap gap-2">
                    {/* Filter buttons... */}
                  </div>
                </div>
              </div>

              {/* Header Row */}
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <div className="text-sm font-medium text-gray-700">
                  {tasks.length} task{tasks.length !== 1 ? 's' : ''}
                  {(filters.status || filters.priority) && (
                    <span className="ml-2 text-blue-600">(đã lọc)</span>
                  )}
                </div>
                <button onClick={handleCreateTask} className="btn btn-primary btn-sm">
                  + Thêm task
                </button>
              </div>
              {/* Tasks Grid */}
      <div>
        {tasks.length === 0 ? (
          /* Empty state */
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Task cards */}
          </div>
        )}
      </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={handleEditTask}
                      onDelete={() => handleDeleteTask(task)}
                      onToggleStatus={() => handleToggleTask(task)}
                      onClick={() => navigate(`/goals/${goalId}/tasks/${task.id}`)}
                    />
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

      {/* Task Form Modal */}
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

      {/* Goal Form Modal */}
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