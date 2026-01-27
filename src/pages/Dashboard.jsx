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
      // ✅ FIX: Use correct table name
      const { data: txnData } = await supabase
        .from('financial_transactions')
        .select('*')
        .order('date', { ascending: false })

      setTransactions(txnData || [])

      // Fetch trades
      const { data: tradeData } = await supabase
        .from('trades')
        .select('*')
        .order('updated_at', { ascending: false })

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
  // Confirm before updating
  if (!window.confirm('Cập nhật tỷ giá ngay bây giờ?')) {
    return
  }
  
  setUpdatingRates(true)
  setUpdateResult(null)
  
  try {
    console.log('🔄 Starting manual update...')
    
    // Call API
    const response = await fetch('/api/update-rates', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer db5d50fd8d3e81bc2d4fbcf3642ff0a4d0f6b013eca79e32744e2eb37e0ad1b6'
      }
    })
    
    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type')
    
    if (!contentType || !contentType.includes('application/json')) {
      // Not JSON - probably error HTML
      const text = await response.text()
      console.error('❌ Non-JSON response:', text.substring(0, 300))
      
      setUpdateResult({
        success: false,
        message: '❌ Server error - API không trả về JSON. Check Vercel logs.'
      })
      
      return
    }
    
    // Parse JSON
    const data = await response.json()
    console.log('Response data:', data)
    
    // Check response
    if (!response.ok) {
      // HTTP error (4xx, 5xx)
      throw new Error(data.error || data.message || `HTTP ${response.status}`)
    }
    
    if (data.success) {
      // Success!
      setUpdateResult({
        success: true,
        message: `✅ Đã cập nhật ${data.updated_currencies || 'tất cả'} tỷ giá thành công!`
      })
      
      // Refresh last updated time
      await fetchData()
      
      // Auto reload after 2s
      setTimeout(() => {
        window.location.reload()
      }, 2000)
      
    } else {
      // API returned success: false
      setUpdateResult({
        success: false,
        message: `❌ ${data.error || data.message || 'Không thể cập nhật'}`
      })
    }
    
  } catch (error) {
    console.error('❌ Error in handleManualUpdate:', error)
    
    setUpdateResult({
      success: false,
      message: `❌ Lỗi: ${error.message}`
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

    // Calculate trade P&L (only closed trades)
    const closedTrades = trades.filter(trade => trade.status === 'closed')
    const tradePL = closedTrades.reduce((sum, trade) => sum + (trade.profit_loss || 0), 0)
    const tradeCount = closedTrades.length

    return {
      income,
      incomeCount,
      expense,
      expenseCount,
      tradePL,
      tradeCount,
      monthlyTransactions,
      closedTrades
    }
  }, [transactions, trades])

  const totalBalance = useMemo(() => {
    return wallets.reduce((sum, wallet) => sum + (wallet.balance_vnd || 0), 0)
  }, [wallets])

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
            <span>Cập nhật lúc: {formatLastUpdated()}</span>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={handleManualUpdate}
            disabled={updatingRates}
            className="group relative px-4 py-2.5 bg-white border-2 border-blue-200 text-blue-700 rounded-xl hover:border-blue-400 hover:bg-blue-50 font-medium text-sm transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
        <div className={`p-4 rounded-xl font-medium shadow-md border-l-4 animate-slideIn ${
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

      {/* ===== STATS CARDS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Balance */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <p className="text-blue-100 text-xs font-medium">TỔNG TÀI SẢN</p>
              <p className="text-blue-100 text-xs">{wallets.length} ví</p>
            </div>
          </div>
          <p className="text-3xl font-bold">{totalBalance.toLocaleString('vi-VN')}</p>
          <p className="text-blue-100 text-sm mt-1">VND</p>
        </div>

        {/* Income */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="text-green-100 text-xs font-medium">THU NHẬP</p>
              <p className="text-green-100 text-xs">{stats.incomeCount} giao dịch</p>
            </div>
          </div>
          <p className="text-3xl font-bold">+{stats.income.toLocaleString('vi-VN')}</p>
          <p className="text-green-100 text-sm mt-1">VND tháng này</p>
        </div>

        {/* Expense */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
            <div>
              <p className="text-red-100 text-xs font-medium">CHI TIÊU</p>
              <p className="text-red-100 text-xs">{stats.expenseCount} giao dịch</p>
            </div>
          </div>
          <p className="text-3xl font-bold">-{stats.expense.toLocaleString('vi-VN')}</p>
          <p className="text-red-100 text-sm mt-1">VND tháng này</p>
        </div>

        {/* Trade P&L */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <div>
              <p className="text-purple-100 text-xs font-medium">TRADE P&L</p>
              <p className="text-purple-100 text-xs">{stats.tradeCount} lệnh đóng</p>
            </div>
          </div>
          <p className="text-3xl font-bold">
            {stats.tradePL >= 0 ? '+' : ''}{stats.tradePL.toLocaleString('vi-VN')}
          </p>
          <p className="text-purple-100 text-sm mt-1">VND tổng P&L</p>
        </div>
      </div>

      {/* ===== WALLET LIST ===== */}
      <div className="bg-white rounded-xl shadow-sm p-6">
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
                
                <p className="text-xl font-bold text-gray-900">
                  {(wallet.current_amount || 0).toLocaleString('vi-VN')} {wallet.currency}
                </p>
                
                {wallet.currency !== 'VND' && wallet.balance_vnd && (
                  <p className="text-sm text-gray-500 mt-1">
                    ≈ {(wallet.balance_vnd || 0).toLocaleString('vi-VN')} VND
                  </p>
                )}
                
                <p className="text-xs text-gray-500 mt-2 capitalize">{wallet.type}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 font-medium">Chưa có ví nào</p>
          </div>
        )}
      </div>

      {/* ===== RECENT TRANSACTIONS ===== */}
      {stats.monthlyTransactions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Giao dịch tháng này</h3>
          <div className="space-y-3">
            {stats.monthlyTransactions.slice(0, 5).map((txn, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    txn.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <svg className={`w-5 h-5 ${
                      txn.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
                        txn.type === 'income' 
                          ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                          : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                      } />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{txn.description || 'Không có mô tả'}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(txn.date).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
                <p className={`font-bold ${
                  txn.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {txn.type === 'income' ? '+' : '-'}
                  {Math.abs(txn.amount).toLocaleString('vi-VN')} VND
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}