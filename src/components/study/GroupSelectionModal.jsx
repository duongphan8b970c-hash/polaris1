import { useState } from 'react'

// Which "section" the user is actively filling in
const SECTION_RADICAL = 'radical'
const SECTION_CUSTOM = 'custom'

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
  const [selectedGroupId, setSelectedGroupId] = useState(null)
  const [newGroupName, setNewGroupName] = useState('')
  const [selectedCustomGroupId, setSelectedCustomGroupId] = useState(null)
  const [newCustomGroupName, setNewCustomGroupName] = useState('')
  const [activeSection, setActiveSection] = useState(SECTION_RADICAL)
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  // Clear the other section when user interacts with this one
  const activateRadical = () => setActiveSection(SECTION_RADICAL)
  const activateCustom = () => setActiveSection(SECTION_CUSTOM)

  const canSubmit = activeSection === SECTION_RADICAL
    ? (selectedGroupId !== null || newGroupName.trim() !== '')
    : (selectedCustomGroupId !== null || newCustomGroupName.trim() !== '')

  const handleSubmit = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      if (activeSection === SECTION_RADICAL) {
        if (selectedGroupId) {
          await onSelectGroup(selectedGroupId)
        } else if (newGroupName.trim()) {
          await onCreateGroup(newGroupName.trim())
        }
      } else {
        if (selectedCustomGroupId) {
          await onSelectGroup(selectedCustomGroupId)
        } else if (newCustomGroupName.trim()) {
          await onSkipCustomGroup(newCustomGroupName.trim())
        }
      }
    } finally {
      setSubmitting(false)
      handleClose()
    }
  }

  const handleSkipToNoRadical = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      await onSkipCustomGroup(null)
    } finally {
      setSubmitting(false)
      handleClose()
    }
  }

  const handleClose = () => {
    setSelectedGroupId(null)
    setNewGroupName('')
    setSelectedCustomGroupId(null)
    setNewCustomGroupName('')
    setActiveSection(SECTION_RADICAL)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-1">Thêm Kanji vào nhóm</h3>
        {radical && (
          <p className="text-sm text-gray-500 mb-4">
            Radical: <span className="text-2xl align-middle">{radical}</span>
          </p>
        )}

        {/* ── Section 1: Radical-based group ── */}
        <div
          className={`border rounded-lg p-4 mb-3 transition-colors cursor-pointer ${
            activeSection === SECTION_RADICAL ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
          }`}
          onClick={activateRadical}
        >
          <p className="text-sm font-semibold text-gray-700 mb-3">
            {radical ? `Nhóm theo radical "${radical}"` : 'Nhóm theo radical'}
          </p>

          {/* Existing radical groups */}
          {existingGroups.length > 0 && (
            <div className="mb-3">
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {existingGroups.map(group => (
                  <label
                    key={group.id}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-white cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="radio"
                      name="radicalGroup"
                      value={group.id}
                      checked={selectedGroupId === group.id && activeSection === SECTION_RADICAL}
                      onChange={() => {
                        activateRadical()
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

          <input
            type="text"
            value={newGroupName}
            onClick={(e) => { e.stopPropagation(); activateRadical() }}
            onChange={(e) => {
              activateRadical()
              setNewGroupName(e.target.value)
              setSelectedGroupId(null)
            }}
            placeholder={existingGroups.length > 0 ? 'Hoặc tạo nhóm radical mới…' : 'Tên nhóm radical mới…'}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
            onKeyDown={(e) => e.key === 'Enter' && canSubmit && handleSubmit()}
          />
        </div>

        {/* ── Divider ── */}
        <div className="flex items-center gap-3 my-3">
          <div className="flex-1 border-t border-gray-200" />
          <span className="text-xs text-gray-400 font-medium">HOẶC</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        {/* ── Section 2: Custom thematic group ── */}
        <div
          className={`border rounded-lg p-4 mb-4 transition-colors cursor-pointer ${
            activeSection === SECTION_CUSTOM ? 'border-purple-400 bg-purple-50' : 'border-gray-200'
          }`}
          onClick={activateCustom}
        >
          <p className="text-sm font-semibold text-gray-700 mb-3">🏷️ Nhóm tùy chọn</p>

          {/* Existing custom groups */}
          {existingCustomGroups.length > 0 && (
            <div className="mb-3">
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {existingCustomGroups.map(group => (
                  <label
                    key={group.id}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-white cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="radio"
                      name="customGroup"
                      value={group.id}
                      checked={selectedCustomGroupId === group.id && activeSection === SECTION_CUSTOM}
                      onChange={() => {
                        activateCustom()
                        setSelectedCustomGroupId(group.id)
                        setNewCustomGroupName('')
                      }}
                    />
                    <span className="text-sm">🏷️ {group.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <input
            type="text"
            value={newCustomGroupName}
            onClick={(e) => { e.stopPropagation(); activateCustom() }}
            onChange={(e) => {
              activateCustom()
              setNewCustomGroupName(e.target.value)
              setSelectedCustomGroupId(null)
            }}
            placeholder={existingCustomGroups.length > 0 ? 'Hoặc tạo nhóm tùy chọn mới…' : 'vd: Bốn mùa, Thiên nhiên, Màu sắc…'}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white"
            onKeyDown={(e) => e.key === 'Enter' && canSubmit && handleSubmit()}
          />
        </div>

        {/* ── Actions ── */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
          >
            {submitting ? 'Đang xử lý...' : 'Thêm'}
          </button>
        </div>

        {/* Escape: truly skip to No Radical */}
        <button
          onClick={handleSkipToNoRadical}
          disabled={submitting}
          className="w-full mt-2 px-4 py-2 text-gray-400 hover:text-gray-600 text-xs hover:bg-gray-50 rounded-lg transition-colors"
        >
          Bỏ qua — thêm vào No Radical
        </button>
      </div>
    </div>
  )
}
