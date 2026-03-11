import { formatDate, formatNumber } from '../../utils'

export default function WalletHistoryTable({ transactions, wallet, onExport }) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="card text-center py-12">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-gray-500 font-medium">Chưa có giao dịch nào</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Export button */}
      <div className="flex justify-end">
        <button
          onClick={onExport}
          className="btn btn-secondary"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Ngày</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Loại</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Mô tả</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Số dư trước</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Thay đổi</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Số dư sau</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((txn, index) => (
                <TransactionRow
                  key={txn.id}
                  transaction={txn}
                  wallet={wallet}
                  isFirst={index === 0}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function TransactionRow({ transaction: txn, wallet, isFirst }) {
  const isInflow = txn.balance_change > 0
  const isOutflow = txn.balance_change < 0

  // Get transaction description
  const getDescription = () => {
    if (txn.description) return txn.description
    
    if (txn.type === 'transfer') {
      if (txn.wallet_id === wallet.id) {
        return `Chuyển đến ${txn.to_wallet?.name || 'ví khác'}`
      } else {
        return `Nhận từ ví khác`
      }
    }
    
    return txn.categories?.name || 'Không có mô tả'
  }

  // Type badge
  const getTypeBadge = () => {
    if (txn.type === 'income') {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Thu nhập</span>
    }
    if (txn.type === 'expense') {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">Chi tiêu</span>
    }
    if (txn.type === 'transfer') {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">Chuyển khoản</span>
    }
  }

  return (
    <tr className={`hover:bg-gray-50 transition-colors ${isFirst ? 'bg-blue-50' : ''}`}>
      {/* Date */}
      <td className="px-4 py-3 whitespace-nowrap text-sm">
        <div className="text-gray-900 font-medium">{formatDate(txn.date)}</div>
        <div className="text-gray-500 text-xs">{txn.time || '00:00'}</div>
      </td>

      {/* Type */}
      <td className="px-4 py-3 whitespace-nowrap text-sm">
        {getTypeBadge()}
      </td>

      {/* Description */}
      <td className="px-4 py-3 text-sm">
        <div className="text-gray-900">{getDescription()}</div>
        {txn.categories && (
          <div className="text-gray-500 text-xs mt-1">
            {txn.categories.icon} {txn.categories.name}
          </div>
        )}
        {txn.payback_goals && (
          <div className="text-orange-600 text-xs mt-1">
            🎯 {txn.payback_goals.name}
          </div>
        )}
        {/* ✅ Show exchange rate for transfers */}
        {txn.type === 'transfer' && txn.exchange_rate && (
          <div className="text-blue-600 text-xs mt-1 font-medium">
            💱 Tỷ giá: {parseFloat(txn.exchange_rate).toLocaleString()}
          </div>
        )}
      </td>

      {/* Balance Before */}
      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
        {formatNumber(txn.balance_before)} {wallet.currency}
      </td>

      {/* Change */}
      <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-semibold ${
        isInflow ? 'text-green-600' : isOutflow ? 'text-red-600' : 'text-gray-600'
      }`}>
        {isInflow && '+'}{formatNumber(txn.balance_change)} {wallet.currency}
      </td>

      {/* Balance After */}
      <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-bold ${
        isFirst ? 'text-blue-600' : 'text-gray-900'
      }`}>
        {formatNumber(txn.balance_after)} {wallet.currency}
        {isFirst && <span className="ml-1 text-xs text-blue-500">(Hiện tại)</span>}
      </td>
    </tr>
  )
}