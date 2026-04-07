import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { formatCompactNumber, formatNumber } from '../../utils'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-600">{entry.name}:</span>
          <span className="font-semibold">{formatNumber(entry.value)} ₫</span>
        </div>
      ))}
    </div>
  )
}

/**
 * Bar chart comparing monthly income vs expense for the selected year
 * Also shows trend lines for both income and expense
 */
export default function IncomeExpenseChart({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-64 bg-gray-100 rounded" />
      </div>
    )
  }

  const hasData = data?.some(d => d.income > 0 || d.expense > 0)

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
        📊 Thu Nhập vs Chi Tiêu Theo Tháng
      </h3>
      <p className="text-xs text-gray-500 mb-4">So sánh 12 tháng trong năm (có đường xu hướng)</p>

      {!hasData ? (
        <div className="h-64 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <p className="text-4xl mb-2">📭</p>
            <p className="font-medium">Chưa có dữ liệu cho năm này</p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis
              tickFormatter={v => formatCompactNumber(v)}
              tick={{ fontSize: 11 }}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="income" name="Thu nhập" fill="#10B981" radius={[3, 3, 0, 0]} maxBarSize={30} />
            <Bar dataKey="expense" name="Chi tiêu" fill="#EF4444" radius={[3, 3, 0, 0]} maxBarSize={30} />
            <Line
              type="monotone"
              dataKey="income"
              name="Xu hướng thu"
              stroke="#059669"
              strokeWidth={2}
              dot={false}
              strokeDasharray="5 3"
            />
            <Line
              type="monotone"
              dataKey="expense"
              name="Xu hướng chi"
              stroke="#DC2626"
              strokeWidth={2}
              dot={false}
              strokeDasharray="5 3"
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
