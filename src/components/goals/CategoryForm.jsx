import { useState, useEffect } from 'react'

const EMOJI_OPTIONS = ['📁', '📂', '📚', '💼', '🎯', '🚀', '💡', '⭐', '🏆', '🎓', '💪', '🌟', '🔥', '✨', '🎨', '📝']
const COLOR_OPTIONS = [
  { name: 'Gray', value: '#6B7280' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Teal', value: '#14B8A6' },
]

export default function CategoryForm({ category, goalId, onSubmit, onCancel, loading }) {
  const [formData, setFormData] = useState({
    goal_id: goalId || '',
    name: '',
    description: '',
    icon: '📁',
    color: '#6B7280',
    is_active: true
  })

  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  useEffect(() => {
    if (category) {
      setFormData({
        goal_id: category.goal_id,
        name: category.name,
        description: category.description || '',
        icon: category.icon || '📁',
        color: category.color || '#6B7280',
        is_active: category.is_active !== false
      })
    }
  }, [category])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên danh mục')
      return
    }

    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tên danh mục <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="input"
          placeholder="Ví dụ: Kỹ năng, Dự án cá nhân..."
          required
          disabled={loading}
          autoFocus
        />
      </div>

      {/* Icon & Color */}
      <div className="grid grid-cols-2 gap-4">
        {/* Icon Picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Icon
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center text-3xl"
              disabled={loading}
            >
              {formData.icon}
            </button>
            
            {showEmojiPicker && (
              <div className="absolute z-10 mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-lg p-3">
                <div className="grid grid-cols-4 gap-2">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, icon: emoji }))
                        setShowEmojiPicker(false)
                      }}
                      className="text-2xl p-2 hover:bg-gray-100 rounded transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Color Picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Màu sắc
          </label>
          <div className="grid grid-cols-4 gap-2">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                className={`w-full h-10 rounded-lg transition-all ${
                  formData.color === color.value
                    ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                    : 'hover:scale-105'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
                disabled={loading}
              />
            ))}
          </div>
        </div>
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
          placeholder="Mô tả chi tiết về danh mục..."
          disabled={loading}
        />
      </div>

      {/* Is Active */}
      <div>
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 cursor-pointer"
            disabled={loading}
          />
          <span className="ml-2 text-sm text-gray-700">
            Kích hoạt danh mục này
          </span>
        </label>
        <p className="text-xs text-gray-500 mt-1">
          Danh mục ẩn sẽ không hiển thị trong danh sách
        </p>
      </div>

      {/* Preview */}
      <div className="border-t pt-4">
        <p className="text-sm text-gray-600 mb-2">Xem trước:</p>
        <div 
          className="rounded-lg p-3 border-2 flex items-center gap-3"
          style={{ 
            backgroundColor: `${formData.color}15`,
            borderColor: formData.color 
          }}
        >
          <span className="text-2xl">{formData.icon}</span>
          <div className="flex-1">
            <h4 className="font-bold text-gray-900">{formData.name || 'Tên danh mục'}</h4>
            <p className="text-sm text-gray-600">{formData.description || 'Mô tả danh mục'}</p>
          </div>
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
          className="flex-1 px-4 py-2 rounded-lg font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: formData.color }}
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
            category ? 'Cập nhật' : 'Tạo danh mục'
          )}
        </button>
      </div>
    </form>
  )
}