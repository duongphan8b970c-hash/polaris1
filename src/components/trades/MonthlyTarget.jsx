import { useState, useMemo } from 'react'
import { formatCurrency } from '../../utils'

const STORAGE_KEY = 'trade_monthly_targets'

function getStoredTargets() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

function storeTargets(targets) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(targets))
  } catch {
    // ignore storage errors
  }
}

export default function MonthlyTarget({ trades, selectedMonth }) {
  const [targets, setTargets] = useState(getStoredTargets)
  const [editingTarget, setEditingTarget] = useState(false)
  const [targetInput, setTargetInput] = useState('')

  // Get current month key
  const monthKey = useMemo(() => {
    if (selectedMonth === 'all') {
      const now = new Date()
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    }
    return selectedMonth
  }, [selectedMonth])

  const monthLabel = useMemo(() => {
    const [year, month] = monthKey.split('-').map(Number)
    return `Tháng ${month}/${year}`
  }, [monthKey])

  const currentTarget = targets[monthKey] || 0

  // Calculate current month P&L from closed trades
  const monthPL = useMemo(() => {
    const [year, month] = monthKey.split('-').map(Number)
    return trades
      .filter(t => {
        if (t.status !== 'closed' || !t.profit_loss) return false
        const d = new Date(t.created_at)
        return d.getFullYear() === year && d.getMonth() + 1 === month
      })
      .reduce((sum, t) => sum + (t.profit_loss || 0), 0)
  }, [trades, monthKey])

  const monthTradeCount = useMemo(() => {
    const [year, month] = monthKey.split('-').map(Number)
    return trades.filter(t => {
      const d = new Date(t.created_at)
      return d.getFullYear() === year && d.getMonth() + 1 === month
    }).length
  }, [trades, monthKey])

  const monthWinCount = useMemo(() => {
    const [year, month] = monthKey.split('-').map(Number)
    return trades.filter(t => {
      if (t.status !== 'closed') return false
      const d = new Date(t.created_at)
      return d.getFullYear() === year && d.getMonth() + 1 === month && (t.profit_loss || 0) > 0
    }).length
  }, [trades, monthKey])

  const progress = currentTarget > 0 ? Math.min((monthPL / currentTarget) * 100, 200) : 0
  const isOnTarget = monthPL >= currentTarget && currentTarget > 0
  const progressCapped = Math.min(progress, 100)

  const handleStartEditing = () => {
    setTargetInput(currentTarget > 0 ? currentTarget.toString() : '')
    setEditingTarget(true)
  }

  const handleSaveTarget = () => {
    const val = parseFloat(targetInput)
    const newTargets = { ...targets }
    if (val > 0) {
      newTargets[monthKey] = val
    } else {
      delete newTargets[monthKey]
    }
    setTargets(newTargets)
    storeTargets(newTargets)
    setEditingTarget(false)
  }

  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
          🎯 Mục tiêu {monthLabel}
        </h3>
        <button
          type="button"
          onClick={() => editingTarget ? setEditingTarget(false) : handleStartEditing()}
          className="text-xs text-primary-600 hover:text-primary-800 font-medium"
        >
          {editingTarget ? 'Hủy' : (currentTarget > 0 ? 'Sửa mục tiêu' : '+ Đặt mục tiêu')}
        </button>
      </div>

      {editingTarget && (
        <div className="flex gap-2 mb-3">
          <input
            type="number"
            value={targetInput}
            onChange={(e) => setTargetInput(e.target.value)}
            className="input text-sm flex-1"
            placeholder="Nhập mục tiêu P&L (USDT)..."
            step="0.01"
            min="0"
            autoFocus
          />
          <button
            type="button"
            onClick={handleSaveTarget}
            className="btn btn-primary text-sm px-4"
          >
            Lưu
          </button>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center">
          <p className="text-xs text-gray-400">Trades</p>
          <p className="text-lg font-bold text-gray-800">{monthTradeCount}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400">Wins</p>
          <p className="text-lg font-bold text-green-600">{monthWinCount}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400">P&L</p>
          <p className={`text-lg font-bold ${monthPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {monthPL >= 0 ? '+' : ''}{formatCurrency(monthPL, 'USDT')}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      {currentTarget > 0 && (
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-500">
              Tiến độ: {progress.toFixed(1)}%
            </span>
            <span className="text-xs text-gray-500">
              Mục tiêu: {formatCurrency(currentTarget, 'USDT')}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isOnTarget
                  ? 'bg-gradient-to-r from-green-400 to-green-600'
                  : monthPL < 0
                    ? 'bg-gradient-to-r from-red-400 to-red-500'
                    : 'bg-gradient-to-r from-primary-400 to-primary-600'
              }`}
              style={{ width: `${Math.max(progressCapped, monthPL < 0 ? 2 : 0)}%` }}
            />
          </div>
          {isOnTarget && (
            <p className="text-xs text-green-600 font-medium mt-1 text-center">
              🎉 Đã đạt mục tiêu!
            </p>
          )}
          {!isOnTarget && currentTarget > 0 && monthPL >= 0 && (
            <p className="text-xs text-gray-400 mt-1 text-center">
              Còn {formatCurrency(currentTarget - monthPL, 'USDT')} nữa
            </p>
          )}
        </div>
      )}

      {currentTarget === 0 && !editingTarget && (
        <p className="text-xs text-gray-400 text-center py-2">
          Chưa đặt mục tiêu cho tháng này
        </p>
      )}
    </div>
  )
}
