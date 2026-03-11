import { useState } from 'react'

export default function GroupSelectionModal({
  isOpen,
  onClose,
  radical,
  existingGroups = [],
  onSelectGroup,
  onCreateGroup
}) {
  const [newGroupName, setNewGroupName] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (selectedGroupId) {
      await onSelectGroup(selectedGroupId)
    } else if (newGroupName.trim()) {
      // ✅ FIX: Chỉ pass name, radical sẽ lấy từ pendingKanji
      await onCreateGroup(newGroupName.trim())
    }
    onClose()
  }

  const handleClose = () => {
    setNewGroupName('')
    setSelectedGroupId(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
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
            onClick={handleSubmit}
            disabled={(!selectedGroupId && !newGroupName.trim()) || submitting}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
          >
            {submitting ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  )
}
