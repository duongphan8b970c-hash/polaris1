import { formatCurrency, formatDate } from '../../lib/utils'
import ResponsiveTable from '../common/ResponsiveTable'


export default function TransactionList({ transactions, onEdit }) {
  if (transactions.length === 0) {
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mô tả</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Danh mục</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ví</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Số tiền</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-20">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map(transaction => (
              <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatDate(transaction.date)}
                  </div>
                </td>

                <td className="px-4 py-3">
                  <div className="text-sm text-gray-900">
                    {transaction.description || '-'}
                  </div>
                </td>

                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    transaction.type === 'income'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {transaction.category?.name || '-'}
                  </span>
                </td>

                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {transaction.wallet?.name || '-'}
                  </div>
                </td>

                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <span className={`text-sm font-semibold ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatCurrency(transaction.amount, transaction.wallet?.currency)}
                  </span>
                </td>

                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <button
                    onClick={() => onEdit(transaction)}
                    className="p-1.5 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                    title="Sửa"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}