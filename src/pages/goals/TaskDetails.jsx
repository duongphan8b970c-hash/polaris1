import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTasks } from '../../hooks/goals/useTasks'
import { useSubtasks } from '../../hooks/goals/useSubtasks'
import { useGoals } from '../../hooks/goals/useGoals'
import SubtaskList from '../../components/goals/SubtaskList'
import TaskForm from '../../components/goals/TaskForm'
import Modal from '../../components/common/Modal'
import Loading from '../../components/common/Loading'
import { TASK_STATUS_FILTERS, PRIORITY_OPTIONS } from '../../constants'
import { formatDate } from '../../utils'

export default function TaskDetails() {
  const { goalId, taskId } = useParams()
  const navigate = useNavigate()
  
  const { goals, loading: goalsLoading } = useGoals()
  const { tasks, loading: tasksLoading, updateTask, deleteTask } = useTasks(goalId)
  const {
    subtasks,
    loading: subtasksLoading,
    createSubtask,
    updateSubtask,
    toggleSubtask,
    deleteSubtask,
  } = useSubtasks(taskId)

  const [showEditModal, setShowEditModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const goal = goals.find(g => g.id === goalId)
  const task = tasks.find(t => t.id === taskId)

  const handleUpdateTask = async (formData) => {
    setSubmitting(true)
    const result = await updateTask(taskId, formData)
    
    if (result.success) {
      setShowEditModal(false)
    } else {
      alert('Lỗi: ' + result.error)
    }
    
    setSubmitting(false)
  }

  const handleDeleteTask = async () => {
    if (!confirm(`Xóa công việc "${task.title}"? Tất cả subtasks cũng sẽ bị xóa.`)) return
    
    const result = await deleteTask(taskId)
    if (result.success) {
      navigate(`/goals/${goalId}`)
    } else {
      alert('Lỗi: ' + result.error)
    }
  }

  const handleAddSubtask = async (subtaskData) => {
    const result = await createSubtask(subtaskData)
    if (!result.success) {
      alert('Lỗi: ' + result.error)
    }
  }

  const handleToggleSubtask = async (id, currentStatus) => {
  const result = await toggleSubtask(id, currentStatus)
  if (!result.success) {
    alert('Lỗi: ' + result.error)
    }
  }

  const handleUpdateSubtask = async (id, data) => {
    const result = await updateSubtask(id, data)
    if (!result.success) {
      alert('Lỗi: ' + result.error)
    }
  }

  const handleDeleteSubtask = async (subtask) => {
    if (!confirm(`Xóa subtask "${subtask.title}"?`)) return
    
    const result = await deleteSubtask(subtask.id)
    if (!result.success) {
      alert('Lỗi: ' + result.error)
    }
  }

  if (goalsLoading || tasksLoading || subtasksLoading) {
    return <Loading message="Đang tải chi tiết task..." />
  }

  if (!goal || !task) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Không tìm thấy task</p>
        <button 
          onClick={() => navigate(`/goals/${goalId}`)} 
          className="btn btn-primary mt-4"
        >
          ← Quay lại
        </button>
      </div>
    )
  }

  const statusOption = TASK_STATUS_FILTERS.find(s => s.value === task.status) || TASK_STATUS_FILTERS[1]
  const priorityOption = PRIORITY_OPTIONS.find(p => p.value === task.priority)
  const completedSubtasks = subtasks.filter(s => s.is_completed).length
  const progress = subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm">
        <button 
          onClick={() => navigate('/goals')}
          className="text-gray-600 hover:text-gray-900 transition-colors"
        >
          Mục tiêu
        </button>
        <span className="text-gray-400">/</span>
        <button 
          onClick={() => navigate(`/goals/${goalId}`)}
          className="text-gray-600 hover:text-gray-900 transition-colors"
        >
          {goal.name}
        </button>
        <span className="text-gray-400">/</span>
        <span className="text-gray-900 font-semibold">{task.title}</span>
      </nav>

      {/* Task Header Card */}
      <div className="card mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
              <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                statusOption.value === 'completed' ? 'bg-green-100 text-green-700' :
                statusOption.value === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                statusOption.value === 'blocked' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {statusOption.icon} {statusOption.label}
              </span>
              <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                priorityOption.value === 'urgent' ? 'bg-red-100 text-red-700' :
                priorityOption.value === 'high' ? 'bg-orange-100 text-orange-700' :
                priorityOption.value === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {priorityOption.icon} {priorityOption.label}
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                📅 Bắt đầu: {formatDate(task.start_date)}
              </span>
              {task.deadline && (
                <span className="flex items-center gap-1">
                  ⏰ Deadline: {formatDate(task.deadline)}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={handleDeleteTask}
              className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Progress Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Tiến độ hoàn thành</span>
            <span className="text-lg font-bold text-blue-600">
              {completedSubtasks} / {subtasks.length} subtasks ({progress.toFixed(0)}%)
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-3 shadow-inner">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Subtasks Section */}
<div className="card">
  <div className="flex items-center gap-2 mb-4">
    <span className="text-2xl">📝</span>
    <h2 className="text-2xl font-bold">Subtasks</h2>
  </div>
  
  <p className="text-gray-600 mb-4">Subtasks ({completedSubtasks} / {subtasks.length})</p>
  
  <SubtaskList
    subtasks={subtasks}
    onToggle={handleToggleSubtask}
    onUpdate={handleUpdateSubtask}
    onDelete={handleDeleteSubtask}
  />
  
  {/* Add subtask form inline */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <form onSubmit={(e) => {
          e.preventDefault()
          const title = e.target.subtaskTitle.value
          if (title.trim()) {
            handleAddSubtask({ task_id: taskId, title })
            e.target.reset()
          }
        }} className="flex gap-2">
          <input
            type="text"
            name="subtaskTitle"
            placeholder="Thêm subtask mới..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            Thêm
          </button>
        </form>
      </div>
    </div>

      {/* Edit Task Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Sửa công việc"
      >
        <TaskForm
          task={task}
          goalId={goalId}
          onSubmit={handleUpdateTask}
          onCancel={() => setShowEditModal(false)}
          loading={submitting}
        />
      </Modal>
    </div>
  )
}