import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e'
]

export default function CategoryPieChart({ transactions, type = 'expense' }) {
  const chartData = useMemo(() => {
    const categoryMap = {}
    
    transactions
      .filter(tx => tx.type === type)
      .forEach(tx => {
        const catName = tx.category?.name || 'Khác'
        categoryMap[catName] = (categoryMap[catName] || 0) + tx.amount
      })

    return Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10) // Top 10
  }, [transactions, type])

  const total = chartData.reduce((sum, item) => sum + item.value, 0)

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    if (percent < 0.05) return null // Hide small labels

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
          {type === 'expense' ? 'Chi tiêu' : 'Thu nhập'} theo danh mục
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          Chưa có dữ liệu
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
        {type === 'expense' ? 'Chi tiêu' : 'Thu nhập'} theo danh mục
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => `${value.toLocaleString('vi-VN')} ₫`}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value, entry) => {
              const percentage = ((entry.value / total) * 100).toFixed(1)
              return `${value} (${percentage}%)`
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}