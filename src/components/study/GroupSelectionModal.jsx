import { useState } from 'react'

export default function GroupSelectionModal({
  isOpen,
  onClose,
  radical,
  existingGroups = [],
  existingCustomGroups = [],
  onSelectGroup,
  onCreateGroup,
  onSkipCustomGroup
}) {
  const [newGroupName, setNewGroupName] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [showSkipInput, setShowSkipInput] = useState(false)
  const [skipGroupName, setSkipGroupName] = useState('')
  const [selectedCustomGroupId, setSelectedCustomGroupId] = useState(null)

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (selectedGroupId) {
      await onSelectGroup(selectedGroupId)
    } else if (newGroupName.trim()) {
      // Chỉ pass name, radical sẽ lấy từ pendingKanji
      await onCreateGroup(newGroupName.trim())
    }
    onClose()
  }

  const handleSkip = () => {
    // Always show the custom group panel — whether radical exists or not
    setSkipGroupName('')
    setSelectedCustomGroupId(null)
    setShowSkipInput(true)
    setSelectedGroupId(null)
    setNewGroupName('')
  }

  const handleSkipSubmit = async () => {
    setSubmitting(true)
    try {
      if (selectedCustomGroupId) {
        // Add to existing custom group
        await onSelectGroup(selectedCustomGroupId)
      } else if (skipGroupName.trim()) {
        // Create new custom group
        await onSkipCustomGroup(skipGroupName.trim())
      }
    } finally {
      setSubmitting(false)
      handleClose()
    }
  }

  const handleSkipToNoRadical = async () => {
    setSubmitting(true)
    try {
      await onSkipCustomGroup(null)
    } finally {
      setSubmitting(false)
      handleClose()
    }
  }

  const handleClose = () => {
    setNewGroupName('')
    setSelectedGroupId(null)
    setShowSkipInput(false)
    setSkipGroupName('')
    setSelectedCustomGroupId(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        {showSkipInput ? (
          <>
            <h3 className="text-lg font-semibold mb-1">Nhóm tùy chọn</h3>
            <p className="text-sm text-gray-500 mb-4">
              Chọn nhóm có sẵn hoặc tạo nhóm mới để gom các kanji cùng chủ đề
            </p>

            {/* Existing custom groups */}
            {existingCustomGroups.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn nhóm tùy chọn đã tạo:
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {existingCustomGroups.map(group => (
                    <label
                      key={group.id}
                      className="flex items-center gap-2 p-2 border rounded-lg hover:bg-purple-50 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="customGroup"
                        value={group.id}
                        checked={selectedCustomGroupId === group.id}
                        onChange={() => {
                          setSelectedCustomGroupId(group.id)
                          setSkipGroupName('')
                        }}
                      />
                      <span className="text-sm">🏷️ {group.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Create new custom group */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {existingCustomGroups.length > 0 ? 'Hoặc tạo nhóm mới:' : 'Tên nhóm mới:'}
              </label>
              <input
                type="text"
                value={skipGroupName}
                onChange={(e) => {
                  setSkipGroupName(e.target.value)
                  setSelectedCustomGroupId(null)
                }}
                placeholder="e.g., Bốn mùa, Thiên nhiên, Màu sắc…"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleSkipSubmit()}
                autoFocus={existingCustomGroups.length === 0}
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSkipInput(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                >
                  Quay lại
                </button>
                <button
                  onClick={handleSkipSubmit}
                  disabled={(!selectedCustomGroupId && !skipGroupName.trim()) || submitting}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                >
                  {submitting ? 'Đang xử lý...' : selectedCustomGroupId ? 'Thêm vào nhóm' : 'Tạo nhóm'}
                </button>
              </div>
              <button
                onClick={handleSkipToNoRadical}
                disabled={submitting}
                className="w-full px-4 py-2 text-gray-400 hover:text-gray-600 text-xs hover:bg-gray-50 rounded-lg transition-colors"
              >
                Bỏ qua — thêm vào No Radical
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-lg font-semibold mb-1">Add Kanji to Group</h3>
            {radical && (
              <p className="text-sm text-gray-500 mb-4">
                Radical: <span className="text-2xl align-middle">{radical}</span>
              </p>
            )}

            {/* Existing groups */}
            {existingGroups.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select existing group:
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {existingGroups.map(group => (
                    <label
                      key={group.id}
                      className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="group"
                        value={group.id}
                        checked={selectedGroupId === group.id}
                        onChange={() => {
                          setSelectedGroupId(group.id)
                          setNewGroupName('')
                        }}
                      />
                      <span className="text-sm">{group.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Create new group */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {existingGroups.length > 0 ? 'Or create new group:' : 'Create a group:'}
              </label>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => {
                  setNewGroupName(e.target.value)
                  setSelectedGroupId(null)
                }}
                placeholder="e.g., Speaking verbs"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSkip}
                className="flex-1 px-4 py-2 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 text-sm font-medium transition-colors"
                title="Tạo hoặc chọn nhóm tùy chọn"
              >
                🏷️ Bỏ qua
              </button>
              <button
                onClick={handleSubmit}
                disabled={(!selectedGroupId && !newGroupName.trim()) || submitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
              >
                {submitting ? 'Adding...' : 'Add'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
