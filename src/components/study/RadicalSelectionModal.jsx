import { useState } from 'react'
import { KANGXI_RADICALS } from '../../utils/kanjiRadicals'

export default function RadicalSelectionModal({ isOpen, onClose, onSelectRadical, kanji }) {
  const [selectedRadical, setSelectedRadical] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  if (!isOpen) return null

  // Group radicals by stroke count for easier navigation
  const radicalsByStroke = Object.entries(KANGXI_RADICALS).reduce((acc, [num, data]) => {
    const stroke = data.stroke
    if (!acc[stroke]) acc[stroke] = []
    acc[stroke].push({ num: parseInt(num), ...data })
    return acc
  }, {})

  // Filter by search term
  const filteredStrokes = Object.entries(radicalsByStroke).filter(([, radicals]) => {
    if (!searchTerm) return true
    return radicals.some(r =>
      r.radical.includes(searchTerm) ||
      r.meaning.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const resetState = () => {
    setSelectedRadical(null)
    setSearchTerm('')
  }

  const handleSubmit = () => {
    if (selectedRadical) {
      onSelectRadical(selectedRadical)
      resetState()
    }
  }

  const handleSkip = () => {
    resetState()
    onSelectRadical(null)
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col shadow-xl">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">
            Select Radical for: <span className="text-4xl">{kanji}</span>
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Couldn't auto-detect radical. Optionally select from 214 Kangxi radicals, or skip:
          </p>

          {/* Search */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by radical or meaning..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        {/* Radicals list - scrollable */}
        <div className="flex-1 overflow-y-auto border rounded-lg p-3 mb-4">
          {filteredStrokes.map(([stroke, radicals]) => (
            <div key={stroke} className="mb-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                {stroke} Stroke{parseInt(stroke) > 1 ? 's' : ''}
              </h4>
              <div className="grid grid-cols-8 gap-2">
                {radicals
                  .filter(rad =>
                    !searchTerm ||
                    rad.radical.includes(searchTerm) ||
                    rad.meaning.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((rad) => (
                    <button
                      key={rad.num}
                      type="button"
                      onClick={() => setSelectedRadical(rad.radical)}
                      className={`p-2 border rounded-lg text-2xl hover:bg-blue-50 transition-colors ${
                        selectedRadical === rad.radical
                          ? 'border-blue-500 bg-blue-100'
                          : 'border-gray-200'
                      }`}
                      title={`${rad.meaning} (${rad.stroke} stroke${rad.stroke > 1 ? 's' : ''})`}
                    >
                      {rad.radical}
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSkip}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedRadical}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
          >
            Select Radical
          </button>
        </div>
      </div>
    </div>
  )
}
