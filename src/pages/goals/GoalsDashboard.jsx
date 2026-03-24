import { useState } from 'react'
import { useGoals } from '../../hooks/goals/useGoals'
import TableGoalList from '../../components/goals/TableGoalList'
import GoalForm from '../../components/goals/GoalForm'
import Modal from '../../components/common/Modal'
import PageHeader from '../../components/layout/PageHeader'
import Loading from '../../components/common/Loading'
import ErrorMessage from '../../components/common/ErrorMessage'

export default function GoalsDashboard() {
  const { goals, loading, error, createGoal, updateGoal, deleteGoal } = useGoals()

  const [showForm, setShowForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')

  // Calculate summary stats
  const stats = {
    total: goals.length,
    active: goals.filter(g => g.status === 'active').length,
    completed: goals.filter(g => g.status === 'completed').length,
    totalProgress: goals.length > 0
      ? goals.reduce((sum, g) => sum + parseFloat(g.progress || 0), 0) / goals.length
      : 0,
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
    if (!confirm(`Xóa mục tiêu "${goal.name}"?\n\nLưu ý: Tất cả tasks bên trong cũng sẽ bị xóa.`)) return
    const result = await deleteGoal(goal.id)
    if (!result.success) alert('Lỗi: ' + result.error)
  }

  const handleComplete = async (goal, endDate) => {
    if (!confirm(`Đánh dấu "${goal?.name || 'mục tiêu này'}" là đã hoàn thành?`)) return
    const result = await updateGoal(goal.id, {
      status: 'completed',
      end_date: endDate || new Date().toISOString().split('T')[0],
      progress: 100,
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

  if (loading) return <Loading message="Đang tải mục tiêu..." />
  if (error) return <ErrorMessage message={error} />

  return (
    <div>
      <PageHeader
        title="Mục Tiêu & Dự Án"
        subtitle="Quản lý và theo dõi tiến độ các mục tiêu của bạn"
        action={
          <button onClick={handleCreate} className="btn btn-primary">
            + Tạo mục tiêu mới
          </button>
        }
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium mb-1">Tổng mục tiêu</p>
              <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-2">mục tiêu</p>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium mb-1">Đang thực hiện</p>
              <p className="text-3xl font-bold text-green-900">{stats.active}</p>
            </div>
            <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-green-600 mt-2">mục tiêu</p>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium mb-1">Hoàn thành</p>
              <p className="text-3xl font-bold text-purple-900">{stats.completed}</p>
            </div>
            <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-purple-600 mt-2">mục tiêu</p>
        </div>

        <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium mb-1">Tiến độ TB</p>
              <p className="text-3xl font-bold text-orange-900">
                {stats.totalProgress.toFixed(1)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-orange-600 mt-2">hoàn thành</p>
        </div>
      </div>

      {/* Toggle Table Goal List */}
      {/* Status Filter */}
      <div className="flex items-center gap-3 mb-4">
        <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
          Trạng thái:
        </label>
        <div className="inline-flex rounded-lg border border-gray-300 bg-white p-0.5 shadow-sm">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-gray-900 text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Tất cả ({stats.total})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 whitespace-nowrap ${
              statusFilter === 'active'
                ? 'bg-gray-900 text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            ⚡ Đang thực hiện ({stats.active})
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 whitespace-nowrap ${
              statusFilter === 'completed'
                ? 'bg-gray-900 text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            ✅ Hoàn thành ({stats.completed})
          </button>
        </div>
      </div>

      <TableGoalList
        goals={goals}
        statusFilter={statusFilter}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onComplete={handleComplete}
      />

      {/* Goal Form Modal */}
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
