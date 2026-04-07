import { useState } from 'react'
import KanjiCompareCard from './KanjiCompareCard'
import { fetchKanjiFromJisho } from '../../utils/jishoAPI'

export default function KanjiCompareZone({ onAddToGroup }) {
  const [compareCards, setCompareCards] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [adding, setAdding] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleAdd = async (e) => {
    e.preventDefault()
    if (adding) return
    const kanji = inputValue.trim()
    if (!kanji) return

    // Check if already in compare list
    if (compareCards.some(c => c.kanji === kanji)) {
      setInputValue('')
      return
    }

    setAdding(true)
    try {
      const kanjiData = await fetchKanjiFromJisho(kanji)
      setCompareCards(prev => [...prev, {
        ...kanjiData,
        _compareId: `${kanji}-${Date.now()}`
      }])
      setInputValue('')
    } catch (err) {
      console.error('Error fetching Kanji:', err)
      alert('Không tìm thấy Kanji. Hãy thử lại.')
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = (card) => {
    setCompareCards(prev => prev.filter(c => c._compareId !== card._compareId))
  }

  const handleClearAll = () => {
    setCompareCards([])
  }

  return (
    <div className="card border-2 border-blue-100 bg-gradient-to-br from-blue-50/50 to-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-0">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-2 text-left"
        >
          <span className="text-2xl">🔍</span>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Quick Compare</h2>
            <p className="text-xs text-gray-500">
              So sánh Kanji nhanh — không lưu vào nhóm
              {compareCards.length > 0 && (
                <span className="ml-1 text-blue-600 font-medium">
                  ({compareCards.length} kanji)
                </span>
              )}
            </p>
          </div>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ml-2 ${isCollapsed ? '' : 'rotate-180'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {compareCards.length > 0 && !isCollapsed && (
          <button
            onClick={handleClearAll}
            className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors"
          >
            Xóa tất cả
          </button>
        )}
      </div>

      {!isCollapsed && (
        <div className="p-4 pt-3">
          {/* Input */}
          <form onSubmit={handleAdd} className="flex gap-2 mb-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Nhập Kanji để compare (vd: 話, 語, 読)"
              className="flex-1 px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-base bg-white"
              disabled={adding}
            />
            <button
              type="submit"
              disabled={adding || !inputValue.trim()}
              className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              {adding ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                '+ Compare'
              )}
            </button>
          </form>

          {/* Compare Cards Grid */}
          {compareCards.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {compareCards.map(card => (
                <KanjiCompareCard
                  key={card._compareId}
                  card={card}
                  onRemove={handleRemove}
                  onAddToGroup={onAddToGroup}
                  compact
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400 text-sm">
              <span className="text-3xl block mb-2">🔍</span>
              Thêm Kanji để so sánh nhanh. Các Kanji ở đây không được lưu vào nhóm.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
