import { useState, useEffect } from 'react'
import UserSelector from './UserSelector'
import { PRIORITY_OPTIONS } from '../../constants'
import SmartEndDateInput from './SmartEndDateInput'
import EmojiPicker from '../common/EmojiPicker' 

const CHECKIN_FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Mỗi ngày', description: 'Checkin tất cả các ngày trong tháng' },
  { value: 'weekdays', label: 'Ngày trong tuần', description: 'Chỉ checkin Thứ 2 - Thứ 6' },
  { value: 'weekly', label: 'Tùy chỉnh số ngày/tuần', description: 'Chọn số ngày checkin mỗi tuần' },
  { value: 'custom', label: 'Tùy chỉnh số ngày/tháng', description: 'Nhập tổng số ngày checkin trong tháng' },
]

export default function GoalForm({ goal, onSubmit, onCancel, loading }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '🎯',
    color: '#3b82f6',
    category: 'personal',
    start_date: new Date().toISOString().split('T')[0],  // ✅ ADD
    target_date: '',
    priority: 'medium',
    is_checkin_enabled: false,
    checkin_frequency: 'daily',
    checkin_days_per_week: 7,
    checkin_target_days: null,
    assigned_to: [],
  })

  useEffect(() => {
    if (goal) {
      setFormData({
        name: goal.name,
        description: goal.description || '',
        icon: goal.icon || '🎯',
        color: goal.color || '#3b82f6',
        category: goal.category || 'personal',
        start_date: goal.start_date || new Date().toISOString().split('T')[0],  // ✅ ADD
        target_date: goal.target_date || '',
        priority: goal.priority || 'medium',
        assigned_to: goal.assigned_to || [],
      })
    }
  }, [goal])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  // ✅ IMPROVED: Calculate target days for preview only
  const calculateTargetDaysPreview = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    switch (formData.checkin_frequency) {
      case 'daily':
        return daysInMonth

      case 'weekdays':
        let weekdayCount = 0
        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(year, month, day)
          const dayOfWeek = date.getDay()
          if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            weekdayCount++
          }
        }
        return weekdayCount

      case 'weekly':
        const weeksInMonth = daysInMonth / 7
        return Math.round(formData.checkin_days_per_week * weeksInMonth)

      case 'custom':
        return formData.checkin_target_days || daysInMonth

      default:
        return daysInMonth
    }
  }

  const previewDays = calculateTargetDaysPreview()

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên mục tiêu')
      return
    }

    // ✅ FIX: Convert empty strings to null for ALL date fields
    let submitData = { ...formData }
    
    // Convert empty strings to null for dates
    if (submitData.start_date === '') {
      submitData.start_date = null
    }
    if (submitData.target_date === '') {
      submitData.target_date = null
    }
    if (submitData.end_date === '' || submitData.end_date === undefined) {
      submitData.end_date = null  // ✅ ADD THIS LINE
    }

    // Checkin logic
    if (formData.is_checkin_enabled) {
      if (formData.checkin_frequency === 'custom') {
        submitData.checkin_target_days = parseInt(formData.checkin_target_days) || null
      } else {
        submitData.checkin_target_days = null
      }
    } else {
      submitData.checkin_target_days = null
      submitData.checkin_frequency = 'daily'
      submitData.checkin_days_per_week = 7
    }

    console.log('📤 Submitting goal data:', submitData)
    onSubmit(submitData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
          placeholder="Ví dụ: Học tiếng Anh mỗi ngày"
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
          placeholder="Mô tả chi tiết về mục tiêu..."
          disabled={loading}
        />
      </div>

      {/* Icon & Color */}
      <div className="grid grid-cols-2 gap-4">
        <EmojiPicker
          value={formData.icon}
          onChange={handleChange}
          disabled={loading}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Màu sắc
          </label>
          <input
            type="color"
            name="color"
            value={formData.color}
            onChange={handleChange}
            className="input h-10"
            disabled={loading}
          />
        </div>
      </div>

      {/* Category & Priority */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Danh mục
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="input"
            disabled={loading}
          >
            <option value="personal">Cá nhân</option>
            <option value="work">Công việc</option>
            <option value="health">Sức khỏe</option>
            <option value="learning">Học tập</option>
            <option value="finance">Tài chính</option>
            <option value="other">Khác</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Độ ưu tiên
          </label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="input"
            disabled={loading}
          >
            {PRIORITY_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ✅ NEW: Start Date & Target Date */}
      <div className="grid grid-cols-2 gap-4">
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
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ngày hoàn thành dự kiến
          </label>
          <input
            type="date"
            name="target_date"
            value={formData.target_date}
            onChange={handleChange}
            className="input"
            min={formData.start_date}  // ✅ Can't be before start date
            disabled={loading}
          />
        </div>
      </div>
      {/* ✅ ADD: Smart End Date Input */}
      <SmartEndDateInput
        goal={goal}
        value={formData.end_date}
        onChange={(date) => setFormData(prev => ({ ...prev, end_date: date }))}
        disabled={loading}
      />
      <UserSelector
        selectedUserIds={formData.assigned_to}
        onChange={(userIds) => setFormData(prev => ({ ...prev, assigned_to: userIds }))}
        label="Assign to users"
        placeholder="Select users to assign..."
        disabled={loading}
      />
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
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Đang lưu...' : goal ? 'Cập nhật' : 'Tạo mục tiêu'}
        </button>
      </div>
    </form>
  )
}