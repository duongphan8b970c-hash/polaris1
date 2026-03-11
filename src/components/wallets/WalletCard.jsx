import { useState } from 'react'
import { formatCurrency } from '../../utils'
import { useNavigate } from 'react-router-dom'

export default function WalletCard({ wallet, onEdit, onDelete, onResetBalance }) {
  const navigate = useNavigate()
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
    <div className="card card-hover relative overflow-hidden">
      {/* Background gradient decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full -mr-16 -mt-16 opacity-60"></div>
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-gray-900 truncate">{wallet.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{wallet.type} • {wallet.currency}</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
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
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 mb-4">
          <div>
            <p className="text-xs text-gray-500">Thay đổi</p>
            <p className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}{formatCurrency(balanceChange, wallet.currency)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Số dư ban đầu</p>
            <p className="text-sm font-medium text-gray-700">
              {formatCurrency(wallet.initial_amount, wallet.currency)}
            </p>
          </div>
        </div>

        {/* ✅ Action Buttons - 2 buttons in one row */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={() => navigate(`/wallets/history?wallet=${wallet.id}`)}
            className="px-3 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="hidden sm:inline">Xem lịch sử</span>
            <span className="sm:hidden">Lịch sử</span>
          </button>

          <button
            onClick={() => setShowResetForm(!showResetForm)}
            className="px-3 py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden sm:inline">{showResetForm ? 'Đóng' : 'Reset số dư'}</span>
            <span className="sm:hidden">{showResetForm ? 'Đóng' : 'Reset'}</span>
          </button>
        </div>

        {/* Reset Form - Collapsible */}
        {showResetForm && (
          <div className="mt-3 p-4 bg-orange-50 border-2 border-orange-200 rounded-lg space-y-3 animate-fadeIn">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-gray-700">
                Nhập số dư mới. Hệ thống sẽ tự động tạo giao dịch điều chỉnh <strong>"Balance Correction"</strong>.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Số dư mới ({wallet.currency})
              </label>
              <input
                type="number"
                step="0.01"
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
                placeholder={wallet.current_amount.toString()}
                className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                autoFocus
              />
            </div>

            <div className="flex gap-2">
              <button 
                onClick={handleReset} 
                disabled={!newBalance || newBalance === ''}
                className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Xác nhận
              </button>
              <button 
                onClick={() => {
                  setShowResetForm(false)
                  setNewBalance('')
                }} 
                className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        )}

        {/* Description (if exists) */}
        {wallet.description && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-600 italic">{wallet.description}</p>
          </div>
        )}

        {/* Footer - Last updated */}
        <div className="mt-3 text-xs text-gray-400 text-right">
          Cập nhật: {new Date(wallet.updated_at).toLocaleDateString('vi-VN')}
        </div>
      </div>
    </div>
  )
}