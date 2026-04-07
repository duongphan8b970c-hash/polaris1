import {
  BarChart,
  Bar,
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
          <span className="font-bold">{formatNumber(entry.value)} ₫</span>
        </div>
      ))}
      {payload.length === 2 && (
        <div className="border-t border-gray-100 pt-1 mt-1">
          <span className="text-gray-500 text-xs">
            Số dư: {formatNumber((payload[0]?.value || 0) - (payload[1]?.value || 0))} ₫
          </span>
        </div>
      )}
    </div>
  )
}

/**
 * Grouped bar chart comparing income/expense across 3 recent months
 */
export default function ThreeMonthComparisonChart({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-1/2 mb-4" />
        <div className="h-64 bg-gray-100 rounded" />
      </div>
    )
  }

  const hasData = data?.some(d => d.income > 0 || d.expense > 0)

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
        📆 So Sánh 3 Tháng Gần Nhất
      </h3>
      <p className="text-xs text-gray-500 mb-4">Xu hướng thu/chi để dự đoán tháng tiếp theo</p>

      {!hasData ? (
        <div className="h-64 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <p className="text-4xl mb-2">📭</p>
            <p className="font-medium">Chưa có đủ dữ liệu</p>
          </div>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis
                tickFormatter={v => formatCompactNumber(v)}
                tick={{ fontSize: 11 }}
                width={65}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="income" name="Thu nhập" fill="#10B981" radius={[3, 3, 0, 0]} maxBarSize={45} />
              <Bar dataKey="expense" name="Chi tiêu" fill="#EF4444" radius={[3, 3, 0, 0]} maxBarSize={45} />
            </BarChart>
          </ResponsiveContainer>

          {/* Summary table */}
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-gray-100">
                  <th className="text-left pb-1 font-medium">Tháng</th>
                  <th className="text-right pb-1 font-medium text-green-600">Thu nhập</th>
                  <th className="text-right pb-1 font-medium text-red-600">Chi tiêu</th>
                  <th className="text-right pb-1 font-medium text-blue-600">Số dư</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0">
                    <td className="py-1.5 font-semibold text-gray-700">{row.name}</td>
                    <td className="text-right py-1.5 text-green-600">+{formatNumber(row.income)} ₫</td>
                    <td className="text-right py-1.5 text-red-600">-{formatNumber(row.expense)} ₫</td>
                    <td className={`text-right py-1.5 font-bold ${row.income - row.expense >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {row.income - row.expense >= 0 ? '+' : ''}{formatNumber(row.income - row.expense)} ₫
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
