import { formatCurrency } from '../../lib/utils'

export default function WalletList({ wallets, onEdit }) {
  if (wallets.length === 0) {
    return (
      <div className="card text-center py-12">
        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        <p className="text-gray-500">Chưa có ví nào</p>
      </div>
    )
  }

  // Get current month/year for display
  const currentDate = new Date()
  const currentMonthName = currentDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {wallets.map(wallet => {
        const snapshot = wallet.monthly_snapshot
        const hasMonthlyData = snapshot !== null
        
        // Monthly change calculation
        const monthChange = hasMonthlyData ? snapshot.month_change : 0
        const monthIncome = hasMonthlyData ? snapshot.total_income : 0
        const monthExpense = hasMonthlyData ? snapshot.total_expense : 0
        const openingBalance = hasMonthlyData ? snapshot.opening_balance : wallet.current_amount
        
        return (
          <div key={wallet.id} className="card hover:shadow-lg transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">{wallet.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-500">{wallet.type}</span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-sm text-gray-500">{wallet.currency}</span>
                </div>
              </div>
              <button
                onClick={() => onEdit(wallet)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
                title="Sửa ví"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>

            {/* Current Balance - Main Display */}
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-1">Số dư hiện tại</p>
              <p className="text-4xl font-bold text-gray-900">
                {formatCurrency(wallet.current_amount, wallet.currency)}
              </p>
            </div>

            {/* Monthly Change */}
            {hasMonthlyData && monthChange !== 0 && (
              <div className={`mb-4 p-3 rounded-lg ${
                monthChange >= 0 ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Thay đổi tháng này:</span>
                  <div className="flex items-center">
                    {monthChange >= 0 ? (
                      <svg className="w-4 h-4 text-green-600 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-red-600 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span className={`text-lg font-bold ${
                      monthChange >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {monthChange >= 0 ? '+' : ''}
                      {formatCurrency(monthChange, wallet.currency)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Monthly Details */}
            <div className="space-y-3 pt-4 border-t border-gray-200">
              {/* Opening Balance */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Đầu tháng ({currentMonthName.split(' ')[0]})</span>
                <span className="font-medium text-gray-700">
                  {formatCurrency(openingBalance, wallet.currency)}
                </span>
              </div>

              {/* Income/Expense this month */}
              {hasMonthlyData && (monthIncome > 0 || monthExpense > 0) && (
                <>
                  {monthIncome > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-green-600">↑ Thu nhập</span>
                      <span className="font-medium text-green-600">
                        +{formatCurrency(monthIncome, wallet.currency)}
                      </span>
                    </div>
                  )}
                  {monthExpense > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-red-600">↓ Chi tiêu</span>
                      <span className="font-medium text-red-600">
                        -{formatCurrency(monthExpense, wallet.currency)}
                      </span>
                    </div>
                  )}
                </>
              )}

              {/* Initial Balance - Reference Only */}
              <div className="flex justify-between items-center text-xs pt-2 border-t border-gray-100">
                <span className="text-gray-400">Số dư ban đầu (tham khảo)</span>
                <span className="text-gray-400">
                  {formatCurrency(wallet.initial_amount, wallet.currency)}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}