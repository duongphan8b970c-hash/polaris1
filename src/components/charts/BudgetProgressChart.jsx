import { useMemo, useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { supabase } from '../../lib/supabase'

export default function BudgetProgressChart({ budgets }) {
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
        usage[budget.id] = spent
      }
    }
    
    setBudgetUsage(usage)
  }

  const chartData = useMemo(() => {
    return budgets
      .filter(b => b.period === 'monthly')
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
        Tiến độ ngân sách tháng này
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