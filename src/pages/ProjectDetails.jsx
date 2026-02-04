import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProjects } from '../hooks/goals/useProjects'
import { useTasks } from '../hooks/goals/useTasks'
import { useSubtasks } from '../hooks/goals/useSubtasks'
import TaskCard from '../components/goals/TaskCard'
import TaskForm from '../components/goals/TaskForm'
import SubtaskList from '../components/goals/SubtaskList'
import Modal from '../components/common/Modal'
import Loading from '../components/common/Loading'
import ErrorMessage from '../components/common/ErrorMessage'

const STATUS_FILTERS = [
  { value: 'all', label: 'Tất cả', icon: '📋' },
  { value: 'todo', label: 'Cần làm', icon: '📝' },
  { value: 'in_progress', label: 'Đang làm', icon: '⏳' },
  { value: 'completed', label: 'Hoàn thành', icon: '✅' },
  { value: 'blocked', label: 'Bị chặn', icon: '🚫' },
]

export default function ProjectDetails() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  
  const { projects, loading: projectsLoading } = useProjects()
  
  const [filters, setFilters] = useState({ status: '', priority: '' })
  const { tasks, loading: tasksLoading, createTask, updateTask, deleteTask, toggleTaskStatus } = useTasks(projectId, filters)
  
  const [selectedTask, setSelectedTask] = useState(null)
  const { subtasks, loading: subtasksLoading, createSubtask, updateSubtask, toggleSubtask, deleteSubtask } = useSubtasks(selectedTask?.id)
  
  // Task modals
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [submittingTask, setSubmittingTask] = useState(false)
  
  // Subtask modal
  const [showSubtaskModal, setShowSubtaskModal] = useState(false)

  const project = projects.find(p => p.id === projectId)

  // Task handlers
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
      : await createTask({ ...formData, project_id: projectId })
    
    if (result.success) {
      handleCloseTaskForm()
    } else {
      alert('Lỗi: ' + result.error)
    }
    
    setSubmittingTask(false)
  }

  const handleTaskClick = (task) => {
    setSelectedTask(task)
    setShowSubtaskModal(true)
  }

  // Subtask handlers
  const handleAddSubtask = async (subtaskData) => {
    const result = await createSubtask(subtaskData)
    if (!result.success) {
      alert('Lỗi: ' + result.error)
    }
  }

  const handleEditSubtask = async (id, subtaskData) => {
    const result = await updateSubtask(id, subtaskData)
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

  const handleDeleteSubtask = async (id) => {
    if (!confirm('Xóa subtask này?')) return
    
    const result = await deleteSubtask(id)
    if (!result.success) {
      alert('Lỗi: ' + result.error)
    }
  }

  const handleCloseSubtaskModal = () => {
    setShowSubtaskModal(false)
    setSelectedTask(null)
  }

  if (projectsLoading || tasksLoading) {
    return <Loading message="Đang tải chi tiết dự án..." />
  }

  if (!project) {
    return (
      <ErrorMessage 
        message="Không tìm thấy dự án" 
        action={
          <button onClick={() => navigate('/goals')} className="btn btn-primary mt-4">
            ← Quay lại
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
          onClick={() => navigate(`/goals/${project.category?.goal_id}`)}
          className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại
        </button>

        <div className="card">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                  project.status === 'completed' ? 'bg-green-100 text-green-700' :
                  project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {project.status === 'planning' && '📋 Lên kế hoạch'}
                  {project.status === 'in_progress' && '🚀 Đang thực hiện'}
                  {project.status === 'completed' && '✅ Hoàn thành'}
                  {project.status === 'on_hold' && '⏸️ Tạm dừng'}
                  {project.status === 'cancelled' && '❌ Hủy bỏ'}
                </span>
              </div>
              {project.description && (
                <p className="text-gray-600 mb-3">{project.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                {project.category && (
                  <span className="flex items-center gap-1">
                    <span>{project.category.icon}</span>
                    <span>{project.category.name}</span>
                  </span>
                )}
                {project.due_date && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Hạn: {new Date(project.due_date).toLocaleDateString('vi-VN')}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">Tiến độ</p>
              <p className="text-3xl font-bold text-blue-600">
                {parseFloat(project.progress || 0).toFixed(0)}%
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {project.completed_tasks || 0} / {project.total_tasks || 0} tasks
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="h-3 rounded-full transition-all duration-500 bg-blue-500"
                style={{ width: `${Math.min(parseFloat(project.progress || 0), 100)}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Tổng tasks</p>
              <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-blue-600 mb-1">Đang làm</p>
              <p className="text-2xl font-bold text-blue-600">
                {tasks.filter(t => t.status === 'in_progress').length}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-xs text-green-600 mb-1">Hoàn thành</p>
              <p className="text-2xl font-bold text-green-600">
                {tasks.filter(t => t.status === 'completed').length}
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-xs text-red-600 mb-1">Quá hạn</p>
              <p className="text-2xl font-bold text-red-600">
                {tasks.filter(t => t.is_overdue).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
        {/* Status Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_FILTERS.map(filter => (
            <button
              key={filter.value}
              onClick={() => setFilters(prev => ({ 
                ...prev, 
                status: filter.value === 'all' ? '' : filter.value 
              }))}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                (filter.value === 'all' && !filters.status) || filters.status === filter.value
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="mr-1">{filter.icon}</span>
              {filter.label}
            </button>
          ))}
        </div>

        {/* Add Task Button */}
        <button onClick={handleCreateTask} className="btn btn-primary">
          <svg className="w-5 h-5 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm công việc
        </button>
      </div>

      {/* Tasks List */}
      {tasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              onToggleStatus={handleToggleTask}
              onClick={() => handleTaskClick(task)}
            />
          ))}
        </div>
      ) : (
        <div className="card text-center py-16">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <p className="text-gray-500 font-medium">Chưa có công việc nào</p>
          <p className="text-gray-400 text-sm mt-1 mb-4">Thêm công việc để bắt đầu dự án</p>
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
          projects={[project]}
          onSubmit={handleSubmitTask}
          onCancel={handleCloseTaskForm}
          loading={submittingTask}
        />
      </Modal>

      {/* Subtask Modal */}
      <Modal
        isOpen={showSubtaskModal}
        onClose={handleCloseSubtaskModal}
        title={selectedTask ? `Subtasks: ${selectedTask.title}` : 'Subtasks'}
        size="lg"
      >
        {selectedTask && (
          <div>
            {/* Task Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-1">{selectedTask.title}</h3>
                  {selectedTask.description && (
                    <p className="text-sm text-gray-600">{selectedTask.description}</p>
                  )}
                </div>
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                  selectedTask.status === 'completed' ? 'bg-green-100 text-green-700' :
                  selectedTask.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {selectedTask.status === 'todo' && '📝 Cần làm'}
                  {selectedTask.status === 'in_progress' && '⏳ Đang làm'}
                  {selectedTask.status === 'completed' && '✅ Hoàn thành'}
                  {selectedTask.status === 'blocked' && '🚫 Bị chặn'}
                </span>
              </div>

              {/* Progress */}
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">Tiến độ subtasks</span>
                  <span className="font-semibold text-gray-900">
                    {parseFloat(selectedTask.progress || 0).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all bg-blue-500"
                    style={{ width: `${Math.min(parseFloat(selectedTask.progress || 0), 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Subtasks List */}
            {subtasksLoading ? (
              <Loading message="Đang tải subtasks..." />
            ) : (
              <SubtaskList
                subtasks={subtasks}
                onToggle={handleToggleSubtask}
                onEdit={handleEditSubtask}
                onDelete={handleDeleteSubtask}
                onAdd={handleAddSubtask}
                loading={subtasksLoading}
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}