import { useState, lazy, Suspense } from 'react'

const KanjiWritingPractice = lazy(() => import('./KanjiWritingPractice'))

export default function KanjiCard({ card, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false)
  const [notes, setNotes] = useState(card.notes || '')
  const [showPractice, setShowPractice] = useState(false)

  const kanjiLen = (card.kanji || '').length
  const kanjiFontSize =
    kanjiLen <= 1 ? '5rem'
    : kanjiLen <= 2 ? '4rem'
    : kanjiLen <= 4 ? '2.5rem'
    : `${Math.max(1.5, 8 / kanjiLen)}rem`

  const handleSaveNotes = async () => {
    const result = await onUpdate(card.id, { notes })
    if (result.success) {
      setIsEditing(false)
    }
  }

  return (
    <div className="card p-6 min-w-[280px] max-w-[320px] flex-shrink-0 flex flex-col">
      {/* Header with Delete Button */}
      <div className="flex items-start justify-between mb-4">
        <div className="h-24 flex items-center overflow-hidden">
          <div style={{ fontSize: kanjiFontSize }} className="font-serif leading-none whitespace-nowrap">{card.kanji}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onDelete(card.id)}
            className="text-gray-400 hover:text-red-500 transition-colors"
            title="Remove card"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Practice Writing Button */}
      <div className="mb-4">
        <button
          onClick={() => setShowPractice(true)}
          className="w-full px-3 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Luyện viết
        </button>
      </div>

      {showPractice && (
        <Suspense fallback={null}>
          <KanjiWritingPractice
            kanji={card.kanji}
            onClose={() => setShowPractice(false)}
          />
        </Suspense>
      )}

      {/* Radical */}
      {card.radical && (
        <div className="mb-3 pb-3 border-b border-gray-200">
          <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Radical</div>
          <div className="text-3xl">{card.radical}</div>
        </div>
      )}

      {/* Stroke Count */}
      {card.stroke_count && (
        <div className="mb-3 pb-3 border-b border-gray-200">
          <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Strokes</div>
          <div className="text-lg font-semibold text-gray-900">{card.stroke_count}</div>
        </div>
      )}

      {/* Meanings */}
      {card.meanings && card.meanings.length > 0 && (
        <div className="mb-3 pb-3 border-b border-gray-200">
          <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Meanings</div>
          <div className="text-sm text-gray-700 leading-relaxed">
            {card.meanings.slice(0, 4).join(', ')}
          </div>
        </div>
      )}

      {/* Readings */}
      {card.readings_on && card.readings_on.length > 0 && (
        <div className="mb-3 pb-3 border-b border-gray-200">
          <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Readings</div>
          <div className="text-sm font-mono text-gray-700">
            {card.readings_on.slice(0, 3).join(', ')}
          </div>
        </div>
      )}

      {/* Notes Section */}
      <div className="mt-4">
        <div className="text-xs text-gray-500 uppercase font-semibold mb-2">Personal Notes</div>
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="4"
              placeholder="Add your notes, mnemonics, examples..."
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveNotes}
                className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setNotes(card.notes || '')
                  setIsEditing(false)
                }}
                className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setIsEditing(true)}
            className="text-sm text-gray-600 cursor-pointer hover:text-gray-900 hover:bg-gray-50 p-2 rounded-lg transition-colors min-h-[3rem] border border-transparent hover:border-gray-200"
          >
            {card.notes || 'Click to add notes...'}
          </div>
        )}
      </div>
    </div>
  )
}
