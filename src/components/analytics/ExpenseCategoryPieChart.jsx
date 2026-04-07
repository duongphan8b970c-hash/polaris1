import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatNumber } from '../../utils'

const PIE_COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#84CC16', '#22C55E',
  '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280',
]

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-800 mb-1">
        {d.icon} {d.name}
      </p>
      <p className="text-red-600 font-bold">-{formatNumber(d.amount)} ₫</p>
      <p className="text-gray-500">{d.percentage.toFixed(1)}% tổng chi tiêu</p>
      <p className="text-gray-400 text-xs">{d.count} giao dịch</p>
    </div>
  )
}

const CustomLegend = ({ data }) => (
  <div className="mt-3 space-y-1 max-h-48 overflow-y-auto">
    {data.map((entry, i) => (
      <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-gray-50 last:border-0">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
          <span className="text-gray-600 truncate max-w-[120px]">{entry.icon} {entry.name}</span>
        </div>
        <div className="flex items-center gap-2 ml-2">
          <span className="font-semibold text-red-600">{formatNumber(entry.amount)} ₫</span>
          <span className="text-gray-400 w-10 text-right">{entry.percentage.toFixed(1)}%</span>
        </div>
      </div>
    ))}
  </div>
)

/**
 * Pie chart showing top 10 expense categories for the selected month
 */
export default function ExpenseCategoryPieChart({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-1/2 mb-4" />
        <div className="h-64 bg-gray-100 rounded-full mx-auto w-64" />
      </div>
    )
  }

  const hasData = data?.length > 0

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
        🥧 Phân Bố Chi Tiêu Theo Danh Mục
      </h3>
      <p className="text-xs text-gray-500 mb-4">Top 10 danh mục chi tiêu trong tháng</p>

      {!hasData ? (
        <div className="h-64 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <p className="text-4xl mb-2">📭</p>
            <p className="font-medium">Chưa có dữ liệu chi tiêu</p>
          </div>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={95}
                paddingAngle={2}
                dataKey="amount"
                nameKey="name"
              >
                {data.map((entry, i) => (
                  <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <CustomLegend data={data} />
        </>
      )}
    </div>
  )
}
