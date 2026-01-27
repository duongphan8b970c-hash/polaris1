import { useState,useMemo } from 'react'
import { useWallets } from '../hooks/useWallets'
import { useTransactions } from '../hooks/useTransactions'
import { useTrades } from '../hooks/useTrades'
import { useBudgets } from '../hooks/useBudgets'
import PageHeader from '../components/layout/PageHeader'
import Loading from '../components/common/Loading'

export default function Dashboard() {
  const { wallets, loading: walletsLoading } = useWallets()
  const { transactions, loading: transactionsLoading } = useTransactions()
  const { trades, loading: tradesLoading } = useTrades()
  const { budgets, loading: budgetsLoading } = useBudgets()
  // ADD THESE NEW STATES:
  const [updatingRates, setUpdatingRates] = useState(false)
  const [updateResult, setUpdateResult] = useState(null)

  const loading = walletsLoading || transactionsLoading || tradesLoading || budgetsLoading

  // Calculate total balance
  const totalBalance = useMemo(() => {
    return wallets.reduce((sum, wallet) => sum + (wallet.balance_vnd || 0), 0)
  }, [wallets])

  // Get current month transactions
  const monthlyTransactions = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    return transactions.filter(tx => {
      const txDate = new Date(tx.date)
      return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear
    })
  }, [transactions])

  // Calculate monthly income
  const monthlyIncome = useMemo(() => {
    return monthlyTransactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0)
  }, [monthlyTransactions])

  // Calculate monthly expense
  const monthlyExpense = useMemo(() => {
    return monthlyTransactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0)
  }, [monthlyTransactions])

  // Calculate total trade P&L
  const totalTradePL = useMemo(() => {
    return trades
      .filter(t => t.status === 'closed')
      .reduce((sum, t) => sum + (t.profit_loss || 0), 0)
  }, [trades])

  // Get recent transactions (last 10)
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10)
  }, [transactions])

  // Top spending categories
  const topCategories = useMemo(() => {
    const categoryMap = {}
    
    monthlyTransactions
      .filter(tx => tx.type === 'expense')
      .forEach(tx => {
        const catName = tx.category?.name || 'Khác'
        const catIcon = tx.category?.icon || '📁'
        if (!categoryMap[catName]) {
          categoryMap[catName] = { name: catName, icon: catIcon, amount: 0 }
        }
        categoryMap[catName].amount += tx.amount
      })

    return Object.values(categoryMap)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
  }, [monthlyTransactions])

    // Function to manually update exchange rates
const handleManualUpdate = async () => {
  if (!window.confirm('Cập nhật tỷ giá ngay bây giờ?')) return
  
  setUpdatingRates(true)
  setUpdateResult(null)
  
  try {
    console.log('🔄 Calling update-rates API...')
    
    const response = await fetch('/api/update-rates', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer db5d50fd8d3e81bc2d4fbcf3642ff0a4d0f6b013eca79e32744e2eb37e0ad1b6',
        'Content-Type': 'application/json'
      }
    })
    
    const data = await response.json()
    console.log('Response:', data)
    
    if (response.ok && data.success) {
      setUpdateResult({ 
        success: true, 
        message: `✅ Đã cập nhật ${data.updated_currencies} tỷ giá thành công!` 
      })
      
      // Reload page after 2 seconds to show new data
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } else {
      setUpdateResult({ 
        success: false, 
        message: `❌ Lỗi: ${data.error || 'Không thể cập nhật'}` 
      })
    }
  } catch (error) {
    console.error('Error updating rates:', error)
    setUpdateResult({ 
      success: false, 
      message: `❌ Lỗi: ${error.message}` 
    })
  } finally {
    setUpdatingRates(false)
  }
}

  if (loading) {
    return <Loading message="Đang tải dashboard..." />
  }

  return (
    <div>
      <PageHeader 
        title="Dashboard" 
        subtitle="Tổng quan tài chính của bạn"
      />
      <div className="space-y-6">
    {/* ADD THIS SECTION - Manual Update Button */}
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600 mt-1">Tổng quan tài chính của bạn</p>
      </div>
      
      <button
        onClick={handleManualUpdate}
        disabled={updatingRates}
        className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {updatingRates ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Đang cập nhật...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Cập nhật tỷ giá
          </>
        )}
      </button>
    </div>
    
    {/* Success/Error Message */}
    {updateResult && (
      <div className={`p-4 rounded-xl font-medium animate-fade-in ${
        updateResult.success 
          ? 'bg-green-50 text-green-800 border-2 border-green-200' 
          : 'bg-red-50 text-red-800 border-2 border-red-200'
      }`}>
        {updateResult.message}
      </div>
    )}
    </div>
      {/* MODERN STAT CARDS - UPDATED */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
        {/* Total Balance - Blue Theme */}
        <div className="relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-bl-full opacity-10 group-hover:opacity-20 transition-opacity"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tổng tài sản</p>
                  <p className="text-xs text-blue-600 font-medium mt-0.5">{wallets.length} ví</p>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-gray-900 tracking-tight">
                {totalBalance.toLocaleString('vi-VN')}
              </p>
              <p className="text-sm font-semibold text-gray-500">VND</p>
            </div>
          </div>
          <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
        </div>

        {/* Monthly Income - Green Theme */}
        <div className="relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-bl-full opacity-10 group-hover:opacity-20 transition-opacity"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Thu nhập</p>
                  <p className="text-xs text-green-600 font-medium mt-0.5">
                    {monthlyTransactions.filter(t => t.type === 'income').length} giao dịch
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-green-600 tracking-tight">
                +{monthlyIncome.toLocaleString('vi-VN')}
              </p>
              <p className="text-sm font-semibold text-gray-500">VND tháng này</p>
            </div>
          </div>
          <div className="h-1 bg-gradient-to-r from-green-500 to-green-600"></div>
        </div>

        {/* Monthly Expense - Red Theme */}
        <div className="relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-400 to-red-600 rounded-bl-full opacity-10 group-hover:opacity-20 transition-opacity"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Chi tiêu</p>
                  <p className="text-xs text-red-600 font-medium mt-0.5">
                    {monthlyTransactions.filter(t => t.type === 'expense').length} giao dịch
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-red-600 tracking-tight">
                -{monthlyExpense.toLocaleString('vi-VN')}
              </p>
              <p className="text-sm font-semibold text-gray-500">VND tháng này</p>
            </div>
          </div>
          <div className="h-1 bg-gradient-to-r from-red-500 to-red-600"></div>
        </div>

        {/* Trade P&L - Purple/Orange Theme */}
        <div className="relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group">
          <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${
            totalTradePL >= 0 ? 'from-purple-400 to-purple-600' : 'from-orange-400 to-orange-600'
          } rounded-bl-full opacity-10 group-hover:opacity-20 transition-opacity`}></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 bg-gradient-to-br ${
                  totalTradePL >= 0 ? 'from-purple-500 to-purple-600' : 'from-orange-500 to-orange-600'
                } rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform`}>
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Trade P&L</p>
                  <p className={`text-xs font-medium mt-0.5 ${
                    totalTradePL >= 0 ? 'text-purple-600' : 'text-orange-600'
                  }`}>
                    {trades.filter(t => t.status === 'closed').length} lệnh đóng
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <p className={`text-3xl font-bold tracking-tight ${
                totalTradePL >= 0 ? 'text-purple-600' : 'text-orange-600'
              }`}>
                {totalTradePL >= 0 ? '+' : ''}{totalTradePL.toLocaleString('vi-VN')}
              </p>
              <p className="text-sm font-semibold text-gray-500">VND tổng P&L</p>
            </div>
          </div>
          <div className={`h-1 bg-gradient-to-r ${
            totalTradePL >= 0 ? 'from-purple-500 to-purple-600' : 'from-orange-500 to-orange-600'
          }`}></div>
        </div>
      </div>
      
      {/* KEEP TWO COLUMN LAYOUT AS IS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recent Transactions */}
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Giao dịch gần đây</h3>
          {recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      tx.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      <span className="text-xl">{tx.category?.icon || '📁'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {tx.category?.name || 'Khác'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(tx.date).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                  <p className={`text-sm font-bold ${
                    tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString('vi-VN')} ₫
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">Chưa có giao dịch nào</p>
          )}
        </div>

        {/* Top Spending Categories */}
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Top chi tiêu tháng này</h3>
          {topCategories.length > 0 ? (
            <div className="space-y-3">
              {topCategories.map((cat, index) => (
                <div key={cat.name} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-lg">
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{cat.name}</p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-red-500 h-2 rounded-full" 
                          style={{ width: `${monthlyExpense > 0 ? (cat.amount / monthlyExpense) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-red-600 ml-4">
                    {cat.amount.toLocaleString('vi-VN')} ₫
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">Chưa có chi tiêu nào</p>
          )}
        </div>
      </div>

      {/* Wallet List Section */}
<div className="card">
  <h3 className="text-lg font-bold text-gray-900 mb-4">Danh sách ví</h3>
  {wallets.length > 0 ? (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {wallets.map(wallet => (
        <div 
          key={wallet.id} 
          className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900 truncate">
              {wallet.name}
            </h4>
            <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-lg">
              {wallet.currency}
            </span>
          </div>
          
          {/* Original amount in wallet's currency */}
          <p className="text-xl font-bold text-gray-900">
            {(wallet.current_amount || 0).toLocaleString('vi-VN')} {wallet.currency}
          </p>
          
          {/* VND equivalent if different currency */}
          {wallet.currency !== 'VND' && wallet.balance_vnd && (
            <p className="text-sm text-gray-500 mt-1">
              ≈ {(wallet.balance_vnd || 0).toLocaleString('vi-VN')} VND
            </p>
          )}
          
          <p className="text-xs text-gray-500 mt-2">{wallet.type}</p>
        </div>
      ))}
    </div>
  ) : (
    <p className="text-center text-gray-500 py-8">Chưa có ví nào</p>
  )}
</div>
    </div>
  )
}