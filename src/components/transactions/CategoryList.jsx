export default function CategoryList({ categories, onEdit }) {
  if (categories.length === 0) {
    return (
      <div className="card text-center py-12">
        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        <p className="text-gray-500">Chưa có danh mục nào</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {categories.map(category => (
        <div
          key={category.id}
          className="card hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => onEdit(category)}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3 flex-1">
              {/* Icon with type-based background color */}
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 ${
                  category.type === 'income' 
                    ? 'bg-green-100' 
                    : 'bg-red-100'
                }`}
              >
                {category.icon || '📁'}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">
                  {category.name}
                </h3>
                <p className={`text-xs mt-1 ${
                  category.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {category.type === 'income' ? 'Thu nhập' : 'Chi tiêu'}
                </p>
              </div>
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit(category)
              }}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              title="Sửa"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </div>

          {!category.is_active && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Đã ẩn
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}