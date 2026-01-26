import { useState, useEffect } from 'react'

const CATEGORY_ICONS = [
  '🍔', '🚗', '🏠', '💡', '📱', '🎮', '👕', '💊',
  '🎓', '✈️', '🎬', '🎵', '⚽', '🎨', '📚', '🍕',
  '☕', '🛒', '💰', '💳', '🏦', '📈', '💼', '🎁',
  '🏥', '🚌', '📦', '🍜', '🎯', '⚡', '🌟', '🔥'
]

export default function CategoryForm({ category, defaultType, onSubmit, onCancel, loading }) {
  const [formData, setFormData] = useState({
    name: '',
    type: defaultType || 'expense',
    icon: '📁',
    is_active: true,
  })

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        type: category.type,
        icon: category.icon || '📁',
        is_active: category.is_active !== false,
      })
    } else {
      setFormData(prev => ({
        ...prev,
        type: defaultType || 'expense'
      }))
    }
  }, [category, defaultType])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.name?.trim()) {
      alert('Vui lòng nhập tên danh mục')
      return
    }
    
    onSubmit({
      name: formData.name.trim(),
      type: formData.type,
      icon: formData.icon,
      is_active: formData.is_active
    })
  }

  const handleChange = (e) => {
    const { name, value, type: inputType, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: inputType === 'checkbox' ? checked : value
    }))
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
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="VD: Ăn uống, Lương, ..."
          required
          disabled={loading}
          autoFocus
        />
      </div>

      {/* Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Loại <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, type: 'expense' }))}
            className={`py-3 px-4 rounded-lg font-medium transition-all ${
              formData.type === 'expense'
                ? 'bg-red-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            disabled={loading}
          >
            Chi tiêu
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, type: 'income' }))}
            className={`py-3 px-4 rounded-lg font-medium transition-all ${
              formData.type === 'income'
                ? 'bg-green-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            disabled={loading}
          >
            Thu nhập
          </button>
        </div>
      </div>

      {/* Icon */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
        <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg">
          {CATEGORY_ICONS.map(icon => (
            <button
              key={icon}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, icon }))}
              className={`p-3 text-2xl rounded-lg transition-all ${
                formData.icon === icon
                  ? 'bg-primary-100 ring-2 ring-primary-500'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              disabled={loading}
              title={icon}
            >
              {icon}
            </button>
          ))}
        </div>
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
            Hiển thị danh mục này
          </span>
        </label>
        <p className="text-xs text-gray-500 mt-1">
          Danh mục ẩn sẽ không hiển thị khi tạo giao dịch
        </p>
      </div>

      {/* Preview */}
      <div className="border-t pt-4">
        <p className="text-sm text-gray-600 mb-2">Xem trước:</p>
        <div 
          className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg ${
            formData.type === 'income' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}
        >
          <span className="text-2xl">{formData.icon}</span>
          <span className="font-medium">
            {formData.name || 'Tên danh mục'}
          </span>
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
          {loading ? 'Đang lưu...' : (category ? 'Cập nhật' : 'Tạo mới')}
        </button>
      </div>
    </form>
  )
}