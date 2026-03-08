import { formatCurrency } from '../../utils'

export default function WalletCard({ wallet, onEdit, onDelete }) {
  const balanceChange = wallet.current_amount - wallet.initial_amount
  const isPositive = balanceChange >= 0

  return (
    <div className="card card-hover">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{wallet.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{wallet.currency}</p>
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
      {/* Reset Balance Button */}
      <button
        onClick={() => setShowResetForm(!showResetForm)}
        className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Reset số dư
      </button>

      {/* Reset Form */}
      {showResetForm && (
        <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg space-y-2">
          <p className="text-xs text-gray-700">
            💡 Nhập số dư mới. Hệ thống sẽ tự động tạo giao dịch "Correct balance".
          </p>
          <input
            type="number"
            value={newBalance}
            onChange={(e) => setNewBalance(e.target.value)}
            placeholder="Nhập số dư mới"
            className="input text-sm"
          />
          <div className="flex gap-2">
            <button onClick={handleReset} className="btn btn-primary btn-sm flex-1">
              Xác nhận
            </button>
            <button onClick={() => setShowResetForm(false)} className="btn btn-secondary btn-sm flex-1">
              Hủy
            </button>
          </div>
        </div>
      )}
      <div className="space-y-3">
        <div>
          <p className="text-sm text-gray-500">Số dư hiện tại</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatCurrency(wallet.current_amount, wallet.currency)}
          </p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <div>
            <p className="text-xs text-gray-500">Số dư ban đầu</p>
            <p className="text-sm font-medium text-gray-700">
              {formatCurrency(wallet.initial_amount, wallet.currency)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
