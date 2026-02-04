import { useState } from 'react'
import { usePaybackGoals } from '../hooks/usePaybackGoals'
import PaybackGoalList from '../components/payback/PaybackGoalList'
import PaybackGoalForm from '../components/payback/PaybackGoalForm'
import Modal from '../components/common/Modal'
import PageHeader from '../components/layout/PageHeader'
import Loading from '../components/common/Loading'
import ErrorMessage from '../components/common/ErrorMessage'

export default function PaybackTracking() {
  const { goals, loading, error, createGoal, updateGoal, completeGoal, deleteGoal, refetch } = usePaybackGoals()
  
  const [showForm, setShowForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Calculate summary stats
  const stats = {
    total: goals.length,
    active: goals.filter(g => g.status === 'active').length,
    completed: goals.filter(g => g.status === 'completed').length,
    totalDebt: goals.filter(g => g.status === 'active').reduce((sum, g) => sum + g.target_amount, 0),
    totalPaid: goals.filter(g => g.status === 'active').reduce((sum, g) => sum + g.current_paid, 0),
    totalRemaining: goals.filter(g => g.status === 'active').reduce((sum, g) => sum + g.remaining, 0)
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
    if (!confirm(`Xóa mục tiêu "${goal.name}"?\nLưu ý: Các giao dịch payback sẽ không bị xóa.`)) return
    
    const result = await deleteGoal(goal.id)
    if (!result.success) {
      alert('Lỗi: ' + result.error)
    }
  }

  const handleComplete = async (goal) => {
    if (!confirm(`Đánh dấu "${goal.name}" là đã hoàn thành?`)) return
    
    const result = await completeGoal(goal.id)
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

  if (loading) {
    return <Loading message="Đang tải mục tiêu..." />
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={refetch} />
  }

  return (
    <div>
      <PageHeader 
        title="Theo Dõi Payback" 
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
      {stats.active > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Active */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-blue-100 text-sm font-medium">Đang theo dõi</p>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-3xl font-bold">{stats.active}</p>
            <p className="text-blue-100 text-xs">mục tiêu</p>
          </div>

          {/* Total Debt */}
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-red-100 text-sm font-medium">Tổng nợ</p>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold">{stats.totalDebt.toLocaleString('vi-VN')}</p>
            <p className="text-red-100 text-xs">VND</p>
          </div>

          {/* Total Paid */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-green-100 text-sm font-medium">Đã trả</p>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold">{stats.totalPaid.toLocaleString('vi-VN')}</p>
            <p className="text-green-100 text-xs">VND</p>
          </div>

          {/* Total Remaining */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-orange-100 text-sm font-medium">Còn lại</p>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold">{stats.totalRemaining.toLocaleString('vi-VN')}</p>
            <p className="text-orange-100 text-xs">VND</p>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>

      {/* Goals List */}
      <PaybackGoalList
        goals={goals}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onComplete={handleComplete}
      />

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={handleCloseForm}
        title={editingGoal ? 'Sửa mục tiêu' : 'Tạo mục tiêu mới'}
      >
        <PaybackGoalForm
          goal={editingGoal}
          onSubmit={handleSubmit}
          onCancel={handleCloseForm}
          loading={submitting}
        />
      </Modal>
    </div>
  )
}