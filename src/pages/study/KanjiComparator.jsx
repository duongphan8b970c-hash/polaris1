import { useState } from 'react'
import { useKanjiCards } from '../../hooks/study/useKanjiCards'
import KanjiCard from '../../components/study/KanjiCard'
import PageHeader from '../../components/layout/PageHeader'
import Loading from '../../components/common/Loading'
import ErrorMessage from '../../components/common/ErrorMessage'

export default function KanjiComparator() {
  const { cards, loading, error, addKanjiCard, updateKanjiCard, deleteKanjiCard, refetch } = useKanjiCards()
  const [inputValue, setInputValue] = useState('')
  const [adding, setAdding] = useState(false)

  const handleAddKanji = async (e) => {
    e.preventDefault()

    const trimmed = inputValue.trim()
    if (!trimmed) {
      alert('Please enter a Kanji character')
      return
    }

    setAdding(true)
    const result = await addKanjiCard(trimmed)
    setAdding(false)

    if (result.success) {
      setInputValue('')
    } else {
      alert('Error adding Kanji: ' + result.error)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this Kanji card?')) return

    const result = await deleteKanjiCard(id)
    if (!result.success) {
      alert('Error deleting card: ' + result.error)
    }
  }

  // Analyze common radicals across cards
  const radicalCounts = cards.reduce((acc, card) => {
    if (card.radical) {
      acc[card.radical] = (acc[card.radical] || 0) + 1
    }
    return acc
  }, {})

  const commonRadicals = Object.entries(radicalCounts)
    .filter(([, count]) => count > 1)
    .map(([radical]) => radical)

  if (loading) {
    return <Loading message="Loading Kanji cards..." />
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={refetch} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="🎌 Kanji Comparator"
        subtitle="Compare multiple Kanji side-by-side to spot patterns"
      />

      {/* Add Kanji Form */}
      <div className="card p-6">
        <form onSubmit={handleAddKanji} className="space-y-3">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Paste Kanji from Jisho.org (e.g., 話, 語, 読)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              disabled={adding}
              autoFocus
            />
            <button
              type="submit"
              disabled={adding || !inputValue.trim()}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {adding ? (
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                </span>
              ) : (
                '+ Add Kanji'
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              Copy Kanji directly from <a href="https://jisho.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">Jisho.org</a>
            </span>
          </div>
        </form>
      </div>

      {/* Comparison Insights */}
      {cards.length > 1 && commonRadicals.length > 0 && (
        <div className="card p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <div>
              <div className="text-sm font-semibold text-blue-900 mb-1">
                🔍 Comparison Insights
              </div>
              <div className="text-sm text-blue-800">
                <strong>Common Radicals:</strong> <span className="text-2xl ml-2">{commonRadicals.join(' ')}</span>
                <span className="ml-2 text-xs">({commonRadicals.length} found)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Kanji Cards Grid */}
      {cards.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-7xl mb-4">🎌</div>
          <p className="text-gray-500 font-medium text-lg mb-2">No Kanji cards yet</p>
          <p className="text-gray-400">Add your first Kanji to start comparing!</p>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-500">
              {cards.length} {cards.length === 1 ? 'card' : 'cards'}
            </div>
            <div className="text-xs text-gray-400">
              Scroll horizontally to see all cards →
            </div>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory">
            {cards.map(card => (
              <div key={card.id} className="snap-start">
                <KanjiCard
                  card={card}
                  onUpdate={updateKanjiCard}
                  onDelete={handleDelete}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
