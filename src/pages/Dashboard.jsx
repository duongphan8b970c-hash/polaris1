import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../utils'
import Loading from '../components/common/Loading'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalAssets: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
    savingsRate: 0,
    transactionCount: 0,
    tradeCount: 0
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get current month range
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      // Fetch wallets total
      const { data: wallets } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)

      const totalAssets = wallets?.reduce((sum, w) => sum + (w.balance || 0), 0) || 0

      // Fetch transactions this month
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, type')
        .eq('user_id', user.id)
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .lte('date', endOfMonth.toISOString().split('T')[0])

      const monthlyIncome = transactions
        ?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0) || 0

      const monthlyExpense = transactions
        ?.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0

      const savingsRate = monthlyIncome > 0 
        ? ((monthlyIncome - monthlyExpense) / monthlyIncome * 100).toFixed(1)
        : 0

      // Fetch trades
      const { data: trades } = await supabase
        .from('trades')
        .select('id')
        .eq('user_id', user.id)
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .lte('date', endOfMonth.toISOString().split('T')[0])

      setStats({
        totalAssets,
        monthlyIncome,
        monthlyExpense,
        savingsRate: parseFloat(savingsRate),
        transactionCount: transactions?.length || 0,
        tradeCount: trades?.length || 0
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <Loading message="Đang tải dashboard..." />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          💰 Finance Dashboard
        </h1>
        <p className="text-gray-600 mt-1">
          Tổng quan tài chính và hiệu suất
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Assets */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
              <span className="text-2xl">💎</span>
            </div>
          </div>
          <p className="text-sm font-medium text-blue-900 opacity-80 mb-1">
            Tổng tài sản
          </p>
          <p className="text-3xl font-bold text-blue-900">
            {formatCurrency(stats.totalAssets)}
          </p>
          <p className="text-xs text-blue-700 opacity-70 mt-1">
            Từ tất cả các ví
          </p>
        </div>

        {/* Monthly Income */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
              <span className="text-2xl">📈</span>
            </div>
          </div>
          <p className="text-sm font-medium text-green-900 opacity-80 mb-1">
            Thu nhập tháng này
          </p>
          <p className="text-3xl font-bold text-green-900">
            {formatCurrency(stats.monthlyIncome)}
          </p>
          <p className="text-xs text-green-700 opacity-70 mt-1">
            {stats.transactionCount} giao dịch + {stats.tradeCount} trades
          </p>
        </div>

        {/* Monthly Expense */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center">
              <span className="text-2xl">📉</span>
            </div>
          </div>
          <p className="text-sm font-medium text-red-900 opacity-80 mb-1">
            Chi tiêu tháng này
          </p>
          <p className="text-3xl font-bold text-red-900">
            {formatCurrency(stats.monthlyExpense)}
          </p>
          <p className="text-xs text-red-700 opacity-70 mt-1">
            Các khoản chi
          </p>
        </div>

        {/* Transactions Count */}
        <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-2 border-cyan-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-cyan-200 rounded-full flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
          </div>
          <p className="text-sm font-medium text-cyan-900 opacity-80 mb-1">
            Giao dịch tháng này
          </p>
          <p className="text-3xl font-bold text-cyan-900">
            {stats.transactionCount}
          </p>
          <p className="text-xs text-cyan-700 opacity-70 mt-1">
            Tổng số giao dịch
          </p>
        </div>

        {/* Trades Count */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
              <span className="text-2xl">💹</span>
            </div>
          </div>
          <p className="text-sm font-medium text-purple-900 opacity-80 mb-1">
            Trades P&L
          </p>
          <p className="text-3xl font-bold text-purple-900">
            {stats.tradeCount}
          </p>
          <p className="text-xs text-purple-700 opacity-70 mt-1">
            Trades tháng này
          </p>
        </div>

        {/* Savings Rate */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
          </div>
          <p className="text-sm font-medium text-orange-900 opacity-80 mb-1">
            Tỷ lệ tiết kiệm
          </p>
          <p className="text-3xl font-bold text-orange-900">
            {stats.savingsRate}%
          </p>
          <p className="text-xs text-orange-700 opacity-70 mt-1">
            Savings rate
          </p>
        </div>
      </div>

      {/* Recent Activity Section - Optional */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Giao dịch gần đây */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            💵 Giao dịch gần đây
          </h3>
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">Xem chi tiết tại trang Giao dịch</p>
          </div>
        </div>

        {/* Trades gần đây */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            📈 Trades gần đây
          </h3>
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">Xem chi tiết tại trang Trades</p>
          </div>
        </div>
      </div>
    </div>
  )
}