import { useState } from 'react'
import { formatCurrency } from '../../lib/utils'

export default function QuickCloseModal({ isOpen, trade, resultType, onConfirm, onCancel }) {
  const [exitPrice, setExitPrice] = useState('')
  const [profitLoss, setProfitLoss] = useState('')
  
  if (!isOpen || !trade) return null

  const isWin = resultType === 'win'
  const walletCurrency = trade.wallet?.currency || trade.exit_currency || 'USDT'

  const handleConfirm = () => {
    const exit = parseFloat(exitPrice)
    const pl = parseFloat(profitLoss)
    
    if (!exit || exit <= 0) {
      alert('Vui lòng nhập giá ra hợp lệ')
      return
    }
    
    if (pl === undefined || pl === null || isNaN(pl) || pl === 0) {
      alert('Vui lòng nhập số tiền lãi/lỗ (khác 0)')
      return
    }
    
    const finalPL = isWin ? Math.abs(pl) : -Math.abs(pl)
    onConfirm(trade, finalPL, exit)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onCancel}></div>
      
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${
            isWin ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {isWin ? (
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          
          <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
            Đánh dấu {isWin ? 'WIN' : 'LOSS'}
          </h3>
          
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Symbol:</span>
              <span className="font-medium">{trade.symbol}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Loại:</span>
              <span className={`font-medium ${trade.side === 'buy' ? 'text-green-600' : 'text-red-600'}`}>
                {trade.side === 'buy' ? '↑ BUY' : '↓ SELL'}
              </span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Leverage:</span>
              <span className="font-medium">{trade.leverage || 1}x</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Giá vào:</span>
              <span className="font-medium">{trade.entry_price?.toFixed(2)} {trade.entry_currency || 'USD'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Số tiền đầu tư:</span>
              <span className="font-medium">{formatCurrency(trade.amount, walletCurrency)}</span>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giá ra ({walletCurrency})
            </label>
            <input
              type="number"
              value={exitPrice}
              onChange={(e) => setExitPrice(e.target.value)}
              className="input"
              placeholder="0.00"
              step="0.00000001"
              min="0"
              autoFocus
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số tiền {isWin ? 'lãi' : 'lỗ'} ({walletCurrency})
            </label>
            <input
              type="number"
              value={profitLoss}
              onChange={(e) => setProfitLoss(e.target.value)}
              className="input"
              placeholder="Nhập số tiền (dương)"
              step="0.01"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Chỉ nhập số dương, hệ thống tự điều chỉnh dấu
            </p>
          </div>
          
          {profitLoss && exitPrice && (
            <div className={`p-4 rounded-lg mb-4 ${
              isWin ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Giá vào:</span>
                  <span className="font-medium">{trade.entry_price?.toFixed(2)} USD</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Giá ra:</span>
                  <span className="font-medium">{parseFloat(exitPrice).toFixed(2)} {walletCurrency}</span>
                </div>
                <hr className="border-gray-300" />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Kết quả:</span>
                  <span className={`text-xl font-bold ${isWin ? 'text-green-600' : 'text-red-600'}`}>
                    {isWin ? '+' : '-'}{formatCurrency(parseFloat(profitLoss), walletCurrency)}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex gap-3">
            <button onClick={onCancel} className="btn btn-secondary flex-1">
              Hủy
            </button>
            <button
              onClick={handleConfirm}
              className={`btn text-white flex-1 ${
                isWin ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              }`}
              disabled={!exitPrice || !profitLoss}
            >
              Xác nhận
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}