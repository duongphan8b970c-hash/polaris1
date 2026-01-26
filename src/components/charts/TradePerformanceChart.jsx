import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function TradePerformanceChart({ trades }) {
  const chartData = useMemo(() => {
    const closedTrades = trades
      .filter(t => t.status === 'closed' && t.updated_at)
      .sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at))

    let cumulativePL = 0
    const data = []

    closedTrades.forEach((trade, index) => {
      cumulativePL += trade.profit_loss || 0
      data.push({
        index: index + 1,
        symbol: trade.symbol,
        'P&L lũy kế': Math.round(cumulativePL),
        'P&L lệnh': Math.round(trade.profit_loss || 0),
      })
    })

    return data
  }, [trades])

  const formatCurrency = (value) => {
    const abs = Math.abs(value)
    if (abs >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    }
    return `${(value / 1000).toFixed(0)}K`
  }

  if (chartData.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
          Hiệu suất Trade
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          Chưa có trade nào
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
        Hiệu suất Trade (Lũy kế P&L)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis 
            dataKey="index" 
            label={{ value: 'Số lệnh', position: 'insideBottom', offset: -5 }}
            className="text-gray-600 dark:text-gray-400"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            tickFormatter={formatCurrency}
            className="text-gray-600 dark:text-gray-400"
            style={{ fontSize: '12px' }}
          />
          <Tooltip 
            formatter={(value, name) => [`${value.toLocaleString('vi-VN')} ₫`, name]}
            labelFormatter={(label) => `Lệnh #${label}`}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="P&L lũy kế" 
            stroke="#8b5cf6" 
            strokeWidth={3}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}