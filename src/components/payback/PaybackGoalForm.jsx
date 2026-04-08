import { useState, useEffect } from 'react'
import { usePaybackPriorities } from '../../hooks/finance/usePaybackPriorities' 

export default function PaybackGoalForm({ goal, onSubmit, onCancel, loading }) {
  const { priorities } = usePaybackPriorities()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target_amount: '',
    initial_amount: '',
    start_date: new Date().toISOString().split('T')[0],
    deadline: '',
    priority_id: ''
  })

  useEffect(() => {
    if (goal) {
      setFormData({
        name: goal.name,
        description: goal.description || '',
        target_amount: goal.target_amount,
        initial_amount: goal.initial_amount || 0,
        start_date: goal.start_date,
        deadline: goal.deadline,
        priority_id: goal.priority_id || ''
      })
    }
  }, [goal])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validation
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên mục tiêu')
      return
    }

    const targetAmount = parseFloat(formData.target_amount)
    if (isNaN(targetAmount) || targetAmount <= 0) {
      alert('Số tiền mục tiêu không hợp lệ')
      return
    }

    if (!formData.deadline) {
      alert('Vui lòng chọn ngày hạn')
      return
    }

    // Check deadline is after start_date
    if (new Date(formData.deadline) <= new Date(formData.start_date)) {
      alert('Ngày hạn phải sau ngày bắt đầu')
      return
    }

    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tên mục tiêu <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="input"
          placeholder="Ví dụ: Trả tiền thẻ tín dụng"
          required
          disabled={loading}
          autoFocus
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mô tả
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
          className="input"
          placeholder="Chi tiết..."
          disabled={loading}
        />
      </div>

      <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Mức độ ưu tiên <span className="text-red-500">*</span>
  </label>
  <div className="grid grid-cols-3 gap-3">
    {priorities.map(priority => {
      const isSelected = formData.priority_id === priority.id
      return (
        <button
          key={priority.id}
          type="button"
          onClick={() => setFormData(prev => ({ ...prev, priority_id: priority.id }))}
          className={`p-3 rounded-lg border-2 transition-all text-center ${
            isSelected
              ? 'border-current ring-2 ring-offset-2'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          style={{
            backgroundColor: isSelected ? `${priority.color}20` : 'white',
            color: isSelected ? priority.color : '#374151',
            borderColor: isSelected ? priority.color : '#E5E7EB'
          }}
          disabled={loading}
        >
          <div className="text-2xl mb-1">{priority.icon}</div>
          <div className="text-sm font-semibold">{priority.name}</div>
          {priority.description && (
            <div className="text-xs opacity-70 mt-1">{priority.description}</div>
          )}
        </button>
          )
        })}
      </div>
      {priorities.length === 0 && (
        <p className="text-sm text-amber-600 mt-2">
          ⚠️ Chưa có priority nào. 
          <a href="/a-better-day/priorities" className="underline ml-1">Tạo priority</a>
        </p>
      )}
    </div>

      {/* Amounts */}
      <div className="grid grid-cols-2 gap-4">
        {/* Initial Amount (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tổng tiền ban đầu (₫)
          </label>
          <input
            type="number"
            name="initial_amount"
            value={formData.initial_amount}
            onChange={handleChange}
            className="input"
            placeholder="0"
            step="1000"
            min="0"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Không bắt buộc: Để theo dõi tổng tiền ban đầu
          </p>
        </div>

        {/* Target Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mục tiêu cần trả (₫) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="target_amount"
            value={formData.target_amount}
            onChange={handleChange}
            className="input"
            placeholder="0"
            step="1000"
            min="0"
            required
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            💰 Số tiền cần trả hết
          </p>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
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
            disabled={loading || goal} // Can't change start_date when editing
          />
          {goal && (
            <p className="text-xs text-amber-600 mt-1">
              ⚠️ Không thể thay đổi ngày bắt đầu
            </p>
          )}
        </div>

        {/* Deadline */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ngày hạn <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="deadline"
            value={formData.deadline}
            onChange={handleChange}
            className="input"
            required
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            ⏰ Dự kiến hoàn thành
          </p>
        </div>
      </div>

      {/* Preview */}
      {formData.name && formData.target_amount && (
        <div className="border-t pt-4">
          <p className="text-sm text-gray-600 mb-2">Xem trước:</p>
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-gray-900">{formData.name}</h4>
              <span className="text-2xl">💳</span>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              {formData.description || 'Chưa có mô tả'}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Mục tiêu:</span>
              <span className="font-bold text-red-600">
                {parseFloat(formData.target_amount || 0).toLocaleString('vi-VN')} ₫
              </span>
            </div>
            {formData.deadline && (
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm text-gray-600">Hạn:</span>
                <span className="text-sm font-medium text-gray-900">
                  {new Date(formData.deadline).toLocaleDateString('vi-VN')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          disabled={loading}
        >
          Hủy
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang lưu...
            </span>
          ) : (
            goal ? 'Cập nhật' : 'Tạo mục tiêu'
          )}
        </button>
      </div>
    </form>
  )
}