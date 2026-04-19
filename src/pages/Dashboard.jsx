import { useState, useEffect } from 'react'
import { useWallets } from '../hooks/finance/useWallets'
import { supabase } from '../lib/supabase'
import FinanceTab from '../components/dashboard/FinanceTab'
import Loading from '../components/common/Loading'
import { getRelativeTime } from '../utils'

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
  const [monthlyTradePLMap, setMonthlyTradePLMap] = useState({})

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch transactions without FK joins (works even without FK constraints)
      const { data: txnData, error: txnError } = await supabase
        .from('financial_transactions')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

      if (txnError) {
        console.error('Transaction query error:', txnError)
      }

      const txns = txnData || []

      // Fetch related data in parallel
      const categoryIds = [...new Set(txns.map(t => t.category_id).filter(Boolean))]
      const goalIds = [...new Set(txns.map(t => t.payback_goal_id).filter(Boolean))]

      const [categoriesRes, goalsRes] = await Promise.all([
        categoryIds.length > 0
          ? supabase.from('categories').select('id, name, icon, type').in('id', categoryIds)
          : { data: [] },
        goalIds.length > 0
          ? supabase.from('payback_goals').select('id, name').in('id', goalIds)
          : { data: [] },
      ])

      const categoryMap = Object.fromEntries((categoriesRes.data || []).map(c => [c.id, c]))
      const goalMap = Object.fromEntries((goalsRes.data || []).map(g => [g.id, g]))

      // Merge related data onto transactions
      const merged = txns.map(txn => ({
        ...txn,
        categories: txn.category_id ? categoryMap[txn.category_id] || null : null,
        payback_goal: txn.payback_goal_id ? goalMap[txn.payback_goal_id] || null : null,
      }))

      setTransactions(merged)

      const { data: tradeData } = await supabase
        .from('trades')
        .select('*')
        .order('updated_at', { ascending: false })

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
  // Convert trade P&L to VND per month
useEffect(() => {
  const computeMonthlyTradePL = async () => {
    const closedTrades = trades.filter(t => t.status === 'closed' && t.updated_at)

    if (closedTrades.length === 0) {
      setTradePLConverted(0)
      setMonthlyTradePLMap({})
      return
    }

    // Query all VND rates once
    const { data: allRates } = await supabase
      .from('exchange_rates')
      .select('from_currency, to_currency, rate')
      .eq('to_currency', 'VND')

    const ratesMap = new Map()
    allRates?.forEach(r => {
      ratesMap.set(r.from_currency, parseFloat(r.rate))
    })

    // Compute per-month P/L in VND
    const plByMonth = {}

    for (const trade of closedTrades) {
      const tradeDate = new Date(trade.updated_at)
      const key = `${tradeDate.getFullYear()}-${tradeDate.getMonth()}`
      const pl = trade.profit_loss || 0
      const currency = (trade.exit_currency || 'USDT').toUpperCase()

      let plVND = pl
      if (currency !== 'VND') {
        const rate = ratesMap.get(currency) || (currency === 'USD' || currency === 'USDT' ? 24000 : 1)
        plVND = pl * rate
      }

      plByMonth[key] = (plByMonth[key] || 0) + plVND
    }

    setMonthlyTradePLMap(plByMonth)

    // Current month's trade P/L for backward compatibility
    const now = new Date()
    const currentKey = `${now.getFullYear()}-${now.getMonth()}`
    setTradePLConverted(plByMonth[currentKey] || 0)
  }

    computeMonthlyTradePL()
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
            monthlyTradePLMap={monthlyTradePLMap}
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