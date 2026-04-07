import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { formatCompactNumber, formatNumber } from '../../utils'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-2">Ngày {label}</p>
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full bg-blue-500" />
        <span className="text-gray-600">Số dư lũy kế:</span>
        <span className={`font-bold ${d?.cumulative >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
          {d?.cumulative >= 0 ? '+' : ''}{formatNumber(d?.cumulative)} ₫
        </span>
      </div>
      {d?.income > 0 && (
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-gray-500 text-xs">Thu nhập ngày:</span>
          <span className="text-green-600 text-xs font-semibold">+{formatNumber(d.income)} ₫</span>
        </div>
      )}
      {d?.expense > 0 && (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-gray-500 text-xs">Chi tiêu ngày:</span>
          <span className="text-red-600 text-xs font-semibold">-{formatNumber(d.expense)} ₫</span>
        </div>
      )}
    </div>
  )
}

/**
 * Area chart showing cumulative daily balance for the selected month
 */
export default function CumulativeBalanceChart({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-1/2 mb-4" />
        <div className="h-64 bg-gray-100 rounded" />
      </div>
    )
  }

  const hasData = data?.some(d => d.income > 0 || d.expense > 0)
  const minVal = hasData ? Math.min(...data.map(d => d.cumulative)) : 0
  const maxVal = hasData ? Math.max(...data.map(d => d.cumulative)) : 0

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
        📈 Xu Hướng Số Dư Ví Theo Ngày
      </h3>
      <p className="text-xs text-gray-500 mb-4">Số dư lũy kế (thu - chi) theo từng ngày trong tháng</p>

      {!hasData ? (
        <div className="h-64 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <p className="text-4xl mb-2">📭</p>
            <p className="font-medium">Chưa có giao dịch trong tháng này</p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11 }}
              tickFormatter={v => v % 5 === 0 || v === 1 ? v : ''}
            />
            <YAxis
              tickFormatter={v => formatCompactNumber(v)}
              tick={{ fontSize: 11 }}
              width={65}
              domain={[Math.min(minVal * 1.1, 0), Math.max(maxVal * 1.1, 0)]}
            />
            <Tooltip content={<CustomTooltip />} />
            {minVal < 0 && <ReferenceLine y={0} stroke="#94A3B8" strokeDasharray="4 2" />}
            <Area
              type="monotone"
              dataKey="cumulative"
              name="Số dư lũy kế"
              stroke="#3B82F6"
              strokeWidth={2.5}
              fill="url(#balanceGradient)"
              dot={false}
              activeDot={{ r: 5, fill: '#3B82F6' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
