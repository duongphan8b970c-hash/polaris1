import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGoals } from '../hooks/goals/useGoals'
import { useGoalCategories } from '../hooks/goals/useGoalCategories'
import { useProjects } from '../hooks/goals/useProjects'
import CategoryCard from '../components/goals/CategoryCard'
import CategoryForm from '../components/goals/CategoryForm'
import ProjectCard from '../components/goals/ProjectCard'
import ProjectForm from '../components/goals/ProjectForm'
import Modal from '../components/common/Modal'
import Loading from '../components/common/Loading'
import ErrorMessage from '../components/common/ErrorMessage'

export default function GoalDetails() {
  const { goalId } = useParams()
  const navigate = useNavigate()
  
  const { goals, loading: goalsLoading } = useGoals()
  const { categories, loading: categoriesLoading, createCategory, updateCategory, deleteCategory } = useGoalCategories(goalId)
  const { projects, loading: projectsLoading, createProject, updateProject, deleteProject } = useProjects()
  
  const [activeTab, setActiveTab] = useState('categories')
  const [selectedCategory, setSelectedCategory] = useState(null)
  
  // Category modals
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [submittingCategory, setSubmittingCategory] = useState(false)
  
  // Project modals
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [submittingProject, setSubmittingProject] = useState(false)

  const goal = goals.find(g => g.id === goalId)

  // Filter projects by selected category
  const filteredProjects = selectedCategory
    ? projects.filter(p => p.category_id === selectedCategory.id)
    : projects.filter(p => categories.some(c => c.id === p.category_id))

  // Category handlers
  const handleCreateCategory = () => {
    setEditingCategory(null)
    setShowCategoryForm(true)
  }

  const handleEditCategory = (category) => {
    setEditingCategory(category)
    setShowCategoryForm(true)
  }

  const handleDeleteCategory = async (category) => {
    if (!confirm(`Xóa danh mục "${category.name}"?\n\nTất cả projects và tasks bên trong cũng sẽ bị xóa.`)) return
    
    const result = await deleteCategory(category.id)
    if (!result.success) {
      alert('Lỗi: ' + result.error)
    }
  }

  const handleCloseCategoryForm = () => {
    setShowCategoryForm(false)
    setEditingCategory(null)
  }

  const handleSubmitCategory = async (formData) => {
    setSubmittingCategory(true)
    
    const result = editingCategory
      ? await updateCategory(editingCategory.id, formData)
      : await createCategory({ ...formData, goal_id: goalId })
    
    if (result.success) {
      handleCloseCategoryForm()
    } else {
      alert('Lỗi: ' + result.error)
    }
    
    setSubmittingCategory(false)
  }

  // Project handlers
  const handleCreateProject = () => {
    if (!selectedCategory) {
      alert('Vui lòng chọn danh mục trước')
      return
    }
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
      : await createProject({ ...formData, category_id: selectedCategory.id })
    
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

  if (goalsLoading || categoriesLoading || projectsLoading) {
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

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('categories')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'categories'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📁 Danh mục ({categories.length})
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'projects'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📊 Dự án ({filteredProjects.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Danh mục</h2>
            <button onClick={handleCreateCategory} className="btn btn-primary">
              <svg className="w-5 h-5 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Thêm danh mục
            </button>
          </div>

          {categories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(category => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  onEdit={handleEditCategory}
                  onDelete={handleDeleteCategory}
                  onClick={() => {
                    setSelectedCategory(category)
                    setActiveTab('projects')
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <p className="text-gray-500 font-medium">Chưa có danh mục nào</p>
              <p className="text-gray-400 text-sm mt-1">Thêm danh mục để tổ chức các dự án</p>
            </div>
          )}
        </div>
      )}

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-gray-900">Dự án</h2>
              {selectedCategory && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Danh mục:</span>
                  <span 
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-lg font-medium"
                    style={{ 
                      backgroundColor: `${selectedCategory.color}15`,
                      color: selectedCategory.color 
                    }}
                  >
                    <span>{selectedCategory.icon}</span>
                    <span>{selectedCategory.name}</span>
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="hover:bg-black/10 rounded-full p-0.5"
                    >
                      ×
                    </button>
                  </span>
                </div>
              )}
            </div>
            <button 
              onClick={handleCreateProject} 
              className="btn btn-primary"
              disabled={!selectedCategory}
            >
              <svg className="w-5 h-5 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Thêm dự án
            </button>
          </div>

          {!selectedCategory && categories.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800">
                💡 Chọn một danh mục từ tab "Danh mục" hoặc click vào danh mục bên dưới để xem dự án
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium hover:opacity-80 transition-opacity"
                    style={{ 
                      backgroundColor: `${cat.color}15`,
                      color: cat.color 
                    }}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map(project => (
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
              <p className="text-gray-500 font-medium">
                {selectedCategory ? 'Chưa có dự án nào trong danh mục này' : 'Chọn danh mục để xem dự án'}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {selectedCategory && 'Thêm dự án để bắt đầu'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Category Form Modal */}
      <Modal
        isOpen={showCategoryForm}
        onClose={handleCloseCategoryForm}
        title={editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}
      >
        <CategoryForm
          category={editingCategory}
          goalId={goalId}
          onSubmit={handleSubmitCategory}
          onCancel={handleCloseCategoryForm}
          loading={submittingCategory}
        />
      </Modal>

      {/* Project Form Modal */}
      <Modal
        isOpen={showProjectForm}
        onClose={handleCloseProjectForm}
        title={editingProject ? 'Sửa dự án' : 'Thêm dự án mới'}
      >
        <ProjectForm
          project={editingProject}
          categories={categories}
          onSubmit={handleSubmitProject}
          onCancel={handleCloseProjectForm}
          loading={submittingProject}
        />
      </Modal>
    </div>
  )
}