import { useMemo } from 'react'
import { formatNumber, formatDate, formatDateTime } from '../../utils'

export default function FinanceTab({ 
  wallets, 
  transactions, 
  trades, 
  tradePLConverted,
  updatingRates,
  updateResult,
  lastUpdated,
  formatLastUpdated,
  handleManualUpdate 
}) {
  
  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const totalBalance = wallets.reduce((sum, wallet) => sum + (wallet.balance_vnd || 0), 0)

    const monthlyTransactions = transactions.filter(txn => {
      const txnDate = new Date(txn.date)
      return txnDate.getMonth() === currentMonth && txnDate.getFullYear() === currentYear
    })

    const transactionIncome = monthlyTransactions
      .filter(txn => txn.type === 'income')
      .reduce((sum, txn) => sum + (txn.amount || 0), 0)

    const incomeCount = monthlyTransactions.filter(txn => txn.type === 'income').length

    const expense = monthlyTransactions
      .filter(txn => txn.type === 'expense')
      .reduce((sum, txn) => sum + Math.abs(txn.amount || 0), 0)

    const expenseCount = monthlyTransactions.filter(txn => txn.type === 'expense').length

    const monthlyClosedTrades = trades.filter(trade => {
      if (trade.status !== 'closed' || !trade.updated_at) return false
      const tradeDate = new Date(trade.updated_at)
      return tradeDate.getMonth() === currentMonth && tradeDate.getFullYear() === currentYear
    })

    const tradeCount = monthlyClosedTrades.length

    // Top Categories
    const categoryMap = {}
    monthlyTransactions
      .filter(txn => txn.type === 'expense' && txn.categories !== null)
      .forEach(txn => {
        const catName = txn.categories?.name || 'Khác'
        const catIcon = txn.categories?.icon || '📁'
        
        if (!categoryMap[catName]) {
          categoryMap[catName] = { 
            category: catName,
            icon: catIcon,
            amount: 0, 
            count: 0 
          }
        }
        categoryMap[catName].amount += Math.abs(txn.amount || 0)
        categoryMap[catName].count += 1
      })

    const topCategories = Object.values(categoryMap)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      
    const recentTransactions = transactions.slice(0, 10)

    return {
      totalBalance,
      walletCount: wallets.length,
      income: transactionIncome,
      incomeCount,
      expense,
      expenseCount,
      tradePL: 0,
      tradeCount,
      monthlyClosedTrades,
      topCategories,
      recentTransactions,
      transactionCount: incomeCount + expenseCount
    }
  }, [wallets, transactions, trades])

  const displayStats = {
    ...stats,
    tradePL: tradePLConverted,
    income: stats.income + (tradePLConverted > 0 ? tradePLConverted : 0)
  }

  return (
    <div className="space-y-6">
      {/* HEADER WITH MANUAL UPDATE */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tổng Quan Tài Chính</h2>
          <p className="text-gray-600 mt-1">Theo dõi thu chi và tài sản của bạn</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-600">Tỷ giá cập nhật</p>
            <p className="text-xs text-gray-500">{formatLastUpdated()}</p>
          </div>
          <button
            onClick={handleManualUpdate}
            disabled={updatingRates}
            className="btn btn-secondary flex items-center gap-2"
          >
            {updatingRates ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Đang cập nhật...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Cập nhật tỷ giá</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* UPDATE RESULT */}
      {updateResult && (
        <div className={`p-4 rounded-lg ${updateResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-center gap-2">
            {updateResult.success ? (
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <span>{updateResult.message}</span>
          </div>
        </div>
      )}

      {/* STATS CARDS - 6 cards, 3 per row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        
        {/* 1. Total Balance */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 md:p-6 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 md:p-3 bg-white/20 rounded-xl">
              <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div className="text-right">
              <p className="text-blue-100 text-xs font-medium uppercase">Tổng Tài Sản</p>
              <p className="text-blue-100 text-xs">{stats.walletCount} ví</p>
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-bold mb-1 break-words">
              +{formatNumber(displayStats.totalBalance)}
          </p>
          <p className="text-blue-100 text-sm font-medium">VND</p>
        </div>

        {/* 2. Income */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 md:p-6 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 md:p-3 bg-white/20 rounded-xl">
              <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="text-right">
              <p className="text-green-100 text-sm font-bold uppercase tracking-wider">Thu Nhập</p>
              <p className="text-green-200 text-xs mt-1">
                {displayStats.incomeCount} giao dịch
                {displayStats.tradePL > 0 && <><br/>+ {displayStats.tradeCount} trade</>}
              </p>
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-bold mb-1 break-words">
              +{formatNumber(displayStats.income)}
          </p>
          <p className="text-green-100 text-sm font-medium">
            VND tháng này {displayStats.tradePL > 0 && '(bao gồm trade)'}
          </p>
        </div>

        {/* 3. Expense */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-4 md:p-6 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 md:p-3 bg-white/20 rounded-xl">
              <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
            <div className="text-right">
              <p className="text-red-100 text-xs font-medium uppercase">Chi Tiêu</p>
              <p className="text-red-100 text-xs">{stats.expenseCount} giao dịch</p>
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-bold mb-1 break-words">
            -{formatNumber(displayStats.expense)}
          </p>
          <p className="text-red-100 text-sm font-medium">VND tháng này</p>
        </div>

        {/* 4. Trade P&L */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 md:p-6 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 md:p-3 bg-white/20 rounded-xl">
              <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <div className="text-right">
              <p className="text-purple-100 text-xs font-medium uppercase">Trade P&L</p>
              <p className="text-purple-100 text-xs">{displayStats.tradeCount} lệnh đóng</p>
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-bold mb-1 break-words">
            {displayStats.tradePL >= 0 ? '+' : ''}{formatNumber(Math.abs(displayStats.tradePL))}
          </p>
          <p className="text-purple-100 text-sm font-medium">VND tổng P&L</p>
        </div>

        {/* 5. Total Transactions */}
        <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl p-4 md:p-6 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 md:p-3 bg-white/20 rounded-xl">
              <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div className="text-right">
              <p className="text-cyan-100 text-xs font-medium uppercase">Giao Dịch</p>
              <p className="text-cyan-100 text-xs">Tháng này</p>
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-bold mb-1">
            {displayStats.transactionCount}
          </p>
          <p className="text-cyan-100 text-sm font-medium">
            {displayStats.incomeCount} thu / {stats.expenseCount} chi
          </p>
        </div>

        {/* 6. Savings Rate */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-4 md:p-6 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 md:p-3 bg-white/20 rounded-xl">
              <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            </div>
            <div className="text-right">
              <p className="text-amber-100 text-xs font-medium uppercase">Tỷ Lệ Tiết Kiệm</p>
              <p className="text-amber-100 text-xs">Savings Rate</p>
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-bold mb-1">
            {displayStats.income > 0 ? (((displayStats.income - displayStats.expense) / displayStats.income) * 100).toFixed(1) : '0.0'}%
          </p>
          <p className="text-amber-100 text-sm font-medium">
            {displayStats.income > 0 ? 'của thu nhập' : 'Chưa có dữ liệu'}
          </p>
        </div>
      </div>

      {/* TWO COLUMN LAYOUT: TOP CATEGORIES + RECENT TRANSACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* TOP CATEGORIES */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Top 5 Danh Mục Chi Tiêu
          </h3>

          {displayStats.topCategories.length > 0 ? (
            <div className="space-y-3">
              {displayStats.topCategories.map((cat, index) => {
                const percentage = displayStats.expense > 0 ? (cat.amount / displayStats.expense * 100) : 0
                
                return (
                  <div key={index} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                          index === 0 ? 'bg-gradient-to-br from-red-500 to-red-600' :
                          index === 1 ? 'bg-gradient-to-br from-orange-500 to-orange-600' :
                          index === 2 ? 'bg-gradient-to-br from-amber-500 to-amber-600' :
                          'bg-gradient-to-br from-gray-400 to-gray-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{cat.icon}</span>
                          <div>
                            <p className="font-semibold text-gray-900">{cat.category}</p>
                            <p className="text-xs text-gray-500">{cat.count} giao dịch</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">
                          -{formatNumber(cat.amount)} ₫
                        </p>
                        <p className="text-xs text-gray-500">{percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          index === 0 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                          index === 1 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                          index === 2 ? 'bg-gradient-to-r from-amber-500 to-amber-600' :
                          'bg-gradient-to-r from-gray-400 to-gray-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="font-medium">Chưa có dữ liệu chi tiêu</p>
            </div>
          )}
        </div>

        {/* RECENT TRANSACTIONS */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Giao Dịch Gần Đây
          </h3>
          {displayStats.recentTransactions.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {displayStats.recentTransactions.map((txn) => (
                <div key={txn.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${
                      txn.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      <svg className={`w-4 h-4 ${
                        txn.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
                          txn.type === 'income' 
                            ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                            : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                        } />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {txn.description || txn.categories || 'Không có mô tả'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDateTime(txn.date)}
                        {txn.categories && ` • ${txn.categories.name}`}
                      </p>
                    </div>
                  </div>
                  <p className={`font-bold text-sm flex-shrink-0 ml-2 ${
                    txn.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {txn.type === 'income' ? '+' : '-'}
                    {formatNumber(Math.abs(txn.amount))}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="font-medium">Chưa có giao dịch nào</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}