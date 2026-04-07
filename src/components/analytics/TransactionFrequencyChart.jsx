import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-600">{entry.name}:</span>
          <span className="font-bold">{entry.value} giao dịch</span>
        </div>
      ))}
    </div>
  )
}

/**
 * Line chart showing transaction count by week (income vs expense)
 */
export default function TransactionFrequencyChart({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-1/2 mb-4" />
        <div className="h-56 bg-gray-100 rounded" />
      </div>
    )
  }

  const hasData = data?.some(d => d.income > 0 || d.expense > 0)
  const totalIncome = data?.reduce((s, d) => s + d.income, 0) || 0
  const totalExpense = data?.reduce((s, d) => s + d.expense, 0) || 0

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
        📅 Tần Suất Giao Dịch Theo Tuần
      </h3>
      <p className="text-xs text-gray-500 mb-1">Số lượng giao dịch thu nhập và chi tiêu mỗi tuần</p>
      <div className="flex gap-4 text-xs mb-4">
        <span className="text-green-600 font-semibold">🟢 Thu nhập: {totalIncome} giao dịch</span>
        <span className="text-red-600 font-semibold">🔴 Chi tiêu: {totalExpense} giao dịch</span>
      </div>

      {!hasData ? (
        <div className="h-48 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <p className="text-4xl mb-2">📭</p>
            <p className="font-medium">Chưa có giao dịch trong tháng này</p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="week" tick={{ fontSize: 12 }} />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11 }}
              width={30}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="income"
              name="Thu nhập"
              stroke="#10B981"
              strokeWidth={2.5}
              dot={{ r: 5, fill: '#10B981' }}
              activeDot={{ r: 7 }}
            />
            <Line
              type="monotone"
              dataKey="expense"
              name="Chi tiêu"
              stroke="#EF4444"
              strokeWidth={2.5}
              dot={{ r: 5, fill: '#EF4444' }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
