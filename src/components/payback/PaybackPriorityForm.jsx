import { useState } from 'react'

const ICON_OPTIONS = ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '📌', '⭐', '🔥', '⚡', '💰', '💳']

const COLOR_PRESETS = [
  { name: 'Đỏ', value: '#EF4444' },
  { name: 'Cam', value: '#F97316' },
  { name: 'Vàng', value: '#EAB308' },
  { name: 'Xanh lá', value: '#22C55E' },
  { name: 'Xanh dương', value: '#3B82F6' },
  { name: 'Tím', value: '#A855F7' },
  { name: 'Xám', value: '#6B7280' }
]

export default function PaybackPriorityForm({ priority, onSubmit, onCancel, loading }) {
  const [formData, setFormData] = useState(() => {
    if (priority) {
      return {
        name: priority.name,
        color: priority.color || '#6B7280',
        icon: priority.icon || '📌',
        sort_order: priority.sort_order || 999
      }
    }
    return {
      name: '',
      color: '#6B7280',
      icon: '📌',
      sort_order: 999
    }
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên priority')
      return
    }

    const sortOrder = parseInt(formData.sort_order)
    if (isNaN(sortOrder) || sortOrder < 1) {
      alert('Thứ tự phải là số dương')
      return
    }

    onSubmit({
      ...formData,
      sort_order: sortOrder
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tên priority <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="input"
          placeholder="VD: Khẩn cấp, Cao, Thấp..."
          required
          disabled={loading}
          autoFocus
        />
      </div>

      {/* Icon Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Icon
        </label>
        <div className="flex flex-wrap gap-2">
          {ICON_OPTIONS.map(icon => (
            <button
              key={icon}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, icon }))}
              className={`w-10 h-10 rounded-lg text-xl transition-all ${
                formData.icon === icon
                  ? 'bg-blue-100 ring-2 ring-blue-500'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              disabled={loading}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* Color Picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Màu sắc
        </label>
        
        {/* Color Presets */}
        <div className="flex flex-wrap gap-2 mb-3">
          {COLOR_PRESETS.map(preset => (
            <button
              key={preset.value}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, color: preset.value }))}
              className={`w-10 h-10 rounded-lg transition-all ${
                formData.color === preset.value ? 'ring-2 ring-offset-2 ring-blue-500' : ''
              }`}
              style={{ backgroundColor: preset.value }}
              title={preset.name}
              disabled={loading}
            />
          ))}
        </div>

        {/* Custom Color */}
        <div className="flex items-center gap-3">
          <input
            type="color"
            name="color"
            value={formData.color}
            onChange={handleChange}
            className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
            disabled={loading}
          />
          <input
            type="text"
            name="color"
            value={formData.color}
            onChange={handleChange}
            className="input flex-1"
            placeholder="#6B7280"
            disabled={loading}
          />
        </div>
      </div>

      {/* Sort Order */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Thứ tự sắp xếp <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          name="sort_order"
          value={formData.sort_order}
          onChange={handleChange}
          className="input"
          min="1"
          required
          disabled={loading}
        />
        <p className="text-xs text-gray-500 mt-1">
          💡 Số nhỏ hơn sẽ hiển thị trước (1, 2, 3...)
        </p>
      </div>

      {/* Preview */}
      <div className="border-t pt-4">
        <p className="text-sm text-gray-600 mb-2">Xem trước:</p>
        <div 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium"
          style={{ 
            backgroundColor: `${formData.color}20`, 
            color: formData.color,
            border: `2px solid ${formData.color}40`
          }}
        >
          <span className="text-xl">{formData.icon}</span>
          <span>{formData.name || 'Tên priority'}</span>
        </div>
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
          {loading ? 'Đang lưu...' : (priority ? 'Cập nhật' : 'Tạo mới')}
        </button>
      </div>
    </form>
  )
}