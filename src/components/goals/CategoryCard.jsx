export default function CategoryCard({ category, onEdit, onDelete, onClick }) {
  return (
    <div 
      className="card hover:shadow-lg transition-all cursor-pointer"
      onClick={onClick}
      style={{ 
        borderLeftWidth: '4px',
        borderLeftColor: category.color 
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-3xl flex-shrink-0">{category.icon}</span>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-gray-900 truncate" title={category.name}>
              {category.name}
            </h4>
            {category.description && (
              <p className="text-sm text-gray-600 line-clamp-2" title={category.description}>
                {category.description}
              </p>
            )}
          </div>
        </div>
        {!category.is_active && (
          <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
            Ẩn
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onEdit(category)}
          className="flex-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium transition-colors"
        >
          Sửa
        </button>
        <button
          onClick={() => onDelete(category)}
          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-medium transition-colors"
        >
          Xóa
        </button>
      </div>
    </div>
  )
}