import { useState, useEffect } from 'react'
import { useWallets } from '../../hooks/useWallets'
import { useCategories } from '../../hooks/useCategories'
import { formatDate } from '../../lib/utils'

export default function TransactionForm({ transaction, onSubmit, onCancel, loading }) {
  const { wallets } = useWallets()
  const [transactionType, setTransactionType] = useState(transaction?.type || 'expense')
  const { categories } = useCategories(transactionType)
  
  const [formData, setFormData] = useState({
    wallet_id: '',
    category_id: '',
    type: 'expense',
    amount: '',
    description: '',
    date: formatDate(new Date(), 'yyyy-MM-dd'),
  })

  useEffect(() => {
    if (transaction) {
      setFormData({
        wallet_id: transaction.wallet_id,
        category_id: transaction.category_id,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description || '',
        date: formatDate(transaction.date, 'yyyy-MM-dd'),
      })
      setTransactionType(transaction.type)
    }
  }, [transaction])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    
    if (name === 'type') {
      setTransactionType(value)
      setFormData(prev => ({
        ...prev,
        type: value,
        category_id: '', // Reset category when type changes
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Transaction Type */}
      <div>
        <label className="label label-required">Loại giao dịch</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleChange({ target: { name: 'type', value: 'income' } })}
            className={`py-3 px-4 rounded-lg font-medium transition-all ${
              formData.type === 'income'
                ? 'bg-green-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            disabled={loading}
          >
            <svg className="w-5 h-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
            </svg>
            Thu nhập
          </button>
          <button
            type="button"
            onClick={() => handleChange({ target: { name: 'type', value: 'expense' } })}
            className={`py-3 px-4 rounded-lg font-medium transition-all ${
              formData.type === 'expense'
                ? 'bg-red-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            disabled={loading}
          >
            <svg className="w-5 h-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
            </svg>
            Chi tiêu
          </button>
        </div>
      </div>

      {/* Wallet */}
      <div>
        <label className="label label-required">Ví</label>
        <select
          name="wallet_id"
          value={formData.wallet_id}
          onChange={handleChange}
          className="input"
          required
          disabled={loading}
        >
          <option value="">-- Chọn ví --</option>
          {wallets.map(wallet => (
            <option key={wallet.id} value={wallet.id}>
              {wallet.name} ({wallet.currency})
            </option>
          ))}
        </select>
      </div>

      {/* Category */}
      <div>
        <label className="label label-required">Danh mục</label>
        <select
          name="category_id"
          value={formData.category_id}
          onChange={handleChange}
          className="input"
          required
          disabled={loading}
        >
          <option value="">-- Chọn danh mục --</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.icon} {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Amount */}
      <div>
        <label className="label label-required">Số tiền</label>
        <input
          type="number"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          className="input"
          placeholder="0"
          step="0.01"
          min="0"
          required
          disabled={loading}
        />
      </div>

      {/* Date */}
      <div>
        <label className="label label-required">Ngày</label>
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          className="input"
          required
          disabled={loading}
        />
      </div>

      {/* Description */}
      <div>
        <label className="label">Ghi chú</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="input"
          rows="3"
          placeholder="Ghi chú về giao dịch này..."
          disabled={loading}
        />
      </div>

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
          {loading ? 'Đang lưu...' : (transaction ? 'Cập nhật' : 'Tạo mới')}
        </button>
      </div>
    </form>
  )
}
