import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTasks } from '../hooks/goals/useTasks'
import { useSubtasks } from '../hooks/goals/useSubtasks'
import { useGoals } from '../hooks/goals/useGoals'
import SubtaskList from '../components/goals/SubtaskList'
import TaskForm from '../components/goals/TaskForm'
import Modal from '../components/common/Modal'
import Loading from '../components/common/Loading'

const STATUS_OPTIONS = [
  { value: 'todo', label: 'Cần làm', icon: '📝', color: 'gray' },
  { value: 'in_progress', label: 'Đang làm', icon: '⏳', color: 'blue' },
  { value: 'completed', label: 'Hoàn thành', icon: '✅', color: 'green' },
  { value: 'blocked', label: 'Bị chặn', icon: '🚫', color: 'red' },
]

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Thấp', icon: '🔵', color: 'blue' },
  { value: 'medium', label: 'Trung bình', icon: '🟡', color: 'yellow' },
  { value: 'high', label: 'Cao', icon: '🟠', color: 'orange' },
  { value: 'urgent', label: 'Khẩn cấp', icon: '🔴', color: 'red' },
]

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

  const statusOption = STATUS_OPTIONS.find(s => s.value === task.status)
  const priorityOption = PRIORITY_OPTIONS.find(p => p.value === task.priority)
  const completedSubtasks = subtasks.filter(s => s.is_completed).length
  const progress = subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="mb-6">
        <nav className="flex items-center gap-2 text-sm text-gray-600">
          <button 
            onClick={() => navigate('/goals')}
            className="hover:text-gray-900"
          >
            Mục tiêu
          </button>
          <span>/</span>
          <button 
            onClick={() => navigate(`/goals/${goalId}`)}
            className="hover:text-gray-900"
          >
            {goal.name}
          </button>
          <span>/</span>
          <span className="text-gray-900 font-medium">{task.title}</span>
        </nav>
      </div>

      {/* Task Header */}
      <div className="card mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{task.title}</h1>
            
            {/* Status & Priority */}
            <div className="flex items-center gap-3 mb-3">
              <span className={`inline-flex items-center gap-1 px-3 py-1 bg-${statusOption.color}-100 text-${statusOption.color}-700 rounded-full text-sm font-medium`}>
                {statusOption.icon} {statusOption.label}
              </span>
              <span className={`inline-flex items-center gap-1 px-3 py-1 bg-${priorityOption.color}-100 text-${priorityOption.color}-700 rounded-full text-sm font-medium`}>
                {priorityOption.icon} {priorityOption.label}
              </span>
            </div>

            {/* Dates */}
            {(task.start_date || task.due_date) && (
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                {task.start_date && (
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Bắt đầu: {new Date(task.start_date).toLocaleDateString('vi-VN')}</span>
                  </div>
                )}
                {task.due_date && (
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Deadline: {new Date(task.due_date).toLocaleDateString('vi-VN')}</span>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            {task.description && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.description}</p>
              </div>
            )}

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {task.tags.map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Sửa task"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={handleDeleteTask}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Xóa task"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Progress */}
        {subtasks.length > 0 && (
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Tiến độ hoàn thành</span>
              <span className="text-sm font-bold text-blue-700">
                {completedSubtasks} / {subtasks.length} subtasks ({progress.toFixed(0)}%)
              </span>
            </div>
            <div className="w-full bg-white rounded-full h-3 border border-blue-200">
              <div 
                className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-indigo-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Subtasks Section */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">📝 Subtasks</h2>
        <SubtaskList
          subtasks={subtasks}
          onToggle={handleToggleSubtask}
          onEdit={handleUpdateSubtask}
          onDelete={handleDeleteSubtask}
          onAdd={handleAddSubtask}
          loading={subtasksLoading}
        />
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