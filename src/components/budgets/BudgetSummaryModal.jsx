/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { formatNumber } from '../../utils'
import { getBudgetPeriodRange, getBudgetPeriodLabel } from '../../utils/budgetPeriod'

export default function BudgetSummaryModal({ budgets, isOpen, onClose }) {
  const [budgetUsage, setBudgetUsage] = useState({})

  const fetchAllUsage = async () => {
    const now = new Date()
    const budgetRanges = budgets.map(b => ({
      budget: b,
      ...getBudgetPeriodRange(b, now),
    }))

    const allStarts = budgetRanges.map(r => r.periodStart)
    const allEnds = budgetRanges.map(r => r.periodEnd)
    const minStart = allStarts.sort()[0]
    const maxEnd = allEnds.sort().reverse()[0]
    const categoryIds = budgets.map(b => b.category_id)

    const { data } = await supabase
      .from('financial_transactions')
      .select('amount, category_id, date')
      .in('category_id', categoryIds)
      .eq('type', 'expense')
      .gte('date', minStart)
      .lte('date', maxEnd)
      .is('deleted_at', null)

    const usage = {}
    for (const { budget, periodStart, periodEnd } of budgetRanges) {
      const categoryTransactions = (data || []).filter(
        t => t.category_id === budget.category_id && t.date >= periodStart && t.date <= periodEnd
      )
      const spent = categoryTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
      usage[budget.id] = {
        spent,
        remaining: budget.amount - spent,
        percentage: budget.amount > 0 ? (spent / budget.amount * 100) : 0
      }
    }

    setBudgetUsage(usage)
  }

  useEffect(() => {
    if (isOpen && budgets.length > 0) {
      fetchAllUsage()
    }
  }, [isOpen, budgets])

  if (!isOpen) return null

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0)
  const totalSpent = budgets.reduce((sum, b) => sum + (budgetUsage[b.id]?.spent || 0), 0)
  const totalRemaining = totalBudget - totalSpent
  const totalPercentage = totalBudget > 0 ? (totalSpent / totalBudget * 100) : 0

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal Content */}
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-gray-100">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b-2 border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
            <h2 className="text-xl font-bold text-gray-900">
              📊 Tổng hợp danh mục & hạn mức
            </h2>
            <button
              onClick={onClose}
              className="p-2.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-all"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-6">
            {/* Overall Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-xs text-blue-600 font-medium mb-1">Tổng hạn mức</p>
                <p className="text-lg font-bold text-blue-900">{formatNumber(totalBudget)} ₫</p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 text-center">
                <p className="text-xs text-red-600 font-medium mb-1">Đã chi</p>
                <p className="text-lg font-bold text-red-900">{formatNumber(totalSpent)} ₫</p>
              </div>
              <div className={`${totalRemaining >= 0 ? 'bg-green-50' : 'bg-red-50'} rounded-xl p-4 text-center`}>
                <p className={`text-xs ${totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'} font-medium mb-1`}>
                  Còn lại
                </p>
                <p className={`text-lg font-bold ${totalRemaining >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                  {formatNumber(Math.abs(totalRemaining))} ₫
                </p>
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 font-medium">Tiến độ tổng</span>
                <span className={`font-bold ${totalPercentage > 100 ? 'text-red-600' : totalPercentage > 80 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {totalPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    totalPercentage > 100 ? 'bg-red-500' :
                    totalPercentage > 80 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(totalPercentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Category Breakdown Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Danh mục</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Chu kỳ</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Hạn mức</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Đã chi</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Còn lại</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" style={{ minWidth: '120px' }}>Tiến độ</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {budgets.map(budget => {
                    const usage = budgetUsage[budget.id] || { spent: 0, remaining: budget.amount, percentage: 0 }
                    const isOverBudget = usage.spent > budget.amount
                    const isNearLimit = usage.percentage > 80 && !isOverBudget

                    return (
                      <tr key={budget.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{budget.category?.icon || '📁'}</span>
                            <span className="text-sm font-medium text-gray-900">{budget.category?.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {budget.period === 'monthly' ? 'Tháng' : 'Năm'}
                          <span className="text-xs text-gray-400 block">{getBudgetPeriodLabel(budget)}</span>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                          {formatNumber(budget.amount)} ₫
                        </td>
                        <td className={`px-4 py-3 text-sm font-bold text-right ${isOverBudget ? 'text-red-600' : 'text-gray-900'}`}>
                          {formatNumber(usage.spent)} ₫
                        </td>
                        <td className={`px-4 py-3 text-sm font-bold text-right ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                          {isOverBudget ? '-' : ''}{formatNumber(Math.abs(usage.remaining))} ₫
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isOverBudget ? 'bg-red-500' :
                                  isNearLimit ? 'bg-yellow-500' :
                                  'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(usage.percentage, 100)}%` }}
                              />
                            </div>
                            <span className={`text-xs font-semibold w-12 text-right ${
                              isOverBudget ? 'text-red-600' :
                              isNearLimit ? 'text-yellow-600' :
                              'text-green-600'
                            }`}>
                              {usage.percentage.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {budgets.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">Chưa có ngân sách nào được thiết lập</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
