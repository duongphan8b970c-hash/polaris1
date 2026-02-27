import { useState, useEffect } from 'react'
import Modal from '../common/Modal'
import { RECURRENCE_PRESETS, formatRecurrenceRule, generateOccurrences } from '../../utils/recurrence'

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Hàng ngày', icon: '📅' },
  { value: 'weekly', label: 'Hàng tuần', icon: '📆' },
  { value: 'monthly', label: 'Hàng tháng', icon: '🗓️' }
]

const PRESET_OPTIONS = [
  { key: 'daily', label: 'Mỗi ngày', icon: '📅' },
  { key: 'weekdays', label: 'Ngày trong tuần (T2-T6)', icon: '💼' },
  { key: 'weekly', label: 'Mỗi tuần', icon: '📆' },
  { key: 'biweekly', label: 'Mỗi 2 tuần', icon: '📆' },
  { key: 'monthly', label: 'Mỗi tháng', icon: '🗓️' }
]

const DAY_OF_WEEK = [
  { value: 0, label: 'CN', fullLabel: 'Chủ nhật' },
  { value: 1, label: 'T2', fullLabel: 'Thứ 2' },
  { value: 2, label: 'T3', fullLabel: 'Thứ 3' },
  { value: 3, label: 'T4', fullLabel: 'Thứ 4' },
  { value: 4, label: 'T5', fullLabel: 'Thứ 5' },
  { value: 5, label: 'T6', fullLabel: 'Thứ 6' },
  { value: 6, label: 'T7', fullLabel: 'Thứ 7' }
]

export default function RecurrenceModal({ isOpen, onClose, onSave, initialData, loading }) {
  const [formData, setFormData] = useState({
    scheduled_date: '',
    recurrence_rule: null,
    is_calendar_visible: true
  })

  const [useRecurrence, setUseRecurrence] = useState(false)
  const [recurrenceMode, setRecurrenceMode] = useState('preset') // 'preset' or 'custom'

  useEffect(() => {
    if (initialData) {
      setFormData({
        scheduled_date: initialData.scheduled_date || '',
        recurrence_rule: initialData.recurrence_rule || null,
        is_calendar_visible: initialData.is_calendar_visible ?? true
      })
      setUseRecurrence(!!initialData.recurrence_rule)
    }
  }, [initialData])

  const handlePresetClick = (presetKey) => {
    const preset = RECURRENCE_PRESETS[presetKey]
    setFormData(prev => ({
      ...prev,
      recurrence_rule: preset
    }))
    setRecurrenceMode('preset')
  }

  const handleCustomChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      recurrence_rule: {
        ...prev.recurrence_rule,
        [field]: value
      }
    }))
  }

  const handleDayToggle = (day) => {
    const currentDays = formData.recurrence_rule?.days_of_week || []
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day].sort((a, b) => a - b)

    handleCustomChange('days_of_week', newDays.length > 0 ? newDays : null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!formData.scheduled_date) {
      alert('Vui lòng chọn ngày bắt đầu')
      return
    }

    const submitData = {
      scheduled_date: formData.scheduled_date,
      recurrence_rule: useRecurrence ? formData.recurrence_rule : null,
      is_calendar_visible: formData.is_calendar_visible
    }

    onSave(submitData)
  }

  const handleRemoveRecurrence = () => {
    setFormData(prev => ({
      ...prev,
      recurrence_rule: null
    }))
    setUseRecurrence(false)
  }

  // Preview occurrences
  const previewOccurrences = () => {
    if (!formData.scheduled_date || !useRecurrence || !formData.recurrence_rule) {
      return []
    }

    try {
      const start = new Date(formData.scheduled_date)
      const end = new Date(start)
      end.setMonth(end.getMonth() + 1)

      return generateOccurrences(formData.recurrence_rule, start, end, 10)
    } catch (err) {
      console.error('Preview error:', err)
      return []
    }
  }

  const preview = previewOccurrences()

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Đặt lịch & Lặp lại">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Scheduled Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ngày bắt đầu <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.scheduled_date}
            onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
            className="input"
            required
          />
        </div>

        {/* Calendar Visibility */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.is_calendar_visible}
            onChange={(e) => setFormData(prev => ({ ...prev, is_calendar_visible: e.target.checked }))}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <label className="text-sm text-gray-700">
            Hiển thị trên calendar
          </label>
        </div>

        {/* Use Recurrence Toggle */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">
              Lặp lại
            </label>
            <button
              type="button"
              onClick={() => setUseRecurrence(!useRecurrence)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                useRecurrence
                  ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {useRecurrence ? '🔁 Đang bật' : 'Bật lặp lại'}
            </button>
          </div>

          {/* Recurrence Options */}
          {useRecurrence && (
            <div className="space-y-4 bg-purple-50 p-4 rounded-lg">
              {/* Presets */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Mẫu có sẵn:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_OPTIONS.map(preset => (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => handlePresetClick(preset.key)}
                      className="px-3 py-2 bg-white border-2 border-gray-200 hover:border-purple-400 rounded-lg text-sm font-medium transition-colors text-left"
                    >
                      {preset.icon} {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Mode */}
              <button
                type="button"
                onClick={() => setRecurrenceMode('custom')}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                ⚙️ Tùy chỉnh chi tiết
              </button>

              {recurrenceMode === 'custom' && formData.recurrence_rule && (
                <div className="space-y-3 border-t pt-3">
                  {/* Frequency */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Tần suất:
                    </label>
                    <select
                      value={formData.recurrence_rule.frequency}
                      onChange={(e) => handleCustomChange('frequency', e.target.value)}
                      className="input text-sm"
                    >
                      {FREQUENCY_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.icon} {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Interval */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Mỗi:
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.recurrence_rule.interval || 1}
                      onChange={(e) => handleCustomChange('interval', parseInt(e.target.value))}
                      className="input text-sm"
                    />
                  </div>

                  {/* Days of Week (for weekly) */}
                  {formData.recurrence_rule.frequency === 'weekly' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Các ngày trong tuần:
                      </label>
                      <div className="flex gap-1">
                        {DAY_OF_WEEK.map(day => (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => handleDayToggle(day.value)}
                            className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                              formData.recurrence_rule.days_of_week?.includes(day.value)
                                ? 'bg-purple-600 text-white'
                                : 'bg-white text-gray-600 border border-gray-300'
                            }`}
                            title={day.fullLabel}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* End Date */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Kết thúc vào (tùy chọn):
                    </label>
                    <input
                      type="date"
                      value={formData.recurrence_rule.end_date || ''}
                      onChange={(e) => handleCustomChange('end_date', e.target.value || null)}
                      className="input text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Current Rule Summary */}
              {formData.recurrence_rule && (
                <div className="bg-white p-3 rounded border border-purple-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-purple-900">
                      {formatRecurrenceRule(formData.recurrence_rule)}
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveRecurrence}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              )}

              {/* Preview */}
              {preview.length > 0 && (
                <div className="bg-white p-3 rounded border border-purple-200">
                  <p className="text-xs font-medium text-gray-600 mb-2">
                    📅 10 lần tiếp theo:
                  </p>
                  <div className="text-xs text-gray-700 space-y-1">
                    {preview.map((date, index) => (
                      <div key={index}>
                        {index + 1}. {date.toLocaleDateString('vi-VN', { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            disabled={loading}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </form>
    </Modal>
  )
}