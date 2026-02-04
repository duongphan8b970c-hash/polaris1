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

export default function ProjectForm({ project, categories, onSubmit, onCancel, loading }) {
  const [formData, setFormData] = useState({
    category_id: '',
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
        category_id: project.category_id,
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

    if (!formData.category_id) {
      alert('Vui lòng chọn danh mục')
      return
    }

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
          disabled={loading || project}
        >
          <option value="">Chọn danh mục</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>
        {project && (
          <p className="text-xs text-amber-600 mt-1">
            ⚠️ Không thể thay đổi danh mục
          </p>
        )}
      </div>

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
                {option.label}
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
            disabled={loading || project}
          />
        </div>

        {/* Due Date */}
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
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang lưu...
            </span>
          ) : (
            project ? 'Cập nhật' : 'Tạo dự án'
          )}
        </button>
      </div>
    </form>
  )
}