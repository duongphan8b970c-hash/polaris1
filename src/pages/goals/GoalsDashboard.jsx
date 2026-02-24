import { useState } from 'react'
import { useGoals } from '../../hooks/goals/useGoals'
import GoalList from '../../components/goals/GoalList'
import GoalForm from '../../components/goals/GoalForm'
import Modal from '../../components/common/Modal'
import PageHeader from '../../components/layout/PageHeader'
import Loading from '../../components/common/Loading'
import ErrorMessage from '../../components/common/ErrorMessage'
import { useNavigate } from 'react-router-dom'
import AssignmentHistory from '../../components/goals/AssignmentHistory'

export default function GoalsDashboard() {
  const navigate = useNavigate()
  const { goals, loading, error, createGoal, updateGoal, deleteGoal, completeGoal } = useGoals()
  
  const [showForm, setShowForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Calculate summary stats
  const stats = {
    total: goals.length,
    active: goals.filter(g => g.status === 'active').length,
    completed: goals.filter(g => g.status === 'completed').length,
    totalProgress: goals.length > 0 
      ? goals.reduce((sum, g) => sum + parseFloat(g.progress || 0), 0) / goals.length 
      : 0
  }

  const handleCreate = () => {
    setEditingGoal(null)
    setShowForm(true)
  }

  const handleEdit = (goal) => {
    setEditingGoal(goal)
    setShowForm(true)
  }

  const handleDelete = async (goal) => {
    if (!confirm(`Xóa mục tiêu "${goal.name}"?\n\nLưu ý: Tất cả categories, projects và tasks bên trong cũng sẽ bị xóa.`)) return
    
    const result = await deleteGoal(goal.id)
    if (!result.success) {
      alert('Lỗi: ' + result.error)
    }
  }

  const handleComplete = async (goal, endDate) => {
  // ✅ FIX: Use goal.name properly
  if (!confirm(`Đánh dấu "${goal?.name || 'goal này'}" là đã hoàn thành?`)) return
  
  // ✅ FIX: Pass end_date to update
  const result = await updateGoal(goal.id, {
    status: 'completed',
    end_date: endDate || new Date().toISOString().split('T')[0],
    progress: 100
  })
  
  if (result.success) {
    alert('🎉 Chúc mừng! Bạn đã hoàn thành mục tiêu!')
  } else {
    alert('Lỗi: ' + result.error)
  }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingGoal(null)
  }

  const handleSubmit = async (formData) => {
    setSubmitting(true)
    
    const result = editingGoal
      ? await updateGoal(editingGoal.id, formData)
      : await createGoal(formData)
    
    if (result.success) {
      handleCloseForm()
    } else {
      alert('Lỗi: ' + result.error)
    }
    
    setSubmitting(false)
  }

  const handleGoalClick = (goal) => {
    navigate(`/goals/${goal.id}`)
  }

  if (loading) {
    return <Loading message="Đang tải mục tiêu..." />
  }

  if (error) {
    return <ErrorMessage message={error} />
  }

  return (
    <div>
      <PageHeader 
        title="Mục Tiêu & Dự Án" 
        subtitle="Quản lý và theo dõi tiến độ các mục tiêu của bạn"
        action={
          <button onClick={handleCreate} className="btn btn-primary">
            <svg className="w-5 h-5 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tạo mục tiêu mới
          </button>
        }
      />

      {/* Summary Stats */}
      {goals.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Goals */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-blue-100 text-sm font-medium">Tổng mục tiêu</p>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <p className="text-3xl font-bold">{stats.total}</p>
            <p className="text-blue-100 text-xs">mục tiêu</p>
          </div>

          {/* Active Goals */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-green-100 text-sm font-medium">Đang thực hiện</p>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-3xl font-bold">{stats.active}</p>
            <p className="text-green-100 text-xs">mục tiêu</p>
          </div>

          {/* Completed Goals */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-purple-100 text-sm font-medium">Hoàn thành</p>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold">{stats.completed}</p>
            <p className="text-purple-100 text-xs">mục tiêu</p>
          </div>

          {/* Average Progress */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-orange-100 text-sm font-medium">Tiến độ TB</p>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <p className="text-3xl font-bold">{stats.totalProgress.toFixed(1)}%</p>
            <p className="text-orange-100 text-xs">hoàn thành</p>
          </div>
        </div>
      )}

      {/* Goals List */}
      <GoalList
        goals={goals}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onComplete={handleComplete}
        onGoalClick={handleGoalClick}
      />
      
      {/* Assignment History Section */}
      <div className="card mt-4">
        <AssignmentHistory 
          resourceType="goal" 
          resourceId={goalId} 
        />
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={handleCloseForm}
        title={editingGoal ? 'Sửa mục tiêu' : 'Tạo mục tiêu mới'}
      >
        <GoalForm
          goal={editingGoal}
          onSubmit={handleSubmit}
          onCancel={handleCloseForm}
          loading={submitting}
        />
      </Modal>
    </div>
  )
}