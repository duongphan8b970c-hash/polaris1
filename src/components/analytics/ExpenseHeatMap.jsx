import { formatNumber } from '../../utils'

/**
 * Returns a color from light blue to dark red based on relative expense amount
 */
function getHeatColor(amount, maxAmount) {
  if (!amount || maxAmount === 0) return { bg: 'bg-gray-100', text: 'text-gray-300' }
  const ratio = amount / maxAmount
  if (ratio < 0.2) return { bg: 'bg-blue-100', text: 'text-blue-800' }
  if (ratio < 0.4) return { bg: 'bg-yellow-100', text: 'text-yellow-800' }
  if (ratio < 0.6) return { bg: 'bg-orange-200', text: 'text-orange-800' }
  if (ratio < 0.8) return { bg: 'bg-red-300', text: 'text-red-900' }
  return { bg: 'bg-red-500', text: 'text-white' }
}

const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

/**
 * Calendar heat map showing daily expense intensity for the selected month
 */
export default function ExpenseHeatMap({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-1/2 mb-4" />
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  const { heatmap, daysInMonth, firstDayOfWeek } = data
  const maxAmount = Math.max(...Object.values(heatmap))
  const hasData = maxAmount > 0

  // Build calendar grid (leading empty cells + day cells)
  const calendarCells = []
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarCells.push({ day: null, amount: 0 })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push({ day: d, amount: heatmap[d] || 0 })
  }
  // Pad to multiple of 7
  while (calendarCells.length % 7 !== 0) {
    calendarCells.push({ day: null, amount: 0 })
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
        🗓️ Lịch Chi Tiêu Theo Ngày
      </h3>
      <p className="text-xs text-gray-500 mb-4">Màu càng đậm = chi tiêu càng nhiều</p>

      {!hasData && (
        <p className="text-gray-400 text-sm text-center py-4">Không có chi tiêu trong tháng này</p>
      )}

      {/* Day header */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Calendar cells */}
      <div className="grid grid-cols-7 gap-1">
        {calendarCells.map((cell, i) => {
          if (!cell.day) return <div key={i} className="h-10 rounded" />
          const { bg, text } = getHeatColor(cell.amount, maxAmount)
          return (
            <div
              key={i}
              title={cell.amount > 0 ? `Ngày ${cell.day}: -${formatNumber(cell.amount)} ₫` : `Ngày ${cell.day}`}
              className={`h-10 rounded flex flex-col items-center justify-center cursor-default transition-all hover:opacity-80 ${bg}`}
            >
              <span className={`text-xs font-bold ${text}`}>{cell.day}</span>
              {cell.amount > 0 && (
                <span className={`text-[9px] leading-none ${text} opacity-80`}>
                  {cell.amount >= 1000000
                    ? `${(cell.amount / 1000000).toFixed(1)}M`
                    : `${Math.round(cell.amount / 1000)}K`}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 justify-end">
        <span className="text-xs text-gray-400">Ít</span>
        {['bg-gray-100', 'bg-blue-100', 'bg-yellow-100', 'bg-orange-200', 'bg-red-300', 'bg-red-500'].map((bg, i) => (
          <div key={i} className={`w-5 h-5 rounded ${bg} border border-gray-200`} />
        ))}
        <span className="text-xs text-gray-400">Nhiều</span>
      </div>
    </div>
  )
}
