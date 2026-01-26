import { useEffect, useState } from 'react'
import { useWallets } from '../hooks/useWallets'
import { useTransactions } from '../hooks/useTransactions'
import { useTrades } from '../hooks/useTrades'
import { formatCurrency } from '../lib/utils'
import PageHeader from '../components/layout/PageHeader'
import Loading from '../components/common/Loading'
import IncomeExpenseChart from '../components/charts/IncomeExpenseChart'
import CategoryPieChart from '../components/charts/CategoryPieChart'
import BudgetProgressChart from '../components/charts/BudgetProgressChart'
import TradePerformanceChart from '../components/charts/TradePerformanceChart'
import { useBudgets } from '../hooks/useBudgets'

export default function Dashboard() {
  const { wallets, loading: walletsLoading } = useWallets()
  const { transactions, loading: transactionsLoading } = useTransactions() // ← No filters
  const { trades, loading: tradesLoading } = useTrades() // ← No filters
  const { budgets, loading: budgetsLoading } = useBudgets()
  const loading = walletsLoading || transactionsLoading || tradesLoading

  // Calculate totals
  const totalBalance = wallets.reduce((sum, w) => sum + (w.current_amount || 0), 0)
  const totalInitial = wallets.reduce((sum, w) => sum + (w.initial_amount || 0), 0)
  const overallChange = totalBalance - totalInitial

  // Get current month transactions
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const thisMonthTransactions = transactions.filter(t => {
    const date = new Date(t.date)
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear
  })

  const monthIncome = thisMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const monthExpense = thisMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const monthNet = monthIncome - monthExpense

  // Trade stats
  const openTrades = trades.filter(t => t.status === 'open')
  const closedTrades = trades.filter(t => t.status === 'closed')
  const wins = closedTrades.filter(t => t.profit_loss > 0).length
  const losses = closedTrades.filter(t => t.profit_loss < 0).length
  const winRate = closedTrades.length > 0 ? (wins / closedTrades.length * 100).toFixed(1) : 0
  const totalPL = closedTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0)

  // Recent transactions
  const recentTransactions = transactions.slice(0, 5)

  // Top categories
  const categorySpending = {}
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      const catName = t.category?.name || 'Khác'
      categorySpending[catName] = (categorySpending[catName] || 0) + t.amount
    })

  const topCategories = Object.entries(categorySpending)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  if (loading) {
    return <Loading message="Đang tải dashboard..." />
  }

  return (
    <div>
      <PageHeader 
        title="Dashboard" 
        subtitle="Tổng quan tài chính của bạn"
      />

      {/* Overall Balance Section */}
      <div className="card mb-6 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium opacity-90">Tổng tài sản</h3>
          <svg className="w-8 h-8 opacity-75" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-5xl font-bold mb-2">
          {totalBalance.toLocaleString('vi-VN')} ₫
        </p>
        <div className="flex items-center text-sm opacity-90">
          <span>Thay đổi: </span>
          <span className={`ml-2 font-semibold ${overallChange >= 0 ? 'text-green-200' : 'text-red-200'}`}>
            {overallChange >= 0 ? '+' : ''}{overallChange.toLocaleString('vi-VN')} ₫
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Monthly Income */}
        <div className="card border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Thu nhập tháng này</p>
            <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-green-600">
            +{monthIncome.toLocaleString('vi-VN')} ₫
          </p>
        </div>

        {/* Monthly Expense */}
        <div className="card border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Chi tiêu tháng này</p>
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-red-600">
            -{monthExpense.toLocaleString('vi-VN')} ₫
          </p>
        </div>

        {/* Monthly Net */}
        <div className={`card border-l-4 ${monthNet >= 0 ? 'border-blue-500' : 'border-orange-500'}`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Chênh lệch tháng này</p>
            <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className={`text-2xl font-bold ${monthNet >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
            {monthNet >= 0 ? '+' : ''}{monthNet.toLocaleString('vi-VN')} ₫
          </p>
        </div>

        {/* Trade Win Rate */}
        <div className="card border-l-4 border-purple-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Win Rate (Trades)</p>
            <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-purple-600">
            {winRate}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {wins} wins / {losses} losses
          </p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Wallets Overview */}
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Ví của bạn</h3>
          <div className="space-y-3">
            {wallets.slice(0, 5).map(wallet => {
              const monthlySnapshot = wallet.monthly_snapshot
              const monthChange = monthlySnapshot ? monthlySnapshot.month_change : 0
              
              return (
                <div key={wallet.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900">{wallet.name}</p>
                    <p className="text-xs text-gray-500">{wallet.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {formatCurrency(wallet.current_amount, wallet.currency)}
                    </p>
                    {monthChange !== 0 && (
                      <p className={`text-xs ${monthChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {monthChange >= 0 ? '+' : ''}{formatCurrency(monthChange, wallet.currency)} tháng này
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          {wallets.length === 0 && (
            <p className="text-center text-gray-500 py-8">Chưa có ví nào</p>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Giao dịch gần đây</h3>
          <div className="space-y-3">
            {recentTransactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                    tx.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {tx.category?.icon || '💰'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{tx.category?.name || 'Khác'}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(tx.date).toLocaleDateString('vi-VN')} • {tx.wallet?.name}
                    </p>
                  </div>
                </div>
                <p className={`font-bold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.type === 'income' ? '+' : '-'}
                  {formatCurrency(tx.amount, tx.wallet?.currency)}
                </p>
              </div>
            ))}
          </div>
          {recentTransactions.length === 0 && (
            <p className="text-center text-gray-500 py-8">Chưa có giao dịch nào</p>
          )}
        </div>
      </div>

      {/* Top Spending Categories */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Top danh mục chi tiêu</h3>
        <div className="space-y-3">
          {topCategories.map(([category, amount], index) => {
            const percentage = monthExpense > 0 ? ((amount / monthExpense) * 100).toFixed(1) : 0
            
            return (
              <div key={category}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                    <span className="font-semibold text-gray-900">{category}</span>
                  </div>
                  <span className="font-bold text-gray-900">
                    {amount.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{percentage}% tổng chi tiêu</p>
              </div>
            )
          })}
        </div>
        {topCategories.length === 0 && (
          <p className="text-center text-gray-500 py-8">Chưa có chi tiêu nào</p>
        )}
      </div>
    </div>
  )
}