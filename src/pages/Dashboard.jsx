import { useState, useMemo, useEffect } from 'react'
import { useWallets } from '../hooks/useWallets'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const { wallets, loading: walletsLoading } = useWallets()
  
  const [transactions, setTransactions] = useState([])
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingRates, setUpdatingRates] = useState(false)
  const [updateResult, setUpdateResult] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: txnData } = await supabase
        .from('financial_transactions')
        .select('*')
        .order('date', { ascending: false })

      setTransactions(txnData || [])

      const { data: tradeData } = await supabase
        .from('trades')
        .select('*')
        .order('created_at', { ascending: false })

      setTrades(tradeData || [])

      const { data: rateData } = await supabase
        .from('exchange_rates')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      if (rateData) {
        setLastUpdated(rateData.updated_at)
      }

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatLastUpdated = () => {
    if (!lastUpdated) return 'Chưa cập nhật'
    
    const date = new Date(lastUpdated)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    
    if (diffMins < 1) return 'vừa xong'
    if (diffMins < 60) return `${diffMins} phút trước`
    if (diffHours < 24) return `${diffHours} giờ trước`
    
    return date.toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleManualUpdate = async () => {
    if (!window.confirm('Cập nhật tỷ giá ngay bây giờ?')) return
    
    setUpdatingRates(true)
    setUpdateResult(null)
    
    try {
      const response = await fetch('/api/update-rates', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer db5d50fd8d3e81bc2d4fbcf3642ff0a4d0f6b013eca79e32744e2eb37e0ad1b6'
        }
      })
      
      const contentType = response.headers.get('content-type')
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('Non-JSON response:', text.substring(0, 300))
        
        setUpdateResult({
          success: false,
          message: '❌ Server error'
        })
        return
      }
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }
      
      if (data.success) {
        setUpdateResult({
          success: true,
          message: `✅ Đã cập nhật ${data.updated_currencies} tỷ giá!`
        })
        
        await fetchData()
        
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        setUpdateResult({
          success: false,
          message: `❌ ${data.error || 'Lỗi'}`
        })
      }
      
    } catch (error) {
      setUpdateResult({
        success: false,
        message: `❌ ${error.message}`
      })
    } finally {
      setUpdatingRates(false)
    }
  }

  // Calculate statistics
  const stats = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    // Total balance
    const totalBalance = wallets.reduce((sum, wallet) => sum + (wallet.balance_vnd || 0), 0)

    // Filter transactions for current month
    const monthlyTransactions = transactions.filter(txn => {
      const txnDate = new Date(txn.date)
      return txnDate.getMonth() === currentMonth && txnDate.getFullYear() === currentYear
    })

    // Calculate income
    const income = monthlyTransactions
      .filter(txn => txn.type === 'income')
      .reduce((sum, txn) => sum + (txn.amount || 0), 0)

    const incomeCount = monthlyTransactions.filter(txn => txn.type === 'income').length

    // Calculate expense
    const expense = monthlyTransactions
      .filter(txn => txn.type === 'expense')
      .reduce((sum, txn) => sum + Math.abs(txn.amount || 0), 0)

    const expenseCount = monthlyTransactions.filter(txn => txn.type === 'expense').length

    // Calculate trade P&L
    const closedTrades = trades.filter(trade => trade.status === 'closed')
    const tradePL = closedTrades.reduce((sum, trade) => sum + (trade.profit_loss || 0), 0)
    const tradeCount = closedTrades.length

    // ✅ TOP CATEGORIES - Group by category
  const categoryMap = {}
  monthlyTransactions
    .filter(txn => txn.type === 'expense' && txn.category) // Only expense with category
    .forEach(txn => {
      const cat = txn.category
      if (!categoryMap[cat]) {
        categoryMap[cat] = { 
          category: cat, 
          amount: 0, 
          count: 0 
        }
      }
      // Add absolute value of amount
      categoryMap[cat].amount += Math.abs(txn.amount || 0)
      categoryMap[cat].count += 1
    })

  // Sort by amount descending, take top 5
  const topCategories = Object.values(categoryMap)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)

  // Debug log
  console.log('📊 Dashboard Stats:', {
    totalTransactions: transactions.length,
    monthlyTransactions: monthlyTransactions.length,
    expenseTransactions: monthlyTransactions.filter(t => t.type === 'expense').length,
    topCategories: topCategories,
    categoryMap: categoryMap
  })
    
    // Recent transactions
    const recentTransactions = transactions.slice(0, 10)

    return {
      totalBalance,
      walletCount: wallets.length,
      income,
      incomeCount,
      expense,
      expenseCount,
      tradePL,
      tradeCount,
      topCategories,
      recentTransactions,
      transactionCount: incomeCount + expenseCount
    }
  }, [wallets, transactions, trades])

  if (loading || walletsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Tổng quan tài chính của bạn</p>
          
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Tỷ giá cập nhật: {formatLastUpdated()}</span>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={handleManualUpdate}
            disabled={updatingRates}
            className="group px-4 py-2.5 bg-white border-2 border-blue-200 text-blue-700 rounded-xl hover:border-blue-400 hover:bg-blue-50 font-medium text-sm transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {updatingRates ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Đang cập nhật...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Cập nhật tỷ giá</span>
              </>
            )}
          </button>
          
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-medium">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            <span>Tự động mỗi ngày 3 PM</span>
          </div>
        </div>
      </div>
      
      {/* Success/Error Message */}
      {updateResult && (
        <div className={`p-4 rounded-xl font-medium shadow-md border-l-4 ${
          updateResult.success 
            ? 'bg-green-50 text-green-800 border-green-500' 
            : 'bg-red-50 text-red-800 border-red-500'
        }`}>
          <div className="flex items-center gap-2">
            {updateResult.success ? (
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <span>{updateResult.message}</span>
          </div>
        </div>
      )}

      {/* STATS CARDS - 6 cards, 3 per row on large screens */}
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
      {stats.totalBalance.toLocaleString('vi-VN')}
    </p>
    <p className="text-blue-100 text-sm font-medium">VND</p>
  </div>

  {/* 2. Income */}
  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 md:p-6 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
    <div className="flex items-center justify-between mb-3">
      <div className="p-2 md:p-3 bg-white/20 rounded-xl">
        <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      </div>
      <div className="text-right">
        <p className="text-green-100 text-xs font-medium uppercase">Thu Nhập</p>
        <p className="text-green-100 text-xs">{stats.incomeCount} giao dịch</p>
      </div>
    </div>
    <p className="text-2xl md:text-3xl font-bold mb-1 break-words">
      +{stats.income.toLocaleString('vi-VN')}
    </p>
    <p className="text-green-100 text-sm font-medium">VND tháng này</p>
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
      -{stats.expense.toLocaleString('vi-VN')}
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
        <p className="text-purple-100 text-xs">{stats.tradeCount} lệnh đóng</p>
      </div>
    </div>
    <p className="text-2xl md:text-3xl font-bold mb-1 break-words">
      {stats.tradePL >= 0 ? '+' : ''}{stats.tradePL.toLocaleString('vi-VN')}
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
      {stats.transactionCount}
    </p>
    <p className="text-cyan-100 text-sm font-medium">
      {stats.incomeCount} thu / {stats.expenseCount} chi
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
      {stats.income > 0 ? (((stats.income - stats.expense) / stats.income) * 100).toFixed(1) : '0.0'}%
    </p>
    <p className="text-amber-100 text-sm font-medium">
      {stats.income > 0 ? 'của thu nhập' : 'Chưa có dữ liệu'}
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
  {stats.topCategories.length > 0 ? (
    <div className="space-y-3">
      {stats.topCategories.map((cat, index) => {
        const percentage = stats.expense > 0 ? (cat.amount / stats.expense * 100) : 0
        
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
                <div>
                  <p className="font-semibold text-gray-900">{cat.category}</p>
                  <p className="text-xs text-gray-500">{cat.count} giao dịch</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-red-600">
                  -{cat.amount.toLocaleString('vi-VN')} ₫
                </p>
                <p className="text-xs text-gray-500">{percentage.toFixed(1)}%</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  index === 0 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                  index === 1 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                  index === 2 ? 'bg-gradient-to-r from-amber-500 to-amber-600' :
                  'bg-gradient-to-r from-gray-400 to-gray-500'
                }`}
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>
        )
      })}
    </div>
  ) : (
    <div className="text-center py-8 text-gray-500">
      <svg className="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <p className="text-sm font-medium">Chưa có dữ liệu chi tiêu</p>
      <p className="text-xs mt-1">Thêm giao dịch chi tiêu để xem thống kê</p>
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
          {stats.recentTransactions.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {stats.recentTransactions.map((txn) => (
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
                        {txn.description || 'Không có mô tả'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(txn.date).toLocaleDateString('vi-VN')}
                        {txn.category && ` • ${txn.category}`}
                      </p>
                    </div>
                  </div>
                  <p className={`font-bold text-sm flex-shrink-0 ml-2 ${
                    txn.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {txn.type === 'income' ? '+' : '-'}
                    {Math.abs(txn.amount).toLocaleString('vi-VN')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm">Chưa có giao dịch nào</p>
            </div>
          )}
        </div>

      </div>

      {/* INFO BOX */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 md:p-6 border-2 border-gray-200">
        <div className="flex items-center gap-3 text-gray-700">
          <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-medium">
            Tất cả số liệu được tính tự động từ dữ liệu thực tế. 
            Tỷ giá được cập nhật tự động mỗi ngày lúc 3 PM (GMT+7).
          </p>
        </div>
      </div>

    </div>
  )
}