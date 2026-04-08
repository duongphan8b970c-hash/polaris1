import { useState, useMemo } from 'react'
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

  return (
    <div>
      <PageHeader 
        title="Quản lý Trade" 
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCalculator(true)}
              className="btn btn-secondary text-sm"
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
      <SymbolChart symbol={chartSymbol} onSymbolChange={setChartSymbol} />

      {/* Monthly Target */}
      <MonthlyTarget trades={trades} selectedMonth={selectedMonth} />

      {/* Monthly Filter */}
      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Lọc theo tháng:</label>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="input w-auto min-w-[160px]"
        >
          {MONTH_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Statistics */}
      <div className="mb-1">
        <p className="text-xs text-gray-400 mb-2">
          Thống kê: {isAllTime
            ? <span className="font-medium text-purple-600">All-Time 🏆</span>
            : <span className="font-medium text-gray-600">{selectedMonthLabel}</span>
          }
          {' '}({(isAllTime ? trades : filteredTrades).length} trades)
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
        {/* Open Trades */}
        <div className="stat-card border-blue-500">
          <p className="text-sm text-gray-500">Đang mở {isAllTime && <span className="text-purple-500 text-xs">(All-Time)</span>}</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.openCount}</p>
        </div>
        
        {/* Win / Loss */}
        <div className="stat-card border-green-500">
          <p className="text-sm text-gray-500">Win / Loss {isAllTime && <span className="text-purple-500 text-xs">(All-Time)</span>}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            <span className="text-green-600">{stats.winCount}</span>
            {' / '}
            <span className="text-red-600">{stats.lossCount}</span>
          </p>
        </div>
        
        {/* Win Rate */}
        <div className="stat-card border-purple-500">
          <p className="text-sm text-gray-500">Win Rate {isAllTime && <span className="text-purple-500 text-xs">(All-Time)</span>}</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{stats.winRate}%</p>
        </div>
        
        {/* Total P&L */}
        <div className="stat-card border-primary-500">
          <p className="text-sm text-gray-500 mb-1">Total P&L {isAllTime && <span className="text-purple-500 text-xs">(All-Time)</span>}</p>
          <div className="space-y-1">
            {Object.keys(stats.plByCurrency).length > 0 ? (
              Object.entries(stats.plByCurrency).map(([currency, amount]) => (
                <p key={currency} className={`text-lg font-bold ${amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {amount >= 0 ? '+' : ''}{formatCurrency(amount, currency)}
                </p>
              ))
            ) : (
              <p className="text-2xl font-bold text-gray-400">0</p>
            )}
          </div>
        </div>
      </div>

      {/* Best / Worst Trade */}
      {(stats.bestTrade || stats.worstTrade) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {stats.bestTrade && (
            <div className="stat-card border-green-400">
              <p className="text-sm text-gray-500">Best Trade</p>
              <p className="text-base font-bold text-green-600 mt-1">
                {stats.bestTrade.symbol} &nbsp;
                <span className="text-sm font-normal text-gray-500">({stats.bestTrade.leverage || 1}x)</span>
              </p>
              <p className="text-lg font-bold text-green-600">
                +{formatCurrency(stats.bestTrade.profit_loss, stats.bestTrade.exit_currency || stats.bestTrade.wallet?.currency)}
              </p>
            </div>
          )}
          {stats.worstTrade && (
            <div className="stat-card border-red-400">
              <p className="text-sm text-gray-500">Worst Trade</p>
              <p className="text-base font-bold text-red-600 mt-1">
                {stats.worstTrade.symbol} &nbsp;
                <span className="text-sm font-normal text-gray-500">({stats.worstTrade.leverage || 1}x)</span>
              </p>
              <p className="text-lg font-bold text-red-600">
                {formatCurrency(stats.worstTrade.profit_loss, stats.worstTrade.exit_currency || stats.worstTrade.wallet?.currency)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Live Open Trades Section */}
      {filteredTrades.filter(t => t.status === 'open').length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            📈 Open Positions - Live Tracking
            <span className="text-sm font-normal text-gray-500">
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