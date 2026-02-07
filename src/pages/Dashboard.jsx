import { useState, useEffect } from 'react'
import { useWallets } from '../hooks/finance/useWallets'
import { supabase } from '../lib/supabase'
import FinanceTab from '../components/dashboard/FinanceTab'
import GoalsTab from '../components/dashboard/GoalsTab'
import PerformanceTab from '../components/dashboard/PerformanceTab'
import Loading from '../components/common/Loading'
import { formatDateTime, getRelativeTime } from '../utils'

export default function Dashboard() {
  // ✅ State cho active tab
  const [activeTab, setActiveTab] = useState('finance')
  
  const { wallets, loading: walletsLoading } = useWallets()
  
  const [transactions, setTransactions] = useState([])
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingRates, setUpdatingRates] = useState(false)
  const [updateResult, setUpdateResult] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [tradePLConverted, setTradePLConverted] = useState(0)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: txnData } = await supabase
        .from('financial_transactions')
        .select(`
          *,
          categories (
            id,
            name,
            icon,
            type
          )
        `)
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
        .maybeSingle()

      if (rateData) {
        setLastUpdated(rateData.updated_at)
      } else {
              setLastUpdated(null)  // Table rỗng, chưa có data
            }

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatLastUpdated = () => {
  if (!lastUpdated) return 'Chưa cập nhật'
  return getRelativeTime(lastUpdated)
  } 
    const handleManualUpdate = async () => {
    if (!window.confirm('Cập nhật tỷ giá ngay bây giờ?')) return
    
    setUpdatingRates(true)
    setUpdateResult(null)
    
    try {
      // ✅ Call Supabase function directly
      const response = await fetch('/api/update-rates', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_CRON_SECRET}`
      }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update rates')
      }

      const data = await response.json()
      
      setUpdateResult({
        success: true,
        message: `✅ Đã cập nhật ${data.updated_currencies} tỷ giá!`
      })
      
      await fetchData()
      
      setTimeout(() => {
        setUpdateResult(null)
      }, 3000)
      
    } catch (error) {
      console.error('Error updating exchange rates:', error)
      setUpdateResult({
        success: false,
        message: `❌ ${error.message}`
      })
    } finally {
      setUpdatingRates(false)
    }
  }
  // Convert trade P&L to VND
useEffect(() => {
  const convertTradePL = async () => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const monthlyClosedTrades = trades.filter(trade => {
      if (trade.status !== 'closed' || !trade.updated_at) return false
      const tradeDate = new Date(trade.updated_at)
      return tradeDate.getMonth() === currentMonth && tradeDate.getFullYear() === currentYear
    })

    if (monthlyClosedTrades.length === 0) {
      setTradePLConverted(0)
      return
    }

    // ✅ FIX: Query tất cả rates một lần duy nhất
    const { data: allRates } = await supabase
      .from('exchange_rates')
      .select('from_currency, to_currency, rate')
      .eq('to_currency', 'VND')

    // Tạo Map để lookup nhanh
    const ratesMap = new Map()
    allRates?.forEach(r => {
      ratesMap.set(r.from_currency, parseFloat(r.rate))
    })

    // Tính tổng với cached rates
    let totalVND = 0

    for (const trade of monthlyClosedTrades) {
      const pl = trade.profit_loss || 0
      const currency = (trade.exit_currency || 'USDT').toUpperCase()

      if (currency === 'VND') {
        totalVND += pl
        continue
      }

      // Lấy rate từ Map (nhanh hơn nhiều)
      const rate = ratesMap.get(currency) || (currency === 'USD' || currency === 'USDT' ? 24000 : 1)
      totalVND += pl * rate
    }

    setTradePLConverted(totalVND)
  }

    convertTradePL()
  }, [trades])

  if (loading || walletsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading message="Đang tải dữ liệu..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ✅ HEADER với Tab Navigation */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Dashboard</h1>
        <p className="text-gray-600 mb-6">Tổng quan về tài chính, mục tiêu và hiệu suất</p>
        
        {/* ✅ Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {/* Tab 1: Finance */}
            <button
              onClick={() => setActiveTab('finance')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === 'finance'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Tài Chính
            </button>

            {/* Tab 2: Goals */}
            <button
              onClick={() => setActiveTab('goals')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === 'goals'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              Mục Tiêu
            </button>

            {/* Tab 3: Performance */}
            <button
              onClick={() => setActiveTab('performance')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === 'performance'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Hiệu Suất
            </button>
          </nav>
        </div>
      </div>

      {/* ✅ TAB CONTENT */}
      <div className="mt-6">
        {activeTab === 'finance' && (
          <FinanceTab
            wallets={wallets}
            transactions={transactions}
            trades={trades}
            tradePLConverted={tradePLConverted}
            updatingRates={updatingRates}
            updateResult={updateResult}
            lastUpdated={lastUpdated}
            formatLastUpdated={formatLastUpdated}
            handleManualUpdate={handleManualUpdate}
          />
        )}

        {activeTab === 'goals' && <GoalsTab />}

        {activeTab === 'performance' && <PerformanceTab />}
      </div>
    </div>
  )
}