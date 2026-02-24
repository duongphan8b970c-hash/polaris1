import { useState } from 'react'

const EMOJI_CATEGORIES = {
  'Phổ biến': ['🎯', '💼', '📚', '💪', '🏃', '💰', '🎨', '🎵', '✈️', '🏠'],
  'Mục tiêu': ['🎯', '🏆', '⭐', '🎖️', '🥇', '🎪', '🎭', '🎬', '🎤', '🎸'],
  'Công việc': ['💼', '📊', '📈', '💻', '⚙️', '🔧', '📱', '🖥️', '📞', '✉️'],
  'Học tập': ['📚', '📖', '✏️', '📝', '🎓', '🧑‍🎓', '👨‍🏫', '🔬', '🧪', '📐'],
  'Sức khỏe': ['💪', '🏃', '🧘', '🏋️', '🚴', '🏊', '🥗', '🍎', '💊', '🩺'],
  'Tài chính': ['💰', '💵', '💳', '🏦', '📊', '💹', '📈', '🤑', '💸', '🪙'],
  'Sáng tạo': ['🎨', '🖌️', '✨', '💡', '🎭', '🎪', '🎬', '📷', '🎥', '🎼'],
  'Du lịch': ['✈️', '🌍', '🗺️', '🏖️', '🏔️', '🏕️', '🚗', '🚢', '🚁', '🎒'],
  'Gia đình': ['🏠', '👨‍👩‍👧‍👦', '❤️', '🎂', '🎉', '🎁', '👶', '🐶', '🐱', '🌻'],
  'Thể thao': ['⚽', '🏀', '🎾', '🏐', '🏈', '⚾', '🥎', '🏓', '🏸', '🥊'],
}

export default function EmojiPicker({ value, onChange, disabled }) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState('Phổ biến')

  const handleSelect = (emoji) => {
    onChange({ target: { name: 'icon', value: emoji } })
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Icon
      </label>
      
      {/* Selected Icon Display */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className="w-full h-12 border-2 border-gray-300 rounded-lg flex items-center justify-center text-4xl hover:border-blue-500 transition-colors bg-white disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={disabled}
      >
        {value || '🎯'}
      </button>

      {/* Picker Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />

          {/* Picker Panel */}
          <div className="absolute top-full left-0 mt-2 w-80 bg-white border-2 border-gray-300 rounded-lg shadow-2xl z-50 max-h-96 overflow-hidden">
            {/* Category Tabs */}
            <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50">
              {Object.keys(EMOJI_CATEGORIES).map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
                    activeCategory === category
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Emoji Grid */}
            <div className="p-3 grid grid-cols-8 gap-2 overflow-y-auto max-h-72">
              {EMOJI_CATEGORIES[activeCategory].map((emoji, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelect(emoji)}
                  className={`w-10 h-10 flex items-center justify-center text-2xl rounded-lg hover:bg-blue-50 transition-colors ${
                    value === emoji ? 'bg-blue-100 ring-2 ring-blue-500' : 'hover:scale-110'
                  }`}
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Quick Search hint */}
            <div className="border-t border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
              💡 Tip: Bạn cũng có thể paste emoji từ keyboard
            </div>
          </div>
        </>
      )}
    </div>
  )
}