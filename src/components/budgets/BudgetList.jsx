import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function BudgetList({ budgets, onEdit, onDelete }) {
  const [budgetUsage, setBudgetUsage] = useState({})

  useEffect(() => {
    fetchBudgetUsage()
  }, [budgets])

  const fetchBudgetUsage = async () => {
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    
    const usage = {}
    
    for (const budget of budgets) {
      if (budget.period === 'monthly') {
        const { data } = await supabase
          .from('financial_transactions')
          .select('amount')
          .eq('category_id', budget.category_id)
          .eq('type', 'expense')
          .gte('date', currentMonth)
          .is('deleted_at', null)
        
        const spent = data?.reduce((sum, t) => sum + t.amount, 0) || 0
        usage[budget.id] = {
          spent,
          remaining: budget.amount - spent,
          percentage: budget.amount > 0 ? (spent / budget.amount * 100) : 0
        }
      }
    }
    
    setBudgetUsage(usage)
  }

  if (budgets.length === 0) {
    return (
      <div className="card text-center py-12">
        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <p className="text-gray-500">Chưa có ngân sách nào</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {budgets.map(budget => {
        const usage = budgetUsage[budget.id] || { spent: 0, remaining: budget.amount, percentage: 0 }
        const isOverBudget = usage.spent > budget.amount
        const isNearLimit = usage.percentage > 80 && !isOverBudget
        
        return (
          <div key={budget.id} className="card hover:shadow-lg transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3 flex-1">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                  {budget.category?.icon || '📁'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {budget.category?.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {budget.period === 'monthly' ? 'Hàng tháng' : 'Hàng năm'}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(budget)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Sửa"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => onDelete(budget)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Xóa"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Budget vs Spent */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Đã chi:</span>
                <span className={`font-bold ${isOverBudget ? 'text-red-600' : 'text-gray-900'}`}>
                  {usage.spent.toLocaleString('vi-VN')} ₫
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Hạn mức:</span>
                <span className="font-bold text-gray-900">
                  {budget.amount.toLocaleString('vi-VN')} ₫
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Đã sử dụng</span>
                <span className="font-semibold">
                  {usage.percentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all ${
                    isOverBudget 
                      ? 'bg-red-500' 
                      : isNearLimit 
                        ? 'bg-yellow-500' 
                        : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(usage.percentage, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Status Message */}
            {isOverBudget ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700 font-medium">
                  ⚠️ Vượt {usage.remaining < 0 ? Math.abs(usage.remaining).toLocaleString('vi-VN') : 0} ₫
                </p>
              </div>
            ) : isNearLimit ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-700 font-medium">
                  ⚡ Còn {usage.remaining.toLocaleString('vi-VN')} ₫
                </p>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-700 font-medium">
                  ✅ Còn {usage.remaining.toLocaleString('vi-VN')} ₫
                </p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}