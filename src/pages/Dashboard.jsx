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
      // Fetch financial transactions
      const { data: txnData } = await supabase
        .from('financial_transactions')
        .select('*')
        .order('date', { ascending: false })

      setTransactions(txnData || [])

      // Fetch trades
      const { data: tradeData } = await supabase
        .from('trades')
        .select('*')
        .order('created_at', { ascending: false })

      setTrades(tradeData || [])

      // Fetch last exchange rate update time
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
          message: '❌ Server error - check logs'
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
          message: `✅ Đã cập nhật ${data.updated_currencies} tỷ giá thành công!`
        })
        
        await fetchData()
        
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        setUpdateResult({
          success: false,
          message: `❌ ${data.error || 'Không thể cập nhật'}`
        })
      }
      
    } catch (error) {
      console.error('Error:', error)
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

    // Net savings this month
    const netSavings = income - expense

    // Calculate trade P&L (only closed trades)
    const closedTrades = trades.filter(trade => trade.status === 'closed')
    const tradePL = closedTrades.reduce((sum, trade) => sum + (trade.profit_loss || 0), 0)
    const tradeCount = closedTrades.length

    // Open trades count
    const openTrades = trades.filter(trade => trade.status === 'open').length

    return {
      totalBalance,
      walletCount: wallets.length,
      income,
      incomeCount,
      expense,
      expenseCount,
      netSavings,
      tradePL,
      tradeCount,
      openTrades
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
      {/* ===== HEADER ===== */}
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
            className="group px-4 py-2.5 bg-white border-2 border-blue-200 text-blue-700 rounded-xl hover:border-blue-400 hover:bg-blue-50 font-medium text-sm transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

      {/* ===== STATS CARDS GRID ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* 1. Total Balance */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div className="text-right">
              <p className="text-blue-100 text-xs font-medium uppercase tracking-wide">Tổng Tài Sản</p>
              <p className="text-blue-100 text-xs mt-0.5">{stats.walletCount} ví</p>
            </div>
          </div>
          <p className="text-4xl font-bold mb-1">
            {stats.totalBalance.toLocaleString('vi-VN')}
          </p>
          <p className="text-blue-100 text-sm font-medium">VND</p>
        </div>

        {/* 2. Monthly Income */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="text-right">
              <p className="text-green-100 text-xs font-medium uppercase tracking-wide">Thu Nhập</p>
              <p className="text-green-100 text-xs mt-0.5">{stats.incomeCount} giao dịch</p>
            </div>
          </div>
          <p className="text-4xl font-bold mb-1">
            +{stats.income.toLocaleString('vi-VN')}
          </p>
          <p className="text-green-100 text-sm font-medium">VND tháng này</p>
        </div>

        {/* 3. Monthly Expense */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
            <div className="text-right">
              <p className="text-red-100 text-xs font-medium uppercase tracking-wide">Chi Tiêu</p>
              <p className="text-red-100 text-xs mt-0.5">{stats.expenseCount} giao dịch</p>
            </div>
          </div>
          <p className="text-4xl font-bold mb-1">
            -{stats.expense.toLocaleString('vi-VN')}
          </p>
          <p className="text-red-100 text-sm font-medium">VND tháng này</p>
        </div>

        {/* 4. Net Savings */}
        <div className={`bg-gradient-to-br ${
          stats.netSavings >= 0 
            ? 'from-emerald-500 to-emerald-600' 
            : 'from-orange-500 to-orange-600'
        } rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-shadow`}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-right">
              <p className={`${stats.netSavings >= 0 ? 'text-emerald-100' : 'text-orange-100'} text-xs font-medium uppercase tracking-wide`}>
                Tiết Kiệm
              </p>
              <p className={`${stats.netSavings >= 0 ? 'text-emerald-100' : 'text-orange-100'} text-xs mt-0.5`}>
                Tháng này
              </p>
            </div>
          </div>
          <p className="text-4xl font-bold mb-1">
            {stats.netSavings >= 0 ? '+' : ''}{stats.netSavings.toLocaleString('vi-VN')}
          </p>
          <p className={`${stats.netSavings >= 0 ? 'text-emerald-100' : 'text-orange-100'} text-sm font-medium`}>
            VND {stats.netSavings >= 0 ? '(tích cực)' : '(thâm hụt)'}
          </p>
        </div>

        {/* 5. Trade P&L */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <div className="text-right">
              <p className="text-purple-100 text-xs font-medium uppercase tracking-wide">Trade P&L</p>
              <p className="text-purple-100 text-xs mt-0.5">{stats.tradeCount} lệnh đóng</p>
            </div>
          </div>
          <p className="text-4xl font-bold mb-1">
            {stats.tradePL >= 0 ? '+' : ''}{stats.tradePL.toLocaleString('vi-VN')}
          </p>
          <p className="text-purple-100 text-sm font-medium">VND tổng P&L</p>
        </div>

        {/* 6. Open Trades */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="text-right">
              <p className="text-indigo-100 text-xs font-medium uppercase tracking-wide">Lệnh Đang Mở</p>
              <p className="text-indigo-100 text-xs mt-0.5">Trades</p>
            </div>
          </div>
          <p className="text-4xl font-bold mb-1">
            {stats.openTrades}
          </p>
          <p className="text-indigo-100 text-sm font-medium">lệnh đang chờ</p>
        </div>

        {/* 7. Total Transactions */}
        <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div className="text-right">
              <p className="text-cyan-100 text-xs font-medium uppercase tracking-wide">Giao Dịch</p>
              <p className="text-cyan-100 text-xs mt-0.5">Tháng này</p>
            </div>
          </div>
          <p className="text-4xl font-bold mb-1">
            {stats.incomeCount + stats.expenseCount}
          </p>
          <p className="text-cyan-100 text-sm font-medium">
            {stats.incomeCount} thu / {stats.expenseCount} chi
          </p>
        </div>

        {/* 8. Savings Rate */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            </div>
            <div className="text-right">
              <p className="text-amber-100 text-xs font-medium uppercase tracking-wide">Tỷ Lệ Tiết Kiệm</p>
              <p className="text-amber-100 text-xs mt-0.5">Savings Rate</p>
            </div>
          </div>
          <p className="text-4xl font-bold mb-1">
            {stats.income > 0 ? ((stats.netSavings / stats.income) * 100).toFixed(1) : '0.0'}%
          </p>
          <p className="text-amber-100 text-sm font-medium">
            {stats.income > 0 ? 'của thu nhập' : 'Chưa có dữ liệu'}
          </p>
        </div>

      </div>

      {/* ===== QUICK INFO ===== */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-200">
        <div className="flex items-center gap-3 text-gray-700">
          <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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