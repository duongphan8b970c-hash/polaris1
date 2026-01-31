import { useState } from 'react'
import PageHeader from '../components/layout/PageHeader'
import TradeList from '../components/trades/TradeList'
import TradeForm from '../components/trades/TradeForm'
import Modal from '../components/common/Modal'
import Loading from '../components/common/Loading'
import ErrorMessage from '../components/common/ErrorMessage'
import { useTrades } from '../hooks/useTrades'
import { formatCurrency } from '../lib/utils'
import ErrorModal from '../components/common/ErrorModal'
import QuickCloseModal from '../components/trades/QuickCloseModal'

export default function TradeTracking() {
  const [filters, setFilters] = useState({})
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
      // Calculate statistics
  const stats = trades.reduce((acc, t) => {
    if (t.status === 'closed') {
      acc.closedCount++
      
      const pl = t.profit_loss || 0
      const currency = t.exit_currency || t.wallet?.currency || 'USDT'
      
      // Group P&L by currency
      if (!acc.plByCurrency[currency]) {
        acc.plByCurrency[currency] = 0
      }
      acc.plByCurrency[currency] += pl
      
      if (pl > 0) {
        acc.winCount++
        acc.totalWin += pl
      } else if (pl < 0) {
        acc.lossCount++
        acc.totalLoss += Math.abs(pl)
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
    plByCurrency: {}
  })

  stats.winRate = stats.closedCount > 0 ? (stats.winCount / stats.closedCount * 100).toFixed(1) : 0

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
          <button onClick={handleCreate} className="btn btn-primary">
            <svg className="w-5 h-5 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Thêm trade
          </button>
        }
      />

           {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Open Trades */}
        <div className="stat-card border-blue-500">
          <p className="text-sm text-gray-500">Đang mở</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.openCount}</p>
        </div>
        
        {/* Win / Loss */}
        <div className="stat-card border-green-500">
          <p className="text-sm text-gray-500">Win / Loss</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            <span className="text-green-600">{stats.winCount}</span>
            {' / '}
            <span className="text-red-600">{stats.lossCount}</span>
          </p>
        </div>
        
        {/* Win Rate */}
        <div className="stat-card border-purple-500">
          <p className="text-sm text-gray-500">Win Rate</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{stats.winRate}%</p>
        </div>
        
        {/* Total P&L */}
        <div className="stat-card border-primary-500">
          <p className="text-sm text-gray-500 mb-1">Total P&L</p>
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

      <TradeList
        trades={trades}
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
    </div>
  )
}