import { useState, useEffect } from 'react'

const WALLET_TYPES = [
  { value: 'bank', label: 'Ngân hàng', icon: '🏦' },
  { value: 'cash', label: 'Tiền mặt', icon: '💵' },
  { value: 'ewallet', label: 'Ví điện tử', icon: '📱' },
  { value: 'credit_card', label: 'Thẻ tín dụng', icon: '💳' },
  { value: 'investment', label: 'Đầu tư', icon: '📈' },
  { value: 'other', label: 'Khác', icon: '💰' },
]

const CURRENCIES = [
  { value: 'VND', label: 'VND (₫)', symbol: '₫' },
  { value: 'USD', label: 'USD ($)', symbol: '$' },
  { value: 'EUR', label: 'EUR (€)', symbol: '€' },
  { value: 'USDT', label: 'USDT', symbol: '$' },
]

export default function WalletForm({ wallet, onSubmit, onCancel, loading }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'bank',
    currency: 'VND',
    initial_amount: '',
  })

  useEffect(() => {
    if (wallet) {
      setFormData({
        name: wallet.name,
        type: wallet.type,
        currency: wallet.currency,
        initial_amount: wallet.initial_amount,
      })
    }
  }, [wallet])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.name?.trim()) {
      alert('Vui lòng nhập tên ví')
      return
    }
    
    const amount = parseFloat(formData.initial_amount)
    if (isNaN(amount) || amount < 0) {
      alert('Số dư ban đầu không hợp lệ')
      return
    }
    
    onSubmit({
      ...formData,
      initial_amount: amount
    })
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const selectedType = WALLET_TYPES.find(t => t.value === formData.type)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tên ví <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="input"
          placeholder="VD: VCB, Momo, Tiền mặt..."
          required
          disabled={loading}
          autoFocus
        />
      </div>

      {/* Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Loại ví <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {WALLET_TYPES.map(type => (
            <button
              key={type.value}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
              className={`p-3 rounded-lg border-2 transition-all ${
                formData.type === type.value
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
              disabled={loading}
            >
              <div className="text-2xl mb-1">{type.icon}</div>
              <div className="text-sm font-medium">{type.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Currency */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Loại tiền <span className="text-red-500">*</span>
        </label>
        <select
          name="currency"
          value={formData.currency}
          onChange={handleChange}
          className="input"
          required
          disabled={loading}
        >
          {CURRENCIES.map(curr => (
            <option key={curr.value} value={curr.value}>
              {curr.label}
            </option>
          ))}
        </select>
      </div>

      {/* Initial Amount */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Số dư ban đầu <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          name="initial_amount"
          value={formData.initial_amount}
          onChange={handleChange}
          className="input"
          placeholder="0.00"
          step="0.01"
          min="0"
          required
          disabled={loading || wallet} // Disable when editing
        />
        {wallet ? (
          <p className="text-xs text-amber-600 mt-1">
            ⚠️ Không thể thay đổi số dư ban đầu
          </p>
        ) : (
          <p className="text-xs text-gray-500 mt-1">
            💡 Số dư hiện tại của ví. Hệ thống sẽ tự động tracking thay đổi theo tháng.
          </p>
        )}
      </div>

      {/* Preview */}
      {!wallet && formData.name && (
        <div className="border-t pt-4">
          <p className="text-sm text-gray-600 mb-2">Xem trước:</p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedType?.icon}</span>
                <div>
                  <p className="font-semibold text-gray-900">{formData.name}</p>
                  <p className="text-xs text-gray-500">{selectedType?.label}</p>
                </div>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {parseFloat(formData.initial_amount || 0).toLocaleString('vi-VN')} {CURRENCIES.find(c => c.value === formData.currency)?.symbol}
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary flex-1"
          disabled={loading}
        >
          Hủy
        </button>
        <button
          type="submit"
          className="btn btn-primary flex-1"
          disabled={loading}
        >
          {loading ? 'Đang lưu...' : (wallet ? 'Cập nhật' : 'Tạo mới')}
        </button>
      </div>
    </form>
  )
}