import { useState, useEffect } from 'react'
import { useWallets } from '../hooks/finance/useWallets'
import { supabase } from '../lib/supabase'
import FinanceTab from '../components/dashboard/FinanceTab'
import Loading from '../components/common/Loading'
import { getRelativeTime } from '../utils'

export default function Dashboard() {
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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Dashboard</h1>
        <p className="text-gray-600">Tổng quan về tài chính</p>
      </div>

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
    </div>
  )
}