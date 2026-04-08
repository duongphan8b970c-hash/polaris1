import { useState, useEffect } from 'react'
import { useCategories } from '../../hooks/finance/useCategories'

export default function BudgetForm({ budget, presetCategoryId, onSubmit, onCancel, loading }) {
  const { categories } = useCategories('expense') // Only expense categories
  
  const [formData, setFormData] = useState({
    category_id: presetCategoryId || '',
    amount: '',
    period: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    if (budget) {
      setFormData({
        category_id: budget.category_id,
        amount: budget.amount,
        period: budget.period,
        start_date: budget.start_date,
      })
    } else if (presetCategoryId) {
      setFormData(prev => ({ ...prev, category_id: presetCategoryId }))
    }
  }, [budget, presetCategoryId])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.category_id) {
      alert('Vui lòng chọn danh mục')
      return
    }
    
    const amount = parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) {
      alert('Số tiền không hợp lệ')
      return
    }
    
    onSubmit(formData)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Danh mục <span className="text-red-500">*</span>
        </label>
        <select
          name="category_id"
          value={formData.category_id}
          onChange={handleChange}
          className="input"
          required
          disabled={loading || budget}
        >
          <option value="">Chọn danh mục</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>
        {budget && (
          <p className="text-xs text-amber-600 mt-1">
            ⚠️ Không thể thay đổi danh mục
          </p>
        )}
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Hạn mức (₫) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          className="input"
          placeholder="0"
          step="1000"
          min="0"
          required
          disabled={loading}
          autoFocus
        />
        <p className="text-xs text-gray-500 mt-1">
          💡 Số tiền tối đa cho phép chi tiêu
        </p>
      </div>

      {/* Period */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Chu kỳ <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, period: 'monthly' }))}
            className={`py-3 px-4 rounded-lg font-medium transition-all ${
              formData.period === 'monthly'
                ? 'bg-primary-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            disabled={loading}
          >
            Hàng tháng
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, period: 'yearly' }))}
            className={`py-3 px-4 rounded-lg font-medium transition-all ${
              formData.period === 'yearly'
                ? 'bg-primary-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            disabled={loading}
          >
            Hàng năm
          </button>
        </div>
      </div>

      {/* Start Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ngày bắt đầu <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          name="start_date"
          value={formData.start_date}
          onChange={handleChange}
          className="input"
          required
          disabled={loading || budget}
        />
        {budget && (
          <p className="text-xs text-amber-600 mt-1">
            ⚠️ Không thể thay đổi ngày bắt đầu
          </p>
        )}
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
          {loading ? 'Đang lưu...' : (budget ? 'Cập nhật' : 'Tạo mới')}
        </button>
      </div>
    </form>
  )
}