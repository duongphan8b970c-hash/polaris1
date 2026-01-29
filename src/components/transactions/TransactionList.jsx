import { useMemo } from 'react'

export default function TransactionList({ transactions, onEdit, onDelete }) {
  // Filter transfers - show only withdrawals (negative amounts)
  const displayTransactions = useMemo(() => {
    return transactions.filter(txn => {
      if (txn.type !== 'transfer') return true
      return txn.amount < 0 // Only show withdrawal side of transfers
    })
  }, [transactions])

  if (!displayTransactions || displayTransactions.length === 0) {
    return (
      <div className="card text-center py-12">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-gray-500 font-medium">Chưa có giao dịch nào</p>
        <p className="text-gray-400 text-sm mt-1">Thêm giao dịch đầu tiên của bạn</p>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Ngày
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Loại
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Ví / Chuyển khoản
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Danh mục
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Mô tả
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Số tiền
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayTransactions.map((txn) => (
              <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                {/* Date */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {new Date(txn.date).toLocaleDateString('vi-VN')}
                </td>
                
                {/* Type Badge */}
                <td className="px-6 py-4 whitespace-nowrap">
                  {txn.type === 'income' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      Thu nhập
                    </span>
                  )}
                  {txn.type === 'expense' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                      </svg>
                      Chi tiêu
                    </span>
                  )}
                  {txn.type === 'transfer' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      Chuyển khoản
                    </span>
                  )}
                </td>

                {/* Wallet / Transfer Info */}
                <td className="px-6 py-4 text-sm">
                  {txn.type === 'transfer' ? (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 font-medium">
                        {txn.wallets?.name}
                      </span>
                      <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      <span className="text-gray-900 font-medium">
                        {txn.to_wallet?.name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-900">
                      {txn.wallets?.name}
                    </span>
                  )}
                </td>

                {/* Category */}
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {txn.categories ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      <span>{txn.categories.icon}</span>
                      <span>{txn.categories.name}</span>
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">-</span>
                  )}
                </td>

                {/* Description */}
                <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                  {txn.description || '-'}
                </td>

                {/* Amount */}
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold text-right ${
                  txn.amount > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {txn.amount > 0 && '+'}
                  {txn.amount.toLocaleString('vi-VN')} {txn.wallets?.currency || 'VND'}
                </td>

                {/* Actions */}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <div className="flex items-center justify-end gap-3">
                    {txn.type === 'transfer' ? (
                      <>
                        <span className="text-gray-400 text-xs italic">
                          Không thể sửa
                        </span>
                        {onDelete && (
                          <button
                            onClick={() => onDelete(txn)}
                            className="text-red-600 hover:text-red-800 font-medium transition-colors"
                          >
                            Xóa
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        {onEdit && (
                          <button
                            onClick={() => onEdit(txn)}
                            className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                          >
                            Sửa
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(txn)}
                            className="text-red-600 hover:text-red-800 font-medium transition-colors"
                          >
                            Xóa
                          </button>
                        )}
                      </>
                    )}
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