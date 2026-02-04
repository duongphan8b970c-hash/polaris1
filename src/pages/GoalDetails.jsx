import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGoals } from '../hooks/goals/useGoals'
import { useProjects } from '../hooks/goals/useProjects'
import ProjectCard from '../components/goals/ProjectCard'
import ProjectForm from '../components/goals/ProjectForm'
import Modal from '../components/common/Modal'
import Loading from '../components/common/Loading'
import ErrorMessage from '../components/common/ErrorMessage'

export default function GoalDetails() {
  const { goalId } = useParams()
  const navigate = useNavigate()
  
  const { goals, loading: goalsLoading } = useGoals()
  const { projects, loading: projectsLoading, createProject, updateProject, deleteProject } = useProjects(goalId)
  
  // Project modals
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [submittingProject, setSubmittingProject] = useState(false)

  const goal = goals.find(g => g.id === goalId)

  // Project handlers
  const handleCreateProject = () => {
    setEditingProject(null)
    setShowProjectForm(true)
  }

  const handleEditProject = (project) => {
    setEditingProject(project)
    setShowProjectForm(true)
  }

  const handleDeleteProject = async (project) => {
    if (!confirm(`Xóa dự án "${project.name}"?\n\nTất cả tasks bên trong cũng sẽ bị xóa.`)) return
    
    const result = await deleteProject(project.id)
    if (!result.success) {
      alert('Lỗi: ' + result.error)
    }
  }

  const handleCloseProjectForm = () => {
    setShowProjectForm(false)
    setEditingProject(null)
  }

  const handleSubmitProject = async (formData) => {
    setSubmittingProject(true)
    
    const result = editingProject
      ? await updateProject(editingProject.id, formData)
      : await createProject({ ...formData, goal_id: goalId })
    
    if (result.success) {
      handleCloseProjectForm()
    } else {
      alert('Lỗi: ' + result.error)
    }
    
    setSubmittingProject(false)
  }

  const handleProjectClick = (project) => {
    navigate(`/goals/projects/${project.id}`)
  }

  if (goalsLoading || projectsLoading) {
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
          className="p-6 rounded-xl shadow-lg"
          style={{ 
            backgroundColor: `${goal.color}15`,
            borderLeft: `4px solid ${goal.color}`
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <span className="text-5xl">{goal.icon}</span>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{goal.name}</h1>
                {goal.description && (
                  <p className="text-gray-600">{goal.description}</p>
                )}
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {new Date(goal.start_date).toLocaleDateString('vi-VN')}
                  </span>
                  {goal.target_date && (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {new Date(goal.target_date).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    📊 {projects.length} dự án
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">Tiến độ</p>
              <p className="text-3xl font-bold" style={{ color: goal.color }}>
                {parseFloat(goal.progress || 0).toFixed(0)}%
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {goal.completed_tasks || 0} / {goal.total_tasks || 0} tasks
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="h-3 rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.min(parseFloat(goal.progress || 0), 100)}%`,
                  backgroundColor: goal.color 
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Projects Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Dự án</h2>
          <button onClick={handleCreateProject} className="btn btn-primary">
            <svg className="w-5 h-5 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Thêm dự án
          </button>
        </div>

        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={handleEditProject}
                onDelete={handleDeleteProject}
                onClick={() => handleProjectClick(project)}
              />
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            <p className="text-gray-500 font-medium">Chưa có dự án nào</p>
            <p className="text-gray-400 text-sm mt-1 mb-4">Thêm dự án để bắt đầu</p>
            <button onClick={handleCreateProject} className="btn btn-primary">
              Thêm dự án đầu tiên
            </button>
          </div>
        )}
      </div>

      {/* Project Form Modal */}
      <Modal
        isOpen={showProjectForm}
        onClose={handleCloseProjectForm}
        title={editingProject ? 'Sửa dự án' : 'Thêm dự án mới'}
      >
        <ProjectForm
          project={editingProject}
          goalId={goalId}
          onSubmit={handleSubmitProject}
          onCancel={handleCloseProjectForm}
          loading={submittingProject}
        />
      </Modal>
    </div>
  )
}