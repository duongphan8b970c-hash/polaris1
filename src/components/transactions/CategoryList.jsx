export default function CategoryList({ 
  categories = [], // ✅ Default prop
  onEdit 
}) {
  // ✅ Safe check
  const safeCategories = Array.isArray(categories) ? categories : []

  if (safeCategories.length === 0) {
    return (
      <div className="card text-center py-12">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        <p className="text-gray-500 font-medium">Chưa có danh mục nào</p>
        <p className="text-gray-400 text-sm mt-1">Thêm danh mục đầu tiên của bạn</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {safeCategories.map((category) => (
        <div
          key={category.id}
          className="card hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => onEdit && onEdit(category)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{category.icon}</span>
              <div>
                <h3 className="font-semibold text-gray-900">{category.name}</h3>
                <p className="text-sm text-gray-500">
                  {category.type === 'income' ? (
                    <span className="inline-flex items-center gap-1 text-green-600">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      Thu nhập
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-600">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                      </svg>
                      Chi tiêu
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit && onEdit(category)
              }}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Sửa"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}