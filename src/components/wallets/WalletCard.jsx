import { useState } from 'react'
import { formatCurrency } from '../../utils'

export default function WalletCard({ wallet, onEdit, onDelete, onResetBalance }) {
  const balanceChange = wallet.current_amount - wallet.initial_amount
  const isPositive = balanceChange >= 0
  
  const [showResetForm, setShowResetForm] = useState(false)
  const [newBalance, setNewBalance] = useState('')

  const handleReset = () => {
    const balance = parseFloat(newBalance)
    if (isNaN(balance)) {
      alert('Vui lòng nhập số dư hợp lệ')
      return
    }
    
    if (!window.confirm(`Xác nhận reset số dư ví "${wallet.name}" thành ${balance.toLocaleString()} ${wallet.currency}?`)) {
      return
    }
    
    onResetBalance(wallet.id, balance)
    setShowResetForm(false)
    setNewBalance('')
  }

  return (
    <div className="card card-hover">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{wallet.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{wallet.type} • {wallet.currency}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(wallet)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Sửa"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(wallet)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Xóa"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Current Balance */}
      <div className="mb-4">
        <p className="text-sm text-gray-500 mb-1">Số dư hiện tại</p>
        <p className="text-3xl font-bold text-gray-900">
          {formatCurrency(wallet.current_amount, wallet.currency)}
        </p>
      </div>

      {/* Balance Info */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200 mb-3">
        <div>
          <p className="text-xs text-gray-500">Thay đổi</p>
          <p className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}{formatCurrency(balanceChange, wallet.currency)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Số dư ban đầu</p>
          <p className="text-sm font-medium text-gray-700">
            {formatCurrency(wallet.initial_amount, wallet.currency)}
          </p>
        </div>
      </div>

      {/* Reset Button */}
      <button
        onClick={() => setShowResetForm(!showResetForm)}
        className="w-full text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50 font-medium flex items-center justify-center gap-1 py-2 rounded-lg transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {showResetForm ? 'Đóng' : 'Reset số dư'}
      </button>

      {/* Reset Form */}
      {showResetForm && (
        <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg space-y-2">
          <p className="text-xs text-gray-700">
            💡 Nhập số dư mới. Hệ thống sẽ tự động tạo giao dịch điều chỉnh "Correct balance".
          </p>
          <input
            type="number"
            value={newBalance}
            onChange={(e) => setNewBalance(e.target.value)}
            placeholder={`Ví dụ: ${wallet.current_amount}`}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
          />
          <div className="flex gap-2">
            <button 
              onClick={handleReset} 
              disabled={!newBalance}
              className="flex-1 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Xác nhận reset
            </button>
            <button 
              onClick={() => {
                setShowResetForm(false)
                setNewBalance('')
              }} 
              className="flex-1 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
          </div>
        </div>
      )}
    </div>
  )
}