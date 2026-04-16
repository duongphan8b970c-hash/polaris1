import { useState } from 'react'
import { useCategories } from '../../hooks/finance/useCategories'
import { getBudgetPeriodLabel } from '../../utils/budgetPeriod'

export default function BudgetForm({ budget, presetCategoryId, onSubmit, onCancel, loading }) {
  const { categories } = useCategories('expense') // Only expense categories
  
  const [formData, setFormData] = useState(() => {
    if (budget) {
      return {
        category_id: budget.category_id,
        amount: budget.amount,
        period: budget.period,
        period_start_day: budget.period_start_day || 1,
        period_start_month: budget.period_start_month || 1,
      }
    }
    return {
      category_id: presetCategoryId || '',
      amount: '',
      period: 'monthly',
      period_start_day: 1,
      period_start_month: 1,
    }
  })

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
      [name]: (name === 'period_start_day' || name === 'period_start_month')
        ? parseInt(value, 10)
        : value
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

      {/* Period Start Day */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ngày bắt đầu kỳ <span className="text-red-500">*</span>
        </label>
        <select
          name="period_start_day"
          value={formData.period_start_day}
          onChange={handleChange}
          className="input"
          disabled={loading}
        >
          {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
            <option key={day} value={day}>
              Ngày {day}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          💡 Ngày bắt đầu tính hạn mức mỗi {formData.period === 'monthly' ? 'tháng' : 'năm'} (theo kỳ lương)
        </p>
      </div>

      {/* Period Start Month (yearly only) */}
      {formData.period === 'yearly' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tháng bắt đầu kỳ <span className="text-red-500">*</span>
          </label>
          <select
            name="period_start_month"
            value={formData.period_start_month}
            onChange={handleChange}
            className="input"
            disabled={loading}
          >
            {[
              'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
              'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
              'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
            ].map((label, i) => (
              <option key={i + 1} value={i + 1}>
                {label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Period Preview */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
        <p className="text-xs text-blue-700">
          📅 Kỳ hiện tại: <span className="font-semibold">{getBudgetPeriodLabel(formData)}</span>
        </p>
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