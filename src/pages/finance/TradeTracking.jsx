import { useState, useMemo, useEffect } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import TradeList from '../../components/trades/TradeList'
import TradeForm from '../../components/trades/TradeForm'
import LiveTradeChart from '../../components/trades/LiveTradeChart'
import SymbolChart from '../../components/trades/SymbolChart'
import CalculatorModal from '../../components/trades/CalculatorModal'
import MonthlyTarget from '../../components/trades/MonthlyTarget'
import Modal from '../../components/common/Modal'
import Loading from '../../components/common/Loading'
import ErrorMessage from '../../components/common/ErrorMessage'
import { useTrades } from '../../hooks/finance/useTrades'
import { formatCurrency } from '../../utils'
import ErrorModal from '../../components/common/ErrorModal'
import QuickCloseModal from '../../components/trades/QuickCloseModal'
import { useTradeDarkMode } from '../../hooks/useTradeDarkMode'

// Generate month options: current month + past 11 months
function generateMonthOptions() {
  const options = [{ value: 'all', label: 'Tất cả' }]
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`
    options.push({ value, label })
  }
  return options
}

const MONTH_OPTIONS = generateMonthOptions()

export default function TradeTracking() {
  const [filters] = useState({})
  const {trades, loading, error, createTrade, updateTrade, quickCloseTrade, refetch} = useTrades(filters)
  const [showForm, setShowForm] = useState(false)
  const [editingTrade, setEditingTrade] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' })
  const [quickCloseModal, setQuickCloseModal] = useState({
    isOpen: false,
    trade: null,
    resultType: null // 'win' or 'loss'
  })
  const [selectedMonth, setSelectedMonth] = useState('all') // default to all-time
  const [chartSymbol, setChartSymbol] = useState('BTC/USDT')
  const [showCalculator, setShowCalculator] = useState(false)
  const { darkMode, setDarkMode } = useTradeDarkMode()

  // Restore dark mode preference on mount, reset on unmount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('trade_dark_mode')
      if (saved === 'true') setDarkMode(true)
    } catch { /* ignore */ }
    return () => setDarkMode(false)
  }, [setDarkMode])

  useEffect(() => {
    try { localStorage.setItem('trade_dark_mode', darkMode) } catch { /* ignore */ }
  }, [darkMode])

  // Filter trades by selected month
  const filteredTrades = useMemo(() => {
    if (selectedMonth === 'all') return trades
    const [year, month] = selectedMonth.split('-').map(Number)
    return trades.filter(t => {
      const d = new Date(t.created_at)
      return d.getFullYear() === year && d.getMonth() + 1 === month
    })
  }, [trades, selectedMonth])

  // Calculate statistics helper
  const calcStats = (tradeList) => tradeList.reduce((acc, t) => {
    if (t.status === 'closed') {
      acc.closedCount++

      const pl = t.profit_loss || 0
      const currency = t.exit_currency || t.wallet?.currency || 'USDT'

      if (!acc.plByCurrency[currency]) acc.plByCurrency[currency] = 0
      acc.plByCurrency[currency] += pl

      if (pl > 0) {
        acc.winCount++
        acc.totalWin += pl
        if (acc.bestTrade === null || pl > acc.bestTrade.profit_loss) acc.bestTrade = t
      } else if (pl < 0) {
        acc.lossCount++
        acc.totalLoss += Math.abs(pl)
        if (acc.worstTrade === null || pl < acc.worstTrade.profit_loss) acc.worstTrade = t
      }
    } else {
      acc.openCount++
    }
    return acc
  }, {
    openCount: 0,
    closedCount: 0,
    winCount: 0,
    lossCount: 0,
    totalWin: 0,
    totalLoss: 0,
    plByCurrency: {},
    bestTrade: null,
    worstTrade: null,
  })

  // All-time stats always from full trades list
  const allTimeStats = useMemo(() => {
    const s = calcStats(trades)
    s.winRate = s.closedCount > 0 ? (s.winCount / s.closedCount * 100).toFixed(1) : 0
    return s
  }, [trades])

  // Filtered stats from filteredTrades
  const filteredStats = useMemo(() => {
    const s = calcStats(filteredTrades)
    s.winRate = s.closedCount > 0 ? (s.winCount / s.closedCount * 100).toFixed(1) : 0
    return s
  }, [filteredTrades])

  // Show all-time stats when "all" is selected, filtered stats otherwise
  const stats = selectedMonth === 'all' ? allTimeStats : filteredStats
  const isAllTime = selectedMonth === 'all'

  const selectedMonthLabel = MONTH_OPTIONS.find(o => o.value === selectedMonth)?.label || ''

  const handleCreate = () => {
    setEditingTrade(null)
    setShowForm(true)
  }

  const handleEdit = (trade) => {
    setEditingTrade(trade)
    setShowForm(true)
  }

  const handleCloseTrade = (trade) => {
    setEditingTrade(trade)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingTrade(null)
  }

  const handleSubmit = async (formData) => {
    setSubmitting(true)
    
    const result = editingTrade
      ? await updateTrade(editingTrade.id, formData)
      : await createTrade(formData)
    
    setSubmitting(false)
    
    if (result.success) {
      handleCloseForm()
    } else {
      setErrorModal({ isOpen: true, message: result.error })
    }
  }
  const handleQuickClose = (trade, resultType) => {
    setQuickCloseModal({
      isOpen: true,
      trade,
      resultType
    })
  }

    const handleQuickCloseConfirm = async (trade, profitLoss, exitPrice) => {
    const result = await quickCloseTrade(trade.id, profitLoss, exitPrice)
    
    setQuickCloseModal({ isOpen: false, trade: null, resultType: null })
    
    if (!result.success) {
      setErrorModal({ isOpen: true, message: result.error })
    }
  }

  if (loading) {
    return <Loading message="Đang tải trades..." />
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={refetch} />
  }

  // Dark mode helper classes — night sky theme
  const dm = {
    text: darkMode ? 'text-gray-100' : 'text-gray-900',
    subtext: darkMode ? 'text-gray-400' : 'text-gray-500',
    card: darkMode ? 'bg-[#111827]/80 backdrop-blur-sm border border-[#1e293b] rounded-xl shadow-md p-4' : 'card',
    statCard: darkMode ? 'bg-[#111827]/80 backdrop-blur-sm border-l-4 rounded-xl shadow-md p-4' : 'stat-card',
    input: darkMode
      ? 'bg-[#0f172a] border-[#334155] text-gray-100 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
      : 'input',
    label: darkMode ? 'text-sm font-medium text-gray-400 whitespace-nowrap' : 'text-sm font-medium text-gray-700 whitespace-nowrap',
  }

  return (
    <div className={dm.text}>
      <PageHeader 
        title="Quản lý Trade" 
        darkMode={darkMode} 
        action={
          <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            <button
              onClick={() => setDarkMode(d => !d)}
              className={`p-2 rounded-lg text-lg transition-colors ${
                darkMode
                  ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={darkMode ? 'Light mode' : 'Dark mode'}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button
              onClick={() => setShowCalculator(true)}
              className={`text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow-md ${
                darkMode
                  ? 'bg-[#1e293b] border border-[#334155] text-gray-200 hover:bg-[#334155]'
                  : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              🧮 Calculator
            </button>
            <button onClick={handleCreate} className="btn btn-primary">
              <svg className="w-5 h-5 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Thêm trade
            </button>
          </div>
        }
      />

      {/* Live Chart Area */}
      <SymbolChart symbol={chartSymbol} onSymbolChange={setChartSymbol} darkMode={darkMode} />

      {/* Monthly Target */}
      <MonthlyTarget trades={trades} selectedMonth={selectedMonth} darkMode={darkMode} />

      {/* Monthly Filter */}
      <div className="flex items-center gap-3 mb-4">
        <label className={dm.label}>Lọc theo tháng:</label>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className={`${dm.input} w-auto min-w-[160px]`}
        >
          {MONTH_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Statistics */}
      <div className="mb-1">
        <p className={`text-xs ${dm.subtext} mb-2`}>
          Thống kê: {isAllTime
            ? <span className="font-medium text-purple-400">All-Time 🏆</span>
            : <span className={`font-medium ${dm.subtext}`}>{selectedMonthLabel}</span>
          }
          {' '}({(isAllTime ? trades : filteredTrades).length} trades)
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Open Trades */}
        <div className={`${dm.statCard} border-blue-500`}>
          <p className={`text-sm ${dm.subtext}`}>Đang mở {isAllTime && <span className="text-purple-500 text-xs">(All-Time)</span>}</p>
          <p className="text-2xl font-bold text-blue-500 mt-1">{stats.openCount}</p>
        </div>
        
        {/* Win / Loss */}
        <div className={`${dm.statCard} border-green-500`}>
          <p className={`text-sm ${dm.subtext}`}>Win / Loss {isAllTime && <span className="text-purple-500 text-xs">(All-Time)</span>}</p>
          <p className={`text-2xl font-bold mt-1 ${dm.text}`}>
            <span className="text-green-500">{stats.winCount}</span>
            {' / '}
            <span className="text-red-500">{stats.lossCount}</span>
          </p>
        </div>
        
        {/* Win Rate */}
        <div className={`${dm.statCard} border-purple-500`}>
          <p className={`text-sm ${dm.subtext}`}>Win Rate {isAllTime && <span className="text-purple-500 text-xs">(All-Time)</span>}</p>
          <p className="text-2xl font-bold text-purple-500 mt-1">{stats.winRate}%</p>
        </div>
        
        {/* Total P&L */}
        <div className={`${dm.statCard} border-primary-500`}>
          <p className={`text-sm ${dm.subtext} mb-1`}>Total P&L {isAllTime && <span className="text-purple-500 text-xs">(All-Time)</span>}</p>
          <div className="space-y-1">
            {Object.keys(stats.plByCurrency).length > 0 ? (
              Object.entries(stats.plByCurrency).map(([currency, amount]) => (
                <p key={currency} className={`text-lg font-bold ${amount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {amount >= 0 ? '+' : ''}{formatCurrency(amount, currency)}
                </p>
              ))
            ) : (
              <p className={`text-2xl font-bold ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>0</p>
            )}
          </div>
        </div>
      </div>

      {/* Best / Worst Trade */}
      {(stats.bestTrade || stats.worstTrade) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {stats.bestTrade && (
            <div className={`${dm.statCard} border-green-400`}>
              <p className={`text-sm ${dm.subtext}`}>Best Trade</p>
              <p className="text-base font-bold text-green-500 mt-1">
                {stats.bestTrade.symbol} &nbsp;
                <span className={`text-sm font-normal ${dm.subtext}`}>({stats.bestTrade.leverage || 1}x)</span>
              </p>
              <p className="text-lg font-bold text-green-500">
                +{formatCurrency(stats.bestTrade.profit_loss, stats.bestTrade.exit_currency || stats.bestTrade.wallet?.currency)}
              </p>
            </div>
          )}
          {stats.worstTrade && (
            <div className={`${dm.statCard} border-red-400`}>
              <p className={`text-sm ${dm.subtext}`}>Worst Trade</p>
              <p className="text-base font-bold text-red-500 mt-1">
                {stats.worstTrade.symbol} &nbsp;
                <span className={`text-sm font-normal ${dm.subtext}`}>({stats.worstTrade.leverage || 1}x)</span>
              </p>
              <p className="text-lg font-bold text-red-500">
                {formatCurrency(stats.worstTrade.profit_loss, stats.worstTrade.exit_currency || stats.worstTrade.wallet?.currency)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Live Open Trades Section */}
      {filteredTrades.filter(t => t.status === 'open').length > 0 && (
        <div className="mb-4">
          <h2 className={`text-base sm:text-lg font-bold ${dm.text} mb-4 flex items-center gap-2`}>
            📈 Open Positions - Live Tracking
            <span className={`text-sm font-normal ${dm.subtext}`}>
              ({filteredTrades.filter(t => t.status === 'open').length} active)
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTrades
              .filter(t => t.status === 'open')
              .map(trade => (
                <LiveTradeChart key={trade.id} trade={trade} />
              ))
            }
          </div>
        </div>
      )}

      <TradeList
        trades={filteredTrades}
        onEdit={handleEdit}
        onClose={handleCloseTrade}
        onQuickClose={handleQuickClose}
        darkMode={darkMode}
      />

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={handleCloseForm}
        title={editingTrade ? 'Sửa trade' : 'Thêm trade mới'}
      >
        <TradeForm
          trade={editingTrade}
          onSubmit={handleSubmit}
          onCancel={handleCloseForm}
          loading={submitting}
        />
        
      </Modal>
      {/* Error Modal */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        title="Lỗi"
        message={errorModal.message}
        onClose={() => setErrorModal({ isOpen: false, message: '' })}
      />
      {/* Quick Close Modal */}
      <QuickCloseModal
        isOpen={quickCloseModal.isOpen}
        trade={quickCloseModal.trade}
        resultType={quickCloseModal.resultType}
        onConfirm={handleQuickCloseConfirm}
        onCancel={() => setQuickCloseModal({ isOpen: false, trade: null, resultType: null })}
      />
      {/* Calculator Modal */}
      <CalculatorModal
        isOpen={showCalculator}
        onClose={() => setShowCalculator(false)}
      />
    </div>
  )
}