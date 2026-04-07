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

const CATEGORY_COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#84CC16', '#22C55E',
  '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280',
  '#F43F5E', '#A855F7',
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s, p) => s + (p.value || 0), 0)
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm max-w-[240px]">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.filter(p => p.value > 0).map((entry, i) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-600 truncate">{entry.name}:</span>
          <span className="font-semibold flex-shrink-0">{formatCompactNumber(entry.value)} ₫</span>
        </div>
      ))}
      <div className="border-t border-gray-100 pt-1 mt-1">
        <span className="text-gray-500 font-semibold text-xs">Tổng: {formatNumber(total)} ₫</span>
      </div>
    </div>
  )
}

/**
 * Stacked bar chart showing weekly expense breakdown by category
 */
export default function WeeklyCategoryChart({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-1/2 mb-4" />
        <div className="h-64 bg-gray-100 rounded" />
      </div>
    )
  }

  if (!data) return null
  const { data: chartData, categories } = data
  const hasData = chartData?.some(w => categories.some(cat => (w[cat] || 0) > 0))

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
        📦 Chi Tiêu Theo Tuần và Danh Mục
      </h3>
      <p className="text-xs text-gray-500 mb-4">Cơ cấu chi tiêu mỗi tuần theo danh mục (stacked bar)</p>

      {!hasData ? (
        <div className="h-64 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <p className="text-4xl mb-2">📭</p>
            <p className="font-medium">Chưa có dữ liệu chi tiêu</p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="week" tick={{ fontSize: 12 }} />
            <YAxis
              tickFormatter={v => formatCompactNumber(v)}
              tick={{ fontSize: 11 }}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              formatter={v => v.length > 14 ? v.slice(0, 14) + '…' : v}
            />
            {categories.map((cat, i) => (
              <Bar
                key={cat}
                dataKey={cat}
                name={cat}
                stackId="a"
                fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
