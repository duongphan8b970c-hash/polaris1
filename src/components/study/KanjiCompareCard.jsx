import { useState, lazy, Suspense } from 'react'

const KanjiWritingPractice = lazy(() => import('./KanjiWritingPractice'))

export default function KanjiCompareCard({ card, onRemove, onAddToGroup, compact = false }) {
  const [showPractice, setShowPractice] = useState(false)

  const kanjiLen = (card.kanji || '').length
  const kanjiFontSize = compact
    ? (kanjiLen <= 1 ? '3rem' : kanjiLen <= 2 ? '2.5rem' : `${Math.max(1.5, 6 / kanjiLen)}rem`)
    : (kanjiLen <= 1 ? '4rem' : kanjiLen <= 2 ? '3rem' : `${Math.max(1.5, 7 / kanjiLen)}rem`)

  return (
    <div className={`bg-white rounded-xl shadow-md border-2 border-dashed border-blue-200 hover:border-blue-400 transition-colors ${compact ? 'p-3' : 'p-4'} h-full flex flex-col`}>
      {/* Header: Kanji + actions */}
      <div className="flex items-start justify-between mb-2">
        <div style={{ fontSize: kanjiFontSize }} className="font-serif leading-none">
          {card.kanji}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {onAddToGroup && (
            <button
              onClick={() => onAddToGroup(card)}
              className="text-gray-400 hover:text-green-600 transition-colors p-1"
              title="Thêm vào nhóm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          )}
          <button
            onClick={() => onRemove(card)}
            className="text-gray-400 hover:text-red-500 transition-colors p-1"
            title="Xóa khỏi compare"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Practice Writing Button */}
      {card.kanji && card.kanji.length === 1 && (
        <button
          onClick={() => setShowPractice(true)}
          className="w-full mb-2 px-2 py-1.5 bg-gray-100 text-gray-500 text-xs rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Luyện viết
        </button>
      )}

      {showPractice && (
        <Suspense fallback={null}>
          <KanjiWritingPractice
            kanji={card.kanji}
            onClose={() => setShowPractice(false)}
          />
        </Suspense>
      )}

      {/* Radical & Strokes in one line */}
      <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
        {card.radical && (
          <span>
            <span className="uppercase font-semibold">Radical:</span>{' '}
            <span className="text-lg align-middle">{card.radical}</span>
          </span>
        )}
        {card.stroke_count && (
          <span>
            <span className="uppercase font-semibold">Strokes:</span>{' '}
            <span className="font-semibold text-gray-900">{card.stroke_count}</span>
          </span>
        )}
      </div>

      {/* Meanings */}
      {card.meanings && card.meanings.length > 0 && (
        <div className="mb-2">
          <div className="text-xs text-gray-500 uppercase font-semibold mb-0.5">Meanings</div>
          <div className="text-sm text-gray-700 leading-snug">
            {card.meanings.slice(0, 4).join(', ')}
          </div>
        </div>
      )}

      {/* Readings */}
      {card.readings_on && card.readings_on.length > 0 && (
        <div className="mt-auto">
          <div className="text-xs text-gray-500 uppercase font-semibold mb-0.5">Readings</div>
          <div className="text-sm font-mono text-gray-700">
            {card.readings_on.slice(0, 3).join(', ')}
          </div>
        </div>
      )}
    </div>
  )
}
