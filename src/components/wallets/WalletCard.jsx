import { formatCurrency } from '../../lib/utils'

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
