export default function SmartEndDateInput({ 
  goal, 
  value, 
  onChange, 
  disabled = false 
}) {
  const isCompleted = goal?.status === 'completed'

  const validateDate = (dateStr) => {
    if (!dateStr) return null

    const inputDate = new Date(dateStr)
    const startDate = goal?.start_date ? new Date(goal.start_date) : null
    const today = new Date()

    if (startDate && inputDate < startDate) {
      return {
        type: 'error',
        message: '❌ Ngày hoàn thành không thể trước ngày bắt đầu'
      }
    }

    if (isCompleted && inputDate > today) {
      return {
        type: 'warning',
        message: '⚠️ Ngày hoàn thành trong tương lai?'
      }
    }

    return null
  }

  const validation = validateDate(value)

  // ✅ FIX: Hide entire field if goal not completed
  if (!isCompleted) {
    return null
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Ngày hoàn thành thực tế
        <span className="text-red-500 ml-1">*</span>
      </label>

      {/* Date Input */}
      <input
        type="date"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`input ${validation?.type === 'error' ? 'border-red-500' : ''}`}
        required
      />

      {/* Validation Messages */}
      {validation && (
        <p className={`text-sm ${
          validation.type === 'error' ? 'text-red-600' : 'text-yellow-600'
        }`}>
          {validation.message}
        </p>
      )}

      {/* Helper Text */}
      <p className="text-xs text-gray-500">
        💡 Ngày bạn thực sự hoàn thành goal này
      </p>
    </div>
  )
}