import { formatCurrency } from '../../lib/utils'
import ResponsiveTable from '../common/ResponsiveTable'

export default function TradeList({ trades, onEdit, onClose, onQuickClose }) {
  if (trades.length === 0) {
    return (
      <div className="card">
      <ResponsiveTable>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          {/* ... existing table code ... */}
        </table>
      </ResponsiveTable>
    </div>
    )
  }

  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Leverage</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Giá vào</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Số tiền</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Giá ra</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">P&L</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-28">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {trades.map(trade => (
              <tr key={trade.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm font-bold text-gray-900">{trade.symbol}</div>
                  <div className="text-xs text-gray-500">{trade.wallet?.name}</div>
                </td>

                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    trade.side === 'buy' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {trade.side === 'buy' ? '↑ BUY' : '↓ SELL'}
                  </span>
                </td>

                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                    {trade.leverage || 1}x
                  </span>
                </td>

                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <div className="text-sm text-gray-900">
                    {trade.entry_price?.toFixed(2) || '-'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {trade.entry_currency || 'USD'}
                  </div>
                </td>

                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {trade.amount ? formatCurrency(trade.amount, trade.exit_currency || trade.wallet?.currency) : '-'}
                  </div>
                </td>

                <td className="px-4 py-3 whitespace-nowrap text-right">
                  {trade.exit_price ? (
                    <>
                      <div className="text-sm text-gray-900">
                        {trade.exit_price.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {trade.exit_currency || trade.wallet?.currency || 'USD'}
                      </div>
                    </>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>

                <td className="px-4 py-3 whitespace-nowrap text-right">
                  {trade.profit_loss !== null && trade.profit_loss !== undefined ? (
                    <span className={`text-sm font-semibold ${
                      trade.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {trade.profit_loss >= 0 ? '+' : ''}
                      {formatCurrency(trade.profit_loss, trade.exit_currency || trade.wallet?.currency)}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>

                <td className="px-4 py-3 whitespace-nowrap text-center">
                  {trade.status === 'open' ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      Open
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      Closed
                    </span>
                  )}
                </td>

                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-1">
                    {trade.status === 'open' && (
                      <>
                        {onQuickClose && (
                          <button
                            onClick={() => onQuickClose(trade, 'win')}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Đánh dấu Win"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        )}
                        
                        {onQuickClose && (
                          <button
                            onClick={() => onQuickClose(trade, 'loss')}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Đánh dấu Loss"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                        
                        {onClose && (
                          <button
                            onClick={() => onClose(trade)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Đóng lệnh (nhập giá)"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </button>
                        )}
                      </>
                    )}
                    
                    <button
                      onClick={() => onEdit(trade)}
                      className="p-1.5 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                      title="Sửa"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}