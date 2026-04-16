import { useState, useEffect, useRef } from 'react'
import UserSelector from './UserSelector'

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Thấp', icon: '🔵' },
  { value: 'medium', label: 'Trung bình', icon: '🟡' },
  { value: 'high', label: 'Cao', icon: '🟠' },
]

const STATUS_OPTIONS = [
  { value: 'todo', label: 'Cần làm', icon: '📝' },
  { value: 'in_progress', label: 'Đang làm', icon: '⏳' },
  { value: 'completed', label: 'Hoàn thành', icon: '✅' },
  { value: 'blocked', label: 'Bị chặn', icon: '🚫' },
]

export default function TaskForm({ task, onSubmit, onCancel, loading }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    due_date: '',
    priority: 'medium',
    status: 'todo',
    tags: [],
    estimated_hours: '',
    assigned_to: [],
    scheduled_date: '',
    is_calendar_visible: false,
  })

  const [tagInput, setTagInput] = useState('')
  const descriptionRef = useRef(null)

  const resizeTextarea = () => {
    if (descriptionRef.current) {
      descriptionRef.current.style.height = 'auto'
      descriptionRef.current.style.height = descriptionRef.current.scrollHeight + 'px'
    }
  }

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        start_date: task.start_date || '',
        due_date: task.due_date || '',
        priority: task.priority || 'medium',
        status: task.status || 'todo',
        tags: task.tags || [],
        estimated_hours: task.estimated_hours || '',
        assigned_to: task.assigned_to || [],
        scheduled_date: task.scheduled_date || '',
        is_calendar_visible: task.is_calendar_visible || false,
      })
    }
  }, [task])

  // Auto-resize description textarea whenever its value changes
  useEffect(() => {
    resizeTextarea()
  }, [formData.description])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      alert('Vui lòng nhập tên công việc')
      return
    }

    if (formData.due_date && formData.start_date && formData.due_date < formData.start_date) {
      alert('Ngày hoàn thành phải sau ngày bắt đầu')
      return
    }

    // ✅ FIX: Convert empty strings to null for date fields
    let submitData = { ...formData }
    
    if (submitData.start_date === '') {
      submitData.start_date = null
    }
    if (submitData.due_date === '') {
      submitData.due_date = null
    }
    if (submitData.scheduled_date === '') {
      submitData.scheduled_date = null
    }

    console.log('📤 Submitting task data:', submitData)
    onSubmit(submitData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* ✅ REMOVED: Project selector - Not needed anymore */}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tên công việc <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="input"
          placeholder="Ví dụ: Thiết kế giao diện, Viết code..."
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
          ref={descriptionRef}
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="input"
          placeholder="Mô tả chi tiết về công việc cần làm..."
          disabled={loading}
          style={{ overflow: 'hidden', resize: 'none', minHeight: '80px' }}
        />
      </div>

      {/* Priority & Status */}
      <div className="grid grid-cols-2 gap-4">
        {/* Priority */}
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

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Trạng thái
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="input"
            disabled={loading}
          >
            {STATUS_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ngày bắt đầu
          </label>
          <input
            type="date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            className="input"
            disabled={loading}
          />
        </div>
        {/* Due Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ngày dự kiến hoàn thành
          </label>
          <input
            type="date"
            name="due_date"
            value={formData.due_date}
            onChange={handleChange}
            className="input"
            disabled={loading}
          />
        </div>
      </div>
      {/* ✅ ADD: Calendar Scheduling */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700">
            📅 Hiển thị trên Calendar
          </label>
          <input
            type="checkbox"
            name="is_calendar_visible"
            checked={formData.is_calendar_visible || false}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              is_calendar_visible: e.target.checked 
            }))}
            className="w-4 h-4 text-blue-600 rounded"
            disabled={loading}
          />
        </div>

        {formData.is_calendar_visible && (
          <div className="bg-blue-50 p-3 rounded-lg space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Ngày lên calendar:
              </label>
              <input
                type="date"
                name="scheduled_date"
                value={formData.scheduled_date || ''}
                onChange={handleChange}
                className="input text-sm"
                disabled={loading}
              />
            </div>
          </div>
        )}
      </div>

      <UserSelector
        selectedUserIds={formData.assigned_to}
        onChange={(userIds) => setFormData(prev => ({ ...prev, assigned_to: userIds }))}
        label="Assign to users"
        placeholder="Select users to assign..."
        disabled={loading}
      />
      {/* Estimated Hours */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Thời gian ước tính (giờ)
        </label>
        <input
          type="number"
          name="estimated_hours"
          value={formData.estimated_hours}
          onChange={handleChange}
          className="input"
          placeholder="Ví dụ: 8"
          step="0.5"
          min="0"
          disabled={loading}
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
            className="input flex-1"
            placeholder="Nhập tag và Enter"
            disabled={loading}
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
            disabled={loading}
          >
            Thêm
          </button>
        </div>
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-blue-900"
                  disabled={loading}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

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
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            task ? 'Cập nhật' : 'Tạo công việc'
          )}
        </button>
      </div>
    </form>
  )
}