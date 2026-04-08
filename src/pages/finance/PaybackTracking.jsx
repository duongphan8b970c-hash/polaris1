import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePaybackGoals } from '../../hooks/finance/usePaybackGoals'
import { usePaybackPriorities } from '../../hooks/finance/usePaybackPriorities'
import PaybackGoalList from '../../components/payback/PaybackGoalList'
import PaybackGoalForm from '../../components/payback/PaybackGoalForm'
import PaybackCalendarModal from '../../components/payback/PaybackCalendarModal'
import Modal from '../../components/common/Modal'
import Loading from '../../components/common/Loading'
import ErrorMessage from '../../components/common/ErrorMessage'
import { formatNumber } from '../../utils'

export default function PaybackTracking({ goalType = 'payback' }) {
  const navigate = useNavigate()
  const { goals, loading, error, createGoal, updateGoal, completeGoal, deleteGoal, refetch } = usePaybackGoals(goalType)
  const { priorities } = usePaybackPriorities()
  
  const [showForm, setShowForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [selectedPriority, setSelectedPriority] = useState('all')
  const [showCalendar, setShowCalendar] = useState(false)

  // ✅ Separate active and completed
  const activeGoals = goals.filter(g => g.status === 'active')
  const completedGoals = goals.filter(g => g.status === 'completed')

  // Debug
  console.log('🔍 Goals breakdown:', {
    total: goals.length,
    active: activeGoals.length,
    completed: completedGoals.length,
    activeNames: activeGoals.map(g => g.name),
    completedNames: completedGoals.map(g => g.name)
  })

  // Calculate summary stats (chỉ cho active)
  const stats = {
    total: goals.length,
    active: activeGoals.length,
    completed: completedGoals.length,
    totalDebt: activeGoals.reduce((sum, g) => sum + g.target_amount, 0),
    totalPaid: activeGoals.reduce((sum, g) => sum + g.current_paid, 0),
    totalRemaining: activeGoals.reduce((sum, g) => sum + g.remaining, 0)
  }

  // ✅ Filter active goals by priority
  const filteredActiveGoals = selectedPriority === 'all'
    ? activeGoals
    : activeGoals.filter(g => {
        const goalPriority = priorities.find(p => p.id === g.priority_id)
        return goalPriority?.sort_order === selectedPriority
      })

  // ✅ Group active goals by priority
  const groupedActiveGoals = activeGoals.reduce((acc, goal) => {
    const priority = priorities.find(p => p.id === goal.priority_id)
    const sortOrder = priority?.sort_order || 999
    
    if (!acc[sortOrder]) {
      acc[sortOrder] = {
        priority: priority || { name: 'Chưa phân loại', icon: '❓', color: '#6B7280', sort_order: 999 },
        goals: []
      }
    }
    acc[sortOrder].goals.push(goal)
    return acc
  }, {})

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
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setShowCalendar(true)}
          className="btn btn-secondary bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
        >
          <svg className="w-5 h-5 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Watchout 📅
        </button>

        <button 
          onClick={() => navigate('/a-better-day/priorities')}
          className="btn btn-secondary"
        >
          <svg className="w-5 h-5 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Quản lý Priorities
        </button>

        <button onClick={handleCreate} className="btn btn-primary">
          <svg className="w-5 h-5 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tạo mục tiêu mới
        </button>
      </div>

      {/* Summary Stats */}
      {stats.active > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-red-100 text-sm font-medium">Tổng tiền</p>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold">{formatNumber(stats.totalDebt)}</p>
            <p className="text-red-100 text-xs">VND</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-green-100 text-sm font-medium">Đã trả</p>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold">{formatNumber(stats.totalPaid)}</p>
            <p className="text-green-100 text-xs">VND</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-orange-100 text-sm font-medium">Còn lại</p>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold">{formatNumber(stats.totalRemaining)}</p>
            <p className="text-orange-100 text-xs">VND</p>
          </div>
        </div>
      )}

      {/* Priority Filter Buttons */}
      {activeGoals.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedPriority('all')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              selectedPriority === 'all'
                ? 'bg-gray-100 text-gray-700 ring-2 ring-offset-2 ring-gray-500 shadow-md'
                : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            💼 Tất cả
            <span className="ml-1.5 text-xs opacity-70">({activeGoals.length})</span>
          </button>

          {priorities
            .sort((a, b) => a.sort_order - b.sort_order)
            .map(priority => {
              const count = activeGoals.filter(g => g.priority_id === priority.id).length
              const isSelected = selectedPriority === priority.sort_order

              return (
                <button
                  key={priority.id}
                  onClick={() => setSelectedPriority(priority.sort_order)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    isSelected
                      ? 'ring-2 ring-offset-2 shadow-md'
                      : 'border hover:shadow'
                  }`}
                  style={{
                    backgroundColor: isSelected ? `${priority.color}40` : `${priority.color}10`,
                    color: priority.color,
                    borderColor: isSelected ? priority.color : `${priority.color}40`
                  }}
                >
                  {priority.icon} {priority.name}
                  <span className="ml-1.5 text-xs opacity-70">({count})</span>
                </button>
              )
            })}
        </div>
      )}

      {/* ✅ ACTIVE GOALS SECTION */}
      {activeGoals.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Đang trả ({activeGoals.length})
          </h2>

          {selectedPriority === 'all' ? (
            /* Grouped by priority */
            Object.entries(groupedActiveGoals)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([sortOrder, { priority, goals: priorityGoals }]) => (
                <div key={sortOrder} className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div 
                      className="px-3 py-1.5 rounded-lg font-medium text-sm"
                      style={{
                        backgroundColor: `${priority.color}20`,
                        color: priority.color,
                        border: `2px solid ${priority.color}40`
                      }}
                    >
                      <span className="mr-1.5">{priority.icon}</span>
                      {priority.name}
                      <span className="ml-1.5 opacity-70">({priorityGoals.length})</span>
                    </div>
                    <div className="flex-1 h-px bg-gray-200"></div>
                  </div>
                  <PaybackGoalList
                    goals={priorityGoals}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onComplete={handleComplete}
                  />
                </div>
              ))
          ) : (
            /* Filtered flat list */
            filteredActiveGoals.length > 0 ? (
              <PaybackGoalList
                goals={filteredActiveGoals}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onComplete={handleComplete}
              />
            ) : (
              <div className="card text-center py-12">
                <div className="text-4xl mb-4">
                  {priorities.find(p => p.sort_order === selectedPriority)?.icon || '📋'}
                </div>
                <p className="text-gray-500 font-medium">
                  Chưa có mục tiêu nào với priority này
                </p>
                <button 
                  onClick={handleCreate}
                  className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  + Tạo mục tiêu mới
                </button>
              </div>
            )
          )}
        </div>
      )}

      {/* ✅ COMPLETED GOALS SECTION */}
      {completedGoals.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Đã hoàn thành ({completedGoals.length})
          </h2>
          <PaybackGoalList
            goals={completedGoals}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onComplete={handleComplete}
          />
        </div>
      )}

      {/* Empty State */}
      {activeGoals.length === 0 && completedGoals.length === 0 && (
        <div className="card text-center py-16">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có mục tiêu nào</h3>
          <p className="text-gray-600 mb-6">Tạo mục tiêu đầu tiên để bắt đầu theo dõi payback</p>
          <button onClick={handleCreate} className="btn btn-primary">
            + Tạo mục tiêu mới
          </button>
        </div>
      )}

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

      {/* Payback Calendar Modal */}
      {showCalendar && (
        <PaybackCalendarModal
          goals={goals}
          onClose={() => setShowCalendar(false)}
        />
      )}
    </div>
  )
}