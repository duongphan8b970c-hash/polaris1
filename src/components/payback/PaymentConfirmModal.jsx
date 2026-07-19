import { useState } from 'react'
import { useWallets } from '../../hooks/finance/useWallets'
import { useCategories } from '../../hooks/finance/useCategories'
import Modal from '../common/Modal'
import { formatNumber } from '../../utils'

export default function PaymentConfirmModal({ goal, goalType = 'payback', onConfirm, onClose, loading }) {
  const { wallets } = useWallets()
  const isPlan = goalType === 'plan'
  const { categories } = useCategories(isPlan ? 'expense' : null)
  const planCategory = isPlan ? categories.find(c => c.id === goal.category_id) : null
  const categoryLabel = isPlan
    ? (planCategory ? `${planCategory.icon || ''} ${planCategory.name}`.trim() : '(chưa chọn)')
    : 'Payback'

  // Phần còn lại cần trả (payback) / dự kiến chi (plan).
  const remaining = Math.max(
    (goal.remaining != null ? goal.remaining : goal.target_amount) || 0,
    0
  )

  const [mode, setMode] = useState('full') // 'full' | 'partial'
  const [partialAmount, setPartialAmount] = useState('')
  const [walletId, setWalletId] = useState('')

  const payAmount = mode === 'full' ? remaining : parseFloat(partialAmount || 0)
  const selectedWallet = wallets.find(w => w.id === walletId)

  const handleConfirm = () => {
    if (!walletId) {
      alert('Vui lòng chọn ví thanh toán')
      return
    }
    if (!payAmount || payAmount <= 0) {
      alert('Vui lòng nhập số tiền hợp lệ')
      return
    }
    if (mode === 'partial' && payAmount > remaining) {
      const ok = confirm(
        `Số tiền (${formatNumber(payAmount)} ₫) lớn hơn phần còn lại (${formatNumber(remaining)} ₫).\n` +
        `Mục tiêu sẽ được đánh dấu hoàn thành. Tiếp tục?`
      )
      if (!ok) return
    }
    onConfirm({
      amount: payAmount,
      walletId,
      isFull: mode === 'full' || payAmount >= remaining
    })
  }

  return (
    <Modal isOpen={true} onClose={onClose} title={isPlan ? 'Xác nhận đã chi tiêu' : 'Xác nhận đã thanh toán'}>
      <div className="space-y-4">
        {/* Goal summary */}
        <div className={`rounded-lg p-4 border ${isPlan ? 'bg-teal-50 border-teal-200' : 'bg-orange-50 border-orange-200'}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{isPlan ? '📋' : '💳'}</span>
            <h4 className="font-bold text-gray-900">{goal.name}</h4>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-gray-600">{isPlan ? 'Dự kiến chi:' : 'Còn lại cần trả:'}</span>
            <span className={`font-bold ${isPlan ? 'text-teal-700' : 'text-red-600'}`}>
              {formatNumber(remaining)} ₫
            </span>
          </div>
        </div>

        {/* Full vs partial */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Số tiền thanh toán</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMode('full')}
              className={`px-4 py-3 rounded-lg font-medium border-2 transition-all ${
                mode === 'full'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
              disabled={loading}
            >
              ✅ Thanh toán tất cả
              <span className="block text-xs opacity-70 mt-0.5">{formatNumber(remaining)} ₫</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('partial')}
              className={`px-4 py-3 rounded-lg font-medium border-2 transition-all ${
                mode === 'partial'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
              disabled={loading}
            >
              ✂️ Thanh toán 1 phần
            </button>
          </div>
        </div>

        {/* Partial amount input */}
        {mode === 'partial' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số tiền (₫) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={partialAmount}
              onChange={(e) => setPartialAmount(e.target.value)}
              className="input"
              placeholder="0"
              step="1000"
              min="0"
              max={remaining}
              disabled={loading}
              autoFocus
            />
            {partialAmount && (
              <p className="text-xs text-blue-600 font-medium mt-1">
                = {formatNumber(parseFloat(partialAmount || 0))} ₫
                {parseFloat(partialAmount || 0) < remaining && (
                  <span className="text-gray-500">
                    {' '}· còn lại sau thanh toán: {formatNumber(remaining - parseFloat(partialAmount || 0))} ₫
                  </span>
                )}
              </p>
            )}
          </div>
        )}

        {/* Wallet selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Trừ từ ví <span className="text-red-500">*</span>
          </label>
          <select
            value={walletId}
            onChange={(e) => setWalletId(e.target.value)}
            className="input"
            disabled={loading}
            required
          >
            <option value="">Chọn ví thanh toán</option>
            {wallets.map(wallet => (
              <option key={wallet.id} value={wallet.id}>
                {wallet.name} ({wallet.currency}) — {formatNumber(wallet.current_amount || 0)}
              </option>
            ))}
          </select>
          {selectedWallet && payAmount > (selectedWallet.current_amount || 0) && (
            <p className="text-xs text-amber-600 mt-1">
              ⚠️ Số dư ví không đủ ({formatNumber(selectedWallet.current_amount || 0)} ₫)
            </p>
          )}
        </div>

        {/* Info about auto transaction */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600">
          💡 Một giao dịch chi tiêu sẽ được tạo tự động với danh mục{' '}
          <span className="font-semibold">{categoryLabel}</span> và mô tả{' '}
          <span className="font-semibold">"{goal.name}"</span>.
          {isPlan && goal.recurrence && goal.recurrence !== 'none' && (
            <> Sau khi hoàn thành, một kế hoạch {goal.recurrence === 'weekly' ? 'hàng tuần' : 'hàng tháng'} mới sẽ được tạo.</>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            disabled={loading}
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : 'Xác nhận'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
