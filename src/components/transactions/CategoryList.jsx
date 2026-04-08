import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { formatNumber } from '../../utils'

export default function CategoryList({ 
  categories = [],
  budgets = [],
  onEdit,
  onSetBudget,
  onEditBudget,
  onDeleteBudget,
}) {
  const safeCategories = Array.isArray(categories) ? categories : []
  const [budgetUsage, setBudgetUsage] = useState({})

  // Fetch budget usage for all budgets that belong to visible categories
  useEffect(() => {
    const fetchUsage = async () => {
      if (!budgets.length) return
      const now = new Date()
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

      const monthlyBudgets = budgets.filter(b => b.period === 'monthly')
      if (!monthlyBudgets.length) return

      const categoryIds = monthlyBudgets.map(b => b.category_id)
      const { data } = await supabase
        .from('financial_transactions')
        .select('amount, category_id')
        .in('category_id', categoryIds)
        .eq('type', 'expense')
        .gte('date', currentMonth)
        .is('deleted_at', null)

      const usage = {}
      for (const budget of monthlyBudgets) {
        const categoryTransactions = (data || []).filter(t => t.category_id === budget.category_id)
        const spent = categoryTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
        usage[budget.category_id] = {
          spent,
          remaining: budget.amount - spent,
          percentage: budget.amount > 0 ? (spent / budget.amount * 100) : 0
        }
      }

      setBudgetUsage(usage)
    }

    fetchUsage()
  }, [budgets])

  if (safeCategories.length === 0) {
    return (
      <div className="card text-center py-12">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        <p className="text-gray-500 font-medium">Chưa có danh mục nào</p>
        <p className="text-gray-400 text-sm mt-1">Thêm danh mục đầu tiên của bạn</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {safeCategories.map((category) => {
        const budget = budgets.find(b => b.category_id === category.id)
        const usage = budget ? budgetUsage[category.id] : null
        const isOverBudget = usage ? usage.spent > budget.amount : false
        const isNearLimit = usage ? (usage.percentage > 80 && !isOverBudget) : false

        return (
          <div
            key={category.id}
            className="card hover:shadow-lg transition-shadow"
          >
            {/* Category header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{category.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{category.name}</h3>
                  <p className="text-sm text-gray-500">
                    {category.type === 'income' ? (
                      <span className="inline-flex items-center gap-1 text-green-600">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        Thu nhập
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-600">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                        </svg>
                        Chi tiêu
                      </span>
                    )}
                  </p>
                </div>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit && onEdit(category)
                }}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Sửa danh mục"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>

            {/* Budget section (expense categories only) */}
            {category.type === 'expense' && (
              <div className="border-t border-gray-100 pt-3 mt-1">
                {budget ? (
                  <div>
                    {/* Budget header with edit/delete */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500 font-medium">Hạn mức tháng</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditBudget && onEditBudget(budget)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Sửa hạn mức"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onDeleteBudget && onDeleteBudget(budget)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Xóa hạn mức"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Spent vs Limit */}
                    {usage && (
                      <>
                        <div className="space-y-1 mb-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Đã chi:</span>
                            <span className={`font-bold ${isOverBudget ? 'text-red-600' : 'text-gray-800'}`}>
                              {formatNumber(usage.spent)} ₫
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Hạn mức:</span>
                            <span className="font-bold text-gray-800">
                              {formatNumber(budget.amount)} ₫
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-2">
                          <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
                            <span>Đã sử dụng</span>
                            <span className="font-semibold">
                              {usage.percentage.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
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

                        {/* Status */}
                        {isOverBudget ? (
                          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                            <p className="text-xs text-red-700 font-medium">
                              ⚠️ Vượt {formatNumber(Math.abs(usage.remaining))} ₫
                            </p>
                          </div>
                        ) : isNearLimit ? (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                            <p className="text-xs text-yellow-700 font-medium">
                              ⚡ Còn {formatNumber(usage.remaining)} ₫
                            </p>
                          </div>
                        ) : (
                          <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                            <p className="text-xs text-green-700 font-medium">
                              ✅ Còn {formatNumber(usage.remaining)} ₫
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    {!usage && (
                      <p className="text-sm font-bold text-gray-800">{budget.amount.toLocaleString('vi-VN')} ₫</p>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => onSetBudget && onSetBudget(category, null)}
                    className="w-full text-xs text-center py-1.5 border border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
                  >
                    + Đặt hạn mức
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}