const CATEGORY_COLORS = {
  grammar: 'bg-blue-100 text-blue-700',
  vocab: 'bg-green-100 text-green-700',
  kanji: 'bg-purple-100 text-purple-700',
  general: 'bg-gray-100 text-gray-700',
}

const CATEGORY_LABELS = {
  grammar: 'Grammar',
  vocab: 'Vocab',
  kanji: 'Kanji',
  general: 'General',
}

function stripHtml(html) {
  if (!html) return ''
  const div = document.createElement('div')
  div.innerHTML = html
  return (div.textContent || div.innerText || '').trim()
}

export default function MaterialCard({ material, onView, onEdit, onDelete }) {
  const { title, content, category, tags, images, created_at } = material

  const preview = stripHtml(content).slice(0, 120)
  const date = new Date(created_at).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  const categoryColor = CATEGORY_COLORS[category] || CATEGORY_COLORS.general
  const categoryLabel = CATEGORY_LABELS[category] || category

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden">
      {/* Thumbnail */}
      {images?.length > 0 && (
        <div className="h-36 overflow-hidden bg-gray-100">
          <img
            src={images[0]}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-4 flex flex-col flex-1">
        {/* Category badge */}
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${categoryColor}`}>
            {categoryLabel}
          </span>
          <span className="text-xs text-gray-400">{date}</span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">{title}</h3>

        {/* Content preview */}
        {preview && (
          <p className="text-xs text-gray-500 mb-3 line-clamp-3 flex-1">{preview}</p>
        )}

        {/* Tags */}
        {tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded"
              >
                #{tag}
              </span>
            ))}
            {tags.length > 4 && (
              <span className="text-xs text-gray-400">+{tags.length - 4}</span>
            )}
          </div>
        )}

        {/* Images count */}
        {images?.length > 1 && (
          <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {images.length} images
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto pt-2 border-t border-gray-100">
          <button
            onClick={() => onView(material)}
            className="flex-1 text-xs text-blue-600 hover:text-blue-800 font-medium py-1 transition-colors"
          >
            View
          </button>
          <button
            onClick={() => onEdit(material)}
            className="flex-1 text-xs text-gray-600 hover:text-gray-800 font-medium py-1 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(material)}
            className="flex-1 text-xs text-red-500 hover:text-red-700 font-medium py-1 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
