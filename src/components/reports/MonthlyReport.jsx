import { useState } from 'react'
import { formatCurrency } from '../../lib/utils'
import ResponsiveTable from '../common/ResponsiveTable'

export default function MonthlyReport({ transactions, trades, wallets }) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  // Parse selected month
  const [year, month] = selectedMonth.split('-').map(Number)

  // Filter transactions by month
  const monthTransactions = transactions.filter(t => {
    const date = new Date(t.date)
    return date.getFullYear() === year && date.getMonth() + 1 === month
  })

  // Filter trades by month (closed in this month)
  const monthTrades = trades.filter(t => {
    if (t.status !== 'closed' || !t.updated_at) return false
    const date = new Date(t.updated_at)
    return date.getFullYear() === year && date.getMonth() + 1 === month
  })

  // Calculate totals
  const income = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const expense = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const tradePL = monthTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0)

  const netIncome = income - expense + tradePL

  // Category breakdown
  const categoryBreakdown = {}
  monthTransactions.forEach(t => {
    const catName = t.category?.name || 'Khác'
    if (!categoryBreakdown[catName]) {
      categoryBreakdown[catName] = { income: 0, expense: 0, icon: t.category?.icon || '📁' }
    }
    if (t.type === 'income') {
      categoryBreakdown[catName].income += t.amount
    } else {
      categoryBreakdown[catName].expense += t.amount
    }
  })

  // Export to CSV with UTF-8 BOM for Excel compatibility
  const handleExportCSV = () => {
    const monthName = new Date(year, month - 1).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
    
    // Start with BOM for UTF-8
    let csv = '\uFEFF'
    
    // Header
    csv += `BÁO CÁO TÀI CHÍNH - ${monthName.toUpperCase()}\n\n`
    
    // Summary
    csv += 'TỔNG QUAN\n'
    csv += 'Loại,Số tiền (₫)\n'
    csv += `Thu nhập,${income.toLocaleString('vi-VN')}\n`
    csv += `Chi tiêu,-${expense.toLocaleString('vi-VN')}\n`
    csv += `Trade P&L,${tradePL >= 0 ? '' : '-'}${Math.abs(tradePL).toLocaleString('vi-VN')}\n`
    csv += `Chênh lệch,${netIncome >= 0 ? '' : '-'}${Math.abs(netIncome).toLocaleString('vi-VN')}\n\n`
    
    // Transactions detail
    csv += 'CHI TIẾT GIAO DỊCH\n'
    csv += 'Ngày,Loại,Ví,Danh mục,Mô tả,Số tiền (₫)\n'
    monthTransactions.forEach(t => {
      const date = new Date(t.date).toLocaleDateString('vi-VN')
      const type = t.type === 'income' ? 'Thu nhập' : 'Chi tiêu'
      const wallet = t.wallet?.name || ''
      const category = t.category?.name || 'Khác'
      const description = (t.description || '').replace(/"/g, '""')
      const amount = t.amount.toLocaleString('vi-VN')
      csv += `${date},${type},${wallet},${category},"${description}",${amount}\n`
    })
    
    // Category breakdown
    csv += '\nCHI TIẾT THEO DANH MỤC\n'
    csv += 'Danh mục,Thu nhập (₫),Chi tiêu (₫),Chênh lệch (₫)\n'
    Object.entries(categoryBreakdown)
      .sort((a, b) => (b[1].expense - a[1].expense))
      .forEach(([category, data]) => {
        csv += `${category},`
        csv += `${data.income > 0 ? data.income.toLocaleString('vi-VN') : '0'},`
        csv += `${data.expense > 0 ? data.expense.toLocaleString('vi-VN') : '0'},`
        csv += `${(data.income - data.expense).toLocaleString('vi-VN')}\n`
      })
    csv += `TỔNG,${income.toLocaleString('vi-VN')},${expense.toLocaleString('vi-VN')},${(income - expense).toLocaleString('vi-VN')}\n`
    
    // Trades detail
    if (monthTrades.length > 0) {
      csv += '\nCHI TIẾT TRADE\n'
      csv += 'Ngày đóng,Symbol,Loại,Leverage,Entry,Exit,P&L (₫)\n'
      monthTrades.forEach(t => {
        const date = new Date(t.updated_at).toLocaleDateString('vi-VN')
        const side = t.side === 'buy' ? 'BUY' : 'SELL'
        csv += `${date},${t.symbol},${side},${t.leverage}x,${t.entry_price},${t.exit_price || ''},${(t.profit_loss || 0).toLocaleString('vi-VN')}\n`
      })
      
      const wins = monthTrades.filter(t => t.profit_loss > 0).length
      const losses = monthTrades.filter(t => t.profit_loss < 0).length
      const winRate = monthTrades.length > 0 ? (wins / monthTrades.length * 100).toFixed(1) : 0
      
      csv += `\nTÓM TẮT TRADE\n`
      csv += `Tổng lệnh,${monthTrades.length}\n`
      csv += `Win,${wins}\n`
      csv += `Loss,${losses}\n`
      csv += `Win Rate,${winRate}%\n`
      csv += `Total P&L,${tradePL.toLocaleString('vi-VN')} ₫\n`
    }
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `bao-cao-${year}-${String(month).padStart(2, '0')}.csv`
    link.click()
  }

  // Generate month options (last 12 months) with Vietnamese format
  const monthOptions = []
  for (let i = 0; i < 12; i++) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = `Tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`
    monthOptions.push({ value, label })
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Title */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Báo cáo tháng</h2>
            <p className="text-sm text-gray-500 mt-1">Chi tiết thu chi và giao dịch</p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {/* Month selector */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white min-w-[200px]"
            >
              {monthOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {/* Export button */}
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 font-medium"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card border-l-4 border-green-500">
          <p className="text-sm text-gray-600 mb-1">Tổng thu nhập</p>
          <p className="text-2xl font-bold text-green-600">
            +{income.toLocaleString('vi-VN')} ₫
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {monthTransactions.filter(t => t.type === 'income').length} giao dịch
          </p>
        </div>

        <div className="card border-l-4 border-red-500">
          <p className="text-sm text-gray-600 mb-1">Tổng chi tiêu</p>
          <p className="text-2xl font-bold text-red-600">
            -{expense.toLocaleString('vi-VN')} ₫
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {monthTransactions.filter(t => t.type === 'expense').length} giao dịch
          </p>
        </div>

        <div className={`card border-l-4 ${tradePL >= 0 ? 'border-purple-500' : 'border-orange-500'}`}>
          <p className="text-sm text-gray-600 mb-1">Trade P&L</p>
          <p className={`text-2xl font-bold ${tradePL >= 0 ? 'text-purple-600' : 'text-orange-600'}`}>
            {tradePL >= 0 ? '+' : ''}{tradePL.toLocaleString('vi-VN')} ₫
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {monthTrades.length} lệnh đóng
          </p>
        </div>

        <div className={`card border-l-4 ${netIncome >= 0 ? 'border-blue-500' : 'border-gray-500'}`}>
          <p className="text-sm text-gray-600 mb-1">Chênh lệch</p>
          <p className={`text-2xl font-bold ${netIncome >= 0 ? 'text-blue-600' : 'text-gray-600'}`}>
            {netIncome >= 0 ? '+' : ''}{netIncome.toLocaleString('vi-VN')} ₫
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Thu - Chi {tradePL !== 0 ? '+ Trade' : ''}
          </p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Chi tiết theo danh mục</h3>
        {Object.keys(categoryBreakdown).length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Danh mục</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thu nhập</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Chi tiêu</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Chênh lệch</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(categoryBreakdown)
                  .sort((a, b) => (b[1].expense - a[1].expense))
                  .map(([category, data]) => (
                    <tr key={category} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-xl mr-2">{data.icon}</span>
                          <span className="text-sm font-medium text-gray-900">{category}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right font-medium">
                        {data.income > 0 ? `+${data.income.toLocaleString('vi-VN')} ₫` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right font-medium">
                        {data.expense > 0 ? `-${data.expense.toLocaleString('vi-VN')} ₫` : '-'}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${
                        data.income - data.expense >= 0 ? 'text-blue-600' : 'text-gray-600'
                      }`}>
                        {data.income - data.expense >= 0 ? '+' : ''}
                        {(data.income - data.expense).toLocaleString('vi-VN')} ₫
                      </td>
                    </tr>
                  ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">TỔNG</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600 text-right">
                    +{income.toLocaleString('vi-VN')} ₫
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600 text-right">
                    -{expense.toLocaleString('vi-VN')} ₫
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${
                    income - expense >= 0 ? 'text-blue-600' : 'text-gray-600'
                  }`}>
                    {income - expense >= 0 ? '+' : ''}
                    {(income - expense).toLocaleString('vi-VN')} ₫
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">Chưa có giao dịch nào trong tháng này</p>
        )}
      </div>

      {/* Trade Summary */}
      {monthTrades.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Tóm tắt Trade</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Số lệnh đóng</p>
              <p className="text-2xl font-bold text-gray-900">{monthTrades.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Win</p>
              <p className="text-2xl font-bold text-green-600">
                {monthTrades.filter(t => t.profit_loss > 0).length}
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Loss</p>
              <p className="text-2xl font-bold text-red-600">
                {monthTrades.filter(t => t.profit_loss < 0).length}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Win Rate</p>
              <p className="text-2xl font-bold text-purple-600">
                {monthTrades.length > 0 
                  ? ((monthTrades.filter(t => t.profit_loss > 0).length / monthTrades.length) * 100).toFixed(1)
                  : 0}%
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày đóng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Side</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Leverage</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Entry</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Exit</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">P&L</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {monthTrades.map(trade => (
                  <tr key={trade.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(trade.updated_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {trade.symbol}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        trade.side === 'buy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {trade.side === 'buy' ? 'BUY' : 'SELL'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {trade.leverage}x
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-mono">
                      {trade.entry_price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-mono">
                      {trade.exit_price || '-'}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${
                      trade.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {trade.profit_loss >= 0 ? '+' : ''}
                      {(trade.profit_loss || 0).toLocaleString('vi-VN')} ₫
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}