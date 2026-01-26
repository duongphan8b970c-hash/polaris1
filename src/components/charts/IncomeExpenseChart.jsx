import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function IncomeExpenseChart({ transactions }) {
  const chartData = useMemo(() => {
    // Get last 6 months
    const months = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      months.push({
        month: date.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' }),
        year: date.getFullYear(),
        monthIndex: date.getMonth(),
        income: 0,
        expense: 0,
      })
    }

    // Aggregate transactions by month
    transactions.forEach(tx => {
      const date = new Date(tx.date)
      const monthData = months.find(
        m => m.year === date.getFullYear() && m.monthIndex === date.getMonth()
      )
      
      if (monthData) {
        if (tx.type === 'income') {
          monthData.income += tx.amount
        } else {
          monthData.expense += tx.amount
        }
      }
    })

    return months.map(m => ({
      month: m.month,
      'Thu nhập': Math.round(m.income),
      'Chi tiêu': Math.round(m.expense),
      'Chênh lệch': Math.round(m.income - m.expense),
    }))
  }, [transactions])

  const formatCurrency = (value) => {
    return `${(value / 1000000).toFixed(1)}M`
  }

  return (
    <div className="card">
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
        Thu chi 6 tháng gần đây
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis 
            dataKey="month" 
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
          <Line 
            type="monotone" 
            dataKey="Thu nhập" 
            stroke="#10b981" 
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="Chi tiêu" 
            stroke="#ef4444" 
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="Chênh lệch" 
            stroke="#3b82f6" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}