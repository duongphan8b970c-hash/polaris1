import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { formatCompactNumber, formatNumber } from '../../utils'

const COLORS = ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5']

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-800 mb-1">
        {d?.icon} {d?.name}
      </p>
      <p className="text-green-600 font-bold">+{formatNumber(d?.amount)} ₫</p>
      <p className="text-gray-400 text-xs">{d?.count} giao dịch</p>
    </div>
  )
}

/**
 * Horizontal bar chart showing top 5 income sources for the selected month
 */
export default function TopIncomeSourcesChart({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-1/2 mb-4" />
        <div className="h-48 bg-gray-100 rounded" />
      </div>
    )
  }

  const hasData = data?.length > 0

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
        💚 Top 5 Nguồn Thu Nhập
      </h3>
      <p className="text-xs text-gray-500 mb-4">Danh mục thu nhập lớn nhất trong tháng</p>

      {!hasData ? (
        <div className="h-48 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <p className="text-4xl mb-2">📭</p>
            <p className="font-medium">Chưa có dữ liệu thu nhập</p>
          </div>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={Math.max(data.length * 52, 160)}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 60, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
              <XAxis
                type="number"
                tickFormatter={v => formatCompactNumber(v)}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={90}
                tick={{ fontSize: 11 }}
                tickFormatter={v => v.length > 12 ? v.slice(0, 12) + '…' : v}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" name="Thu nhập" radius={[0, 4, 4, 0]} maxBarSize={28}>
                {data.map((entry, i) => (
                  <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Detail list */}
          <div className="mt-3 space-y-2">
            {data.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-gray-600">{item.icon} {item.name}</span>
                  <span className="text-gray-400 text-xs">({item.count} giao dịch)</span>
                </div>
                <span className="font-bold text-green-600">+{formatNumber(item.amount)} ₫</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
