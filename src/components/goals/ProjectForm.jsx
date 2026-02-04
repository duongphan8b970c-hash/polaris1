import { useState, useEffect } from 'react'

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Thấp', color: 'gray' },
  { value: 'medium', label: 'Trung bình', color: 'blue' },
  { value: 'high', label: 'Cao', color: 'orange' },
  { value: 'urgent', label: 'Khẩn cấp', color: 'red' },
]

const STATUS_OPTIONS = [
  { value: 'planning', label: 'Lên kế hoạch', icon: '📋' },
  { value: 'in_progress', label: 'Đang thực hiện', icon: '🚀' },
  { value: 'completed', label: 'Hoàn thành', icon: '✅' },
  { value: 'on_hold', label: 'Tạm dừng', icon: '⏸️' },
  { value: 'cancelled', label: 'Hủy bỏ', icon: '❌' },
]

export default function ProjectForm({ project, goalId, onSubmit, onCancel, loading }) {
  const [formData, setFormData] = useState({
    goal_id: goalId || '',
    name: '',
    description: '',
    start_date: new Date().toISOString().split('T')[0],
    due_date: '',
    priority: 'medium',
    status: 'planning'
  })

  useEffect(() => {
    if (project) {
      setFormData({
        goal_id: project.goal_id,
        name: project.name,
        description: project.description || '',
        start_date: project.start_date || new Date().toISOString().split('T')[0],
        due_date: project.due_date || '',
        priority: project.priority || 'medium',
        status: project.status || 'planning'
      })
    }
  }, [project])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên dự án')
      return
    }

    if (formData.due_date && formData.due_date < formData.start_date) {
      alert('Ngày hoàn thành phải sau ngày bắt đầu')
      return
    }

    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tên dự án <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="input"
          placeholder="Ví dụ: Xây dựng website, Học React..."
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
          placeholder="Mô tả chi tiết về dự án..."
          disabled={loading}
        />
      </div>

      {/* Priority & Status */}
      <div className="grid grid-cols-2 gap-4">
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
                {option.label}
              </option>
            ))}
          </select>
        </div>

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
            disabled={loading || project}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ngày hoàn thành
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
          {loading ? 'Đang lưu...' : project ? 'Cập nhật' : 'Tạo dự án'}
        </button>
      </div>
    </form>
  )
}