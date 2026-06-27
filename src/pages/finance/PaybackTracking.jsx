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
  const { goals, loading, error, monthFilter, setMonthFilter, createGoal, updateGoal, completeGoal, deleteGoal, refetch } = usePaybackGoals(goalType)
  const { priorities } = usePaybackPriorities()
  
  const isPlan = goalType === 'plan'
  
  const [showForm, setShowForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [selectedPriority, setSelectedPriority] = useState('all')
  const [showCalendar, setShowCalendar] = useState(false)
  const [planStatusFilter, setPlanStatusFilter] = useState('all')

  // ✅ Separate active and completed
  const activeGoals = goals.filter(g => g.status === 'active')
  const completedGoals = goals.filter(g => g.status === 'completed')

  // Calculate summary stats (tính cả active + completed)
  const today = new Date()
  const stats = {
    total: goals.length,
    active: activeGoals.length,
    completed: completedGoals.length,
    totalDebt: goals.reduce((sum, g) => sum + g.target_amount, 0),
    totalPaid: goals.reduce((sum, g) => sum + g.current_paid, 0),
    totalRemaining: goals.reduce((sum, g) => sum + g.remaining, 0),
    // Monthly stats (only when filter is active)
    monthlyPaid: monthFilter ? goals.reduce((sum, g) => sum + (g.monthly_paid || 0), 0) : 0,
    // Countdown: nearest deadline among active goals
    nearestDeadline: activeGoals.length > 0
      ? activeGoals.reduce((nearest, g) => {
          const deadline = new Date(g.deadline)
          return !nearest || deadline < nearest.date ? { date: deadline, name: g.name } : nearest
        }, null)
      : null,
    overdueCount: activeGoals.filter(g => g.is_overdue).length,
  }

  // Generate month options for filter
  const monthOptions = (() => {
    const options = [{ value: '', label: 'Tất cả (All-time)' }]
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`
      options.push({ value, label })
    }
    return options
  })()

  // ✅ Filter active goals by priority (only for payback)
  const filteredActiveGoals = selectedPriority === 'all'
    ? activeGoals
    : activeGoals.filter(g => {
        const goalPriority = priorities.find(p => p.id === g.priority_id)
        return goalPriority?.sort_order === selectedPriority
      })

  // ✅ Group active goals by priority (only for payback)
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
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setShowCalendar(true)}
          className={`btn btn-secondary ${isPlan ? 'bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100' : 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100'}`}
        >
          <svg className="w-5 h-5 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Watchout 📅
        </button>

        {!isPlan && (
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
        )}

        <button onClick={handleCreate} className={`btn ${isPlan ? 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white' : 'btn-primary'}`}>
          <svg className="w-5 h-5 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {isPlan ? 'Tạo kế hoạch mới' : 'Tạo mục tiêu mới'}
        </button>
      </div>

      {/* Month Filter - only for payback */}
      {!isPlan && (
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">📅 Lọc theo tháng:</label>
            <select
              value={monthFilter || ''}
              onChange={(e) => setMonthFilter(e.target.value || null)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {monthOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {monthFilter && (
              <button
                onClick={() => setMonthFilter(null)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ✕ Xóa filter
              </button>
            )}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {stats.active > 0 && (
        isPlan ? (
          /* Plan tab: only total goals + estimated spending in teal tone */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-4 text-white shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-teal-100 text-sm font-medium">Tổng mục tiêu</p>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-3xl font-bold">{stats.active}</p>
              <p className="text-teal-100 text-xs">kế hoạch</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl p-4 text-white shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-emerald-100 text-sm font-medium">Dự kiến chi tiêu</p>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-3xl font-bold">{formatNumber(stats.totalDebt)}</p>
              <p className="text-emerald-100 text-xs">VND</p>
            </div>
          </div>
        ) : (
          /* Payback tab: full 5-card stats */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-blue-100 text-sm font-medium">Đang theo dõi</p>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-3xl font-bold">{stats.active}</p>
              <p className="text-blue-100 text-xs">mục tiêu</p>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 text-white shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-red-100 text-sm font-medium">Tổng tiền</p>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-3xl font-bold">{formatNumber(stats.totalDebt)}</p>
              <p className="text-red-100 text-xs">VND</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-green-100 text-sm font-medium">Đã trả</p>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-3xl font-bold">{formatNumber(stats.totalPaid)}</p>
              <p className="text-green-100 text-xs">VND</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-orange-100 text-sm font-medium">Còn lại</p>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-3xl font-bold">{formatNumber(stats.totalRemaining)}</p>
              <p className="text-orange-100 text-xs">VND</p>
            </div>

            {/* Countdown / Nearest Deadline Card */}
            <div className={`bg-gradient-to-br ${stats.overdueCount > 0 ? 'from-rose-500 to-rose-600' : 'from-indigo-500 to-indigo-600'} rounded-xl p-4 text-white shadow`}>
              <div className="flex items-center justify-between mb-2">
                <p className={`${stats.overdueCount > 0 ? 'text-rose-100' : 'text-indigo-100'} text-sm font-medium`}>
                  {stats.overdueCount > 0 ? '⚠ Quá hạn' : '⏰ Deadline gần nhất'}
                </p>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              {stats.overdueCount > 0 ? (
                <>
                  <p className="text-3xl font-bold">{stats.overdueCount}</p>
                  <p className="text-rose-100 text-xs">mục tiêu quá hạn</p>
                </>
              ) : stats.nearestDeadline ? (
                <>
                  <p className="text-3xl font-bold">
                    {(() => {
                      const days = Math.ceil((stats.nearestDeadline.date - today) / (1000 * 60 * 60 * 24))
                      return days === 0 ? 'Hôm nay' : `${days} ngày`
                    })()}
                  </p>
                  <p className="text-indigo-100 text-xs truncate" title={stats.nearestDeadline.name}>
                    {stats.nearestDeadline.name}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold">—</p>
                  <p className="text-indigo-100 text-xs">Không có deadline</p>
                </>
              )}
            </div>
          </div>
        )
      )}

      {/* Countdown Overview - all active goals' deadlines */}
      {!isPlan && activeGoals.length > 0 && (
        <div className="mb-4 bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">⏰</span>
            <h3 className="text-sm font-bold text-slate-900">Countdown tất cả mục tiêu</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...activeGoals]
              .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
              .map(goal => {
                const deadline = new Date(goal.deadline)
                const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24))
                const isOverdue = daysLeft < 0
                const isUrgent = daysLeft >= 0 && daysLeft <= 7
                const isToday = daysLeft === 0

                return (
                  <div
                    key={goal.id}
                    className={`bg-white rounded-lg p-3 border ${
                      isOverdue ? 'border-red-300 bg-red-50' :
                      isToday ? 'border-orange-300 bg-orange-50' :
                      isUrgent ? 'border-yellow-300 bg-yellow-50' :
                      'border-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-gray-900 truncate flex-1 mr-2" title={goal.name}>
                        💳 {goal.name}
                      </p>
                      <span className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                        isOverdue ? 'bg-red-100 text-red-700' :
                        isToday ? 'bg-orange-100 text-orange-700' :
                        isUrgent ? 'bg-yellow-100 text-yellow-700' :
                        daysLeft <= 30 ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {isOverdue ? `⚠ Quá ${Math.abs(daysLeft)} ngày` :
                         isToday ? '🔥 Hôm nay' :
                         `📅 ${daysLeft} ngày`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Hạn: {deadline.toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Monthly Stats Card - only when month filter is active */}
      {!isPlan && monthFilter && stats.active > 0 && (
        <div className="mb-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">📊</span>
            <h3 className="text-sm font-bold text-indigo-900">
              Thống kê tháng {monthFilter.split('-')[1]}/{monthFilter.split('-')[0]}
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-3 border border-indigo-100">
              <p className="text-xs text-gray-500 mb-1">Đã trả trong tháng</p>
              <p className="text-xl font-bold text-indigo-600">{formatNumber(stats.monthlyPaid)} ₫</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-indigo-100">
              <p className="text-xs text-gray-500 mb-1">Tổng đã trả (all-time)</p>
              <p className="text-xl font-bold text-green-600">{formatNumber(stats.totalPaid)} ₫</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-indigo-100">
              <p className="text-xs text-gray-500 mb-1">Tiến độ tổng</p>
              <p className="text-xl font-bold text-gray-900">
                {stats.totalDebt > 0 ? ((stats.totalPaid / stats.totalDebt) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
          {/* Per-goal monthly breakdown */}
          <div className="mt-3 space-y-2">
            {activeGoals.filter(g => g.monthly_paid > 0).map(goal => (
              <div key={goal.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-indigo-100">
                <div className="flex items-center gap-2">
                  <span className="text-sm">💳</span>
                  <span className="text-sm font-medium text-gray-900">{goal.name}</span>
                </div>
                <span className="text-sm font-bold text-indigo-600">
                  {formatNumber(goal.monthly_paid)} ₫
                </span>
              </div>
            ))}
            {activeGoals.filter(g => g.monthly_paid > 0).length === 0 && (
              <p className="text-sm text-gray-500 text-center py-2">
                Chưa có giao dịch payback nào trong tháng này
              </p>
            )}
          </div>
        </div>
      )}

      {/* Priority Filter Buttons - only for payback */}
      {!isPlan && activeGoals.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
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

      {/* Status Filter - only for plan */}
      {isPlan && goals.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setPlanStatusFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              planStatusFilter === 'all'
                ? 'bg-teal-100 text-teal-700 ring-2 ring-offset-2 ring-teal-500 shadow-md'
                : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            📋 Tất cả
            <span className="ml-1.5 text-xs opacity-70">({goals.length})</span>
          </button>
          <button
            onClick={() => setPlanStatusFilter('active')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              planStatusFilter === 'active'
                ? 'bg-teal-100 text-teal-700 ring-2 ring-offset-2 ring-teal-500 shadow-md'
                : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            📅 Chưa hoàn thành
            <span className="ml-1.5 text-xs opacity-70">({activeGoals.length})</span>
          </button>
          <button
            onClick={() => setPlanStatusFilter('completed')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              planStatusFilter === 'completed'
                ? 'bg-green-100 text-green-700 ring-2 ring-offset-2 ring-green-500 shadow-md'
                : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            ✓ Đã hoàn thành
            <span className="ml-1.5 text-xs opacity-70">({completedGoals.length})</span>
          </button>
        </div>
      )}

      {/* ✅ ACTIVE GOALS SECTION */}
      {activeGoals.length > 0 && (!isPlan || planStatusFilter === 'all' || planStatusFilter === 'active') && (
        <div className="mb-5">
          {/* Only show section header when not filtering specific status for plans */}
          {(!isPlan || planStatusFilter === 'all') && (
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className={`w-6 h-6 ${isPlan ? 'text-teal-500' : 'text-orange-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {isPlan ? `Kế hoạch chi tiêu (${activeGoals.length})` : `Đang trả (${activeGoals.length})`}
            </h2>
          )}

          {isPlan ? (
            /* Plan tab: flat list, no priority grouping */
            <PaybackGoalList
              goals={activeGoals}
              goalType={goalType}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onComplete={handleComplete}
            />
          ) : selectedPriority === 'all' ? (
            /* Grouped by priority */
            Object.entries(groupedActiveGoals)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([sortOrder, { priority, goals: priorityGoals }]) => (
                <div key={sortOrder} className="mb-4">
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
                    goalType={goalType}
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
                goalType={goalType}
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
      {completedGoals.length > 0 && (!isPlan || planStatusFilter === 'all' || planStatusFilter === 'completed') && (
        <div className="mb-5">
          {(!isPlan || planStatusFilter === 'all') && (
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Đã hoàn thành ({completedGoals.length})
            </h2>
          )}
          <PaybackGoalList
            goals={completedGoals}
            goalType={goalType}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onComplete={handleComplete}
          />
        </div>
      )}

      {/* Empty State */}
      {activeGoals.length === 0 && completedGoals.length === 0 && (
        <div className="card text-center py-16">
          <div className={`w-20 h-20 bg-gradient-to-br ${isPlan ? 'from-teal-100 to-emerald-100' : 'from-orange-100 to-red-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <svg className={`w-10 h-10 ${isPlan ? 'text-teal-600' : 'text-orange-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
            {isPlan ? 'Chưa có kế hoạch nào' : 'Chưa có mục tiêu nào'}
          </h3>
          <p className="text-gray-600 mb-4">
            {isPlan ? 'Tạo kế hoạch chi tiêu đầu tiên' : 'Tạo mục tiêu đầu tiên để bắt đầu theo dõi'}
          </p>
          <button onClick={handleCreate} className={`btn ${isPlan ? 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white' : 'btn-primary'}`}>
            {isPlan ? '+ Tạo kế hoạch mới' : '+ Tạo mục tiêu mới'}
          </button>
        </div>
      )}

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={handleCloseForm}
        title={editingGoal 
          ? (isPlan ? 'Sửa kế hoạch' : 'Sửa mục tiêu')
          : (isPlan ? 'Tạo kế hoạch mới' : 'Tạo mục tiêu mới')
        }
      >
        <PaybackGoalForm
          goal={editingGoal}
          goalType={goalType}
          onSubmit={handleSubmit}
          onCancel={handleCloseForm}
          loading={submitting}
        />
      </Modal>

      {/* Payback Calendar Modal */}
      {showCalendar && (
        <PaybackCalendarModal
          goals={goals}
          goalType={goalType}
          onClose={() => setShowCalendar(false)}
        />
      )}
    </div>
  )
}
