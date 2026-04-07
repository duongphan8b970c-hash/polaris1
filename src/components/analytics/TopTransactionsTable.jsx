import { formatNumber, formatDate } from '../../utils'

/**
 * Table showing top 10 largest transactions in the selected month
 */
export default function TopTransactionsTable({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    )
  }

  const hasData = data?.length > 0

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
        🏅 Top 10 Giao Dịch Lớn Nhất
      </h3>
      <p className="text-xs text-gray-500 mb-4">Các giao dịch có giá trị cao nhất trong tháng (sắp xếp theo số tiền giảm dần)</p>

      {!hasData ? (
        <div className="text-center py-10 text-gray-400">
          <p className="text-4xl mb-2">📭</p>
          <p className="font-medium">Chưa có giao dịch trong tháng này</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 text-xs">
                <th className="text-left pb-2 font-medium w-8">#</th>
                <th className="text-left pb-2 font-medium">Mô tả</th>
                <th className="text-left pb-2 font-medium hidden sm:table-cell">Danh mục</th>
                <th className="text-left pb-2 font-medium hidden md:table-cell">Ngày</th>
                <th className="text-right pb-2 font-medium">Số tiền</th>
              </tr>
            </thead>
            <tbody>
              {data.map((txn, i) => {
                const isIncome = txn.type === 'income'
                const description = txn.description
                  || (txn.categories?.name)
                  || (isIncome ? 'Thu nhập' : 'Chi tiêu')

                return (
                  <tr
                    key={txn.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-2.5 text-gray-400 font-bold text-xs">{i + 1}</td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isIncome ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          <span className="text-xs">{isIncome ? '↑' : '↓'}</span>
                        </div>
                        <span className="text-gray-800 truncate max-w-[160px] md:max-w-[240px]" title={description}>
                          {description}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 hidden sm:table-cell">
                      {txn.categories ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {txn.categories.icon && <span>{txn.categories.icon}</span>}
                          {txn.categories.name}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-2.5 text-gray-400 text-xs hidden md:table-cell">
                      {txn.date ? formatDate(txn.date) : '—'}
                    </td>
                    <td className={`py-2.5 text-right font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                      {isIncome ? '+' : '-'}{formatNumber(Math.abs(txn.amount || 0))} ₫
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
