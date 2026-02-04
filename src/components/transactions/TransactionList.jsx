import { useMemo, useState } from 'react'

export default function TransactionList({ 
  transactions = [], 
  onEdit, 
  onDelete 
}) {
  const [expandedId, setExpandedId] = useState(null)

  // Safe filter with validation
  const displayTransactions = useMemo(() => {
    if (!Array.isArray(transactions)) {
      console.warn('TransactionList received non-array transactions:', transactions)
      return []
    }
    
    return transactions.filter(txn => {
      if (!txn || typeof txn !== 'object') return false
      if (txn.type !== 'transfer') return true
      return txn.amount < 0 // Only show withdrawal side of transfers
    })
  }, [transactions])

  if (displayTransactions.length === 0) {
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
      {/* Wrapper với overflow-x-auto */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {/* Fixed widths cho các cột */}
              <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                Ngày
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-28">
                Loại
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-40">
                Ví
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                Danh mục
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider max-w-xs">
                Mô tả
              </th>
              <th scope="col" className="px-3 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                Số tiền
              </th>
              <th scope="col" className="px-3 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayTransactions.map((txn) => {
              const isExpanded = expandedId === txn.id
              
              return (
                <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                  {/* Date - Compact format */}
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(txn.date).toLocaleDateString('vi-VN', { 
                      day: '2-digit', 
                      month: '2-digit' 
                    })}
                  </td>
                  
                  {/* Type Badge - Compact */}
                  <td className="px-3 py-4 whitespace-nowrap">
                    {txn.type === 'income' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        Thu
                      </span>
                    )}
                    {txn.type === 'expense' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                        </svg>
                        Chi
                      </span>
                    )}
                    {txn.type === 'transfer' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        CK
                      </span>
                    )}
                  </td>

                  {/* Wallet / Transfer Info - Truncate */}
                  <td className="px-3 py-4 text-sm max-w-[160px]">
                    {txn.type === 'transfer' ? (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-900 font-medium truncate" title={txn.wallets?.name}>
                          {txn.wallets?.name}
                        </span>
                        <svg className="w-3 h-3 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        <span className="text-gray-900 font-medium truncate" title={txn.to_wallet?.name}>
                          {txn.to_wallet?.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-900 truncate block" title={txn.wallets?.name}>
                        {txn.wallets?.name}
                      </span>
                    )}
                  </td>

                  {/* Category - Truncate */}
                  <td className="px-3 py-4 whitespace-nowrap text-sm">
                    {txn.categories ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs max-w-[120px]" title={txn.categories.name}>
                        <span className="flex-shrink-0">{txn.categories.icon}</span>
                        <span className="truncate">{txn.categories.name}</span>
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>

                  {/* Description - Expandable */}
                  <td className="px-3 py-4 text-sm text-gray-600 max-w-xs">
                    {txn.description ? (
                      <div>
                        <p 
                          className={`${!isExpanded ? 'truncate' : 'whitespace-pre-wrap break-words'} cursor-pointer hover:text-gray-900 transition-colors`}
                          onClick={() => setExpandedId(isExpanded ? null : txn.id)}
                          title={!isExpanded ? txn.description : ''}
                        >
                          {txn.description}
                        </p>
                        {txn.description.length > 50 && (
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : txn.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 mt-1 font-medium"
                          >
                            {isExpanded ? '↑ Thu gọn' : '↓ Xem thêm'}
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>

                  {/* Amount */}
                  <td className={`px-3 py-4 whitespace-nowrap text-sm font-semibold text-right ${
                    txn.amount > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {txn.amount > 0 && '+'}
                    {Math.abs(txn.amount).toLocaleString('vi-VN')}
                  </td>

                  {/* Actions - Icon buttons */}
                  <td className="px-3 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1">
                      {txn.type === 'transfer' ? (
                        <>
                          <span className="text-gray-400 text-xs italic mr-1">N/A</span>
                          {onDelete && (
                            <button
                              onClick={() => onDelete(txn)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Xóa"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          {onEdit && (
                            <button
                              onClick={() => onEdit(txn)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Sửa"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(txn)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Xóa"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Scroll hint cho mobile */}
      <div className="sm:hidden bg-gray-50 border-t px-4 py-2 text-center">
        <p className="text-xs text-gray-500 flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
          </svg>
          Vuốt sang trái để xem thêm
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </p>
      </div>
    </div>
  )
}