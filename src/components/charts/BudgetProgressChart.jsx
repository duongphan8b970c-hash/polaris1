import { useMemo, useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { supabase } from '../../lib/supabase'
import { getBudgetPeriodRange } from '../../utils/budgetPeriod'

export default function BudgetProgressChart({ budgets }) {
  const [budgetUsage, setBudgetUsage] = useState({})

  useEffect(() => {
    fetchBudgetUsage()
  }, [budgets])

  const fetchBudgetUsage = async () => {
    const now = new Date()
    if (!budgets.length) return

    // Calculate date ranges for all budgets and find the overall min/max
    const budgetRanges = budgets.map(b => ({
      budget: b,
      ...getBudgetPeriodRange(b, now),
    }))

    const allStarts = budgetRanges.map(r => r.periodStart)
    const allEnds = budgetRanges.map(r => r.periodEnd)
    const minStart = allStarts.sort()[0]
    const maxEnd = allEnds.sort().reverse()[0]
    const categoryIds = budgets.map(b => b.category_id)

    // Single query fetching all relevant transactions
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
      const spent = categoryTransactions.reduce((sum, t) => sum + t.amount, 0) || 0
      usage[budget.id] = spent
    }
    
    setBudgetUsage(usage)
  }

  const chartData = useMemo(() => {
    return budgets
      .map(budget => {
        const spent = budgetUsage[budget.id] || 0
        return {
          name: budget.category?.name || 'Unknown',
          'Hạn mức': Math.round(budget.amount),
          'Đã chi': Math.round(spent),
        }
      })
      .slice(0, 8) // Top 8
  }, [budgets, budgetUsage])

  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    }
    return `${(value / 1000).toFixed(0)}K`
  }

  if (chartData.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
          Tiến độ ngân sách
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          Chưa có ngân sách nào
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
        Tiến độ ngân sách kỳ hiện tại
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis 
            dataKey="name" 
            className="text-gray-600 dark:text-gray-400"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            tickFormatter={formatCurrency}
            className="text-gray-600 dark:text-gray-400"
            style={{ fontSize: '12px' }}
          />
          <Tooltip 
            formatter={(value) => `${value.toLocaleString('vi-VN')} ₫`}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Bar dataKey="Hạn mức" fill="#94a3b8" />
          <Bar dataKey="Đã chi" fill="#ef4444" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}