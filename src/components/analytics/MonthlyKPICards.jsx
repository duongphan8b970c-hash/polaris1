import { formatNumber } from '../../utils'

const COLORS = {
  income: '#10B981',
  expense: '#EF4444',
  balance: '#3B82F6',
  savings: '#F59E0B',
  transactions: '#06B6D4',
  topCategory: '#8B5CF6',
}

/**
 * KPI summary cards for the selected month
 */
export default function MonthlyKPICards({ kpiData, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm animate-pulse">
            <div className="h-3 bg-gray-200 rounded mb-3 w-2/3" />
            <div className="h-6 bg-gray-200 rounded mb-2" />
            <div className="h-2 bg-gray-100 rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  if (!kpiData) return null

  const { income, expense, balance, savingsRate, transactionCount, topCategory } = kpiData

  const cards = [
    {
      label: 'Tổng Thu Nhập',
      value: `+${formatNumber(income)} ₫`,
      sub: 'tháng này',
      color: COLORS.income,
      bg: 'bg-green-50',
      textColor: 'text-green-700',
      icon: '📈',
    },
    {
      label: 'Tổng Chi Tiêu',
      value: `-${formatNumber(expense)} ₫`,
      sub: 'tháng này',
      color: COLORS.expense,
      bg: 'bg-red-50',
      textColor: 'text-red-700',
      icon: '📉',
    },
    {
      label: 'Số Dư Còn Lại',
      value: `${balance >= 0 ? '+' : ''}${formatNumber(balance)} ₫`,
      sub: 'Thu - Chi',
      color: COLORS.balance,
      bg: balance >= 0 ? 'bg-blue-50' : 'bg-red-50',
      textColor: balance >= 0 ? 'text-blue-700' : 'text-red-700',
      icon: balance >= 0 ? '💰' : '⚠️',
    },
    {
      label: 'Tỷ Lệ Tiết Kiệm',
      value: `${savingsRate.toFixed(1)}%`,
      sub: income > 0 ? 'của thu nhập' : 'Chưa có dữ liệu',
      color: COLORS.savings,
      bg: savingsRate >= 20 ? 'bg-amber-50' : 'bg-gray-50',
      textColor: savingsRate >= 20 ? 'text-amber-700' : 'text-gray-600',
      icon: '🎯',
    },
    {
      label: 'Số Giao Dịch',
      value: transactionCount,
      sub: 'giao dịch hợp lệ',
      color: COLORS.transactions,
      bg: 'bg-cyan-50',
      textColor: 'text-cyan-700',
      icon: '📋',
    },
    {
      label: 'Chi Tiêu Lớn Nhất',
      value: topCategory ? `${topCategory.icon} ${topCategory.name}` : 'Chưa có',
      sub: topCategory ? `-${formatNumber(topCategory.amount)} ₫` : '',
      color: COLORS.topCategory,
      bg: 'bg-purple-50',
      textColor: 'text-purple-700',
      icon: '🏆',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
      {cards.map((card, i) => (
        <div
          key={i}
          className={`${card.bg} rounded-xl p-4 shadow-sm border border-white hover:shadow-md transition-shadow`}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide leading-tight">{card.label}</p>
            <span className="text-lg">{card.icon}</span>
          </div>
          <p className={`text-base font-bold ${card.textColor} break-words leading-tight mb-1`}>
            {card.value}
          </p>
          {card.sub && (
            <p className="text-xs text-gray-400">{card.sub}</p>
          )}
        </div>
      ))}
    </div>
  )
}
