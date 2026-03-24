import { useState } from 'react'
import { useKanjiCards } from '../../hooks/study/useKanjiCards'
import { useKanjiGroups } from '../../hooks/study/useKanjiGroups'
import KanjiCard from '../../components/study/KanjiCard'
import GroupSelectionModal from '../../components/study/GroupSelectionModal'
import RadicalSelectionModal from '../../components/study/RadicalSelectionModal'
import PageHeader from '../../components/layout/PageHeader'
import Loading from '../../components/common/Loading'
import ErrorMessage from '../../components/common/ErrorMessage'
import { fetchKanjiFromJisho } from '../../utils/jishoAPI'
import { CUSTOM_GROUP_RADICAL } from '../../constants/kanjiGroups'

export default function KanjiComparator() {
  const { cards, loading, error, addKanjiCard, updateKanjiCard, deleteKanjiCard, moveCardToGroup, refetch } = useKanjiCards()
  const { groups, createGroup, updateGroup, deleteGroup } = useKanjiGroups()

  const [inputValue, setInputValue] = useState('')
  const [adding, setAdding] = useState(false)

  // Group selection modal state: { kanji, radical }
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [pendingKanji, setPendingKanji] = useState(null)

  // Radical selection modal state
  const [showRadicalModal, setShowRadicalModal] = useState(false)

  // Inline rename state: { [groupId]: draftName }
  const [renamingGroup, setRenamingGroup] = useState(null)
  const [renameValue, setRenameValue] = useState('')

  // Drag & drop state
  const [dragOverGroupId, setDragOverGroupId] = useState(null)

  const handleAddKanji = async (e) => {
    e.preventDefault()
    if (adding) return
    const kanji = inputValue.trim()
    if (!kanji) return

    setAdding(true)
    try {
      const kanjiData = await fetchKanjiFromJisho(kanji)

      const radical = kanjiData.radical

      if (!radical) {
        // Show manual radical selection modal
        setPendingKanji({ kanji, radical: null, data: kanjiData })
        setShowRadicalModal(true)
      } else {
        // Show group selection modal
        setPendingKanji({ kanji, radical, data: kanjiData })
        setShowGroupModal(true)
      }
    } catch (err) {
      console.error('Error fetching Kanji:', err)
      alert('Failed to fetch Kanji data. Please try again.')
    } finally {
      setAdding(false)
    }
  }

  const handleRadicalSelected = (radical) => {
    if (pendingKanji) {
      setPendingKanji({ ...pendingKanji, radical })
      setShowRadicalModal(false)
      setShowGroupModal(true)
    }
  }

  const handleGroupSelected = async (groupId) => {
    if (!pendingKanji) return
    setAdding(true)
    const result = await addKanjiCard(pendingKanji.kanji, groupId, pendingKanji.radical)
    setAdding(false)
    if (result.success) {
      setInputValue('')
      setPendingKanji(null)
      setShowGroupModal(false)
    } else {
      alert('Error adding Kanji: ' + result.error)
    }
  }

  const handleCreateGroup = async (name) => {
    if (!pendingKanji) return
    
    const radical = pendingKanji.radical || 'No Radical'
    
    const result = await createGroup(radical, name)
    if (result.success && pendingKanji) {
      await addKanjiCard(pendingKanji.kanji, result.data.id, pendingKanji.radical)
      setInputValue('')
      setPendingKanji(null)
      setShowGroupModal(false)
    }
  }

  const handleSkipCustomGroup = async (customGroupName) => {
    if (!pendingKanji) return
    setAdding(true)
    try {
      if (customGroupName) {
        // Create a standalone custom group (regardless of whether radical exists)
        const result = await createGroup(CUSTOM_GROUP_RADICAL, customGroupName)
        if (result.success) {
          await addKanjiCard(pendingKanji.kanji, result.data.id, pendingKanji.radical)
        }
      } else {
        // Truly skip — add card without a group (goes to No Radical)
        await addKanjiCard(pendingKanji.kanji, null, null)
      }
      setInputValue('')
      setPendingKanji(null)
      setShowGroupModal(false)
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (cardId, groupId) => {
    if (!window.confirm('Remove this Kanji card?')) return

    // Determine if this is the last card in the group before deleting
    const isLastInGroup = groupId
      ? cards.filter(c => c.group_id === groupId).length === 1
      : false

    const result = await deleteKanjiCard(cardId)
    if (!result.success) {
      alert('Error deleting card: ' + result.error)
      return
    }

    // Auto-delete group if it was the last card
    if (isLastInGroup) {
      await deleteGroup(groupId)
    }
  }

  const handleStartRename = (group) => {
    setRenamingGroup(group.id)
    setRenameValue(group.name)
  }

  const handleSaveRename = async (groupId) => {
    const trimmed = renameValue.trim()
    if (!trimmed) return
    await updateGroup(groupId, { name: trimmed })
    setRenamingGroup(null)
    setRenameValue('')
  }

  const handleDeleteGroup = async (groupId) => {
    const group = groups.find(g => g.id === groupId)
    const cardsInGroup = cards.filter(c => c.group_id === groupId)

    const confirmMessage = cardsInGroup.length > 0
      ? `⚠️ Delete group "${group?.name}"?\n\nThis will permanently delete:\n- The group\n- ${cardsInGroup.length} card(s) inside\n\nThis action cannot be undone.`
      : `Delete empty group "${group?.name}"?`

    if (!window.confirm(confirmMessage)) return

    // Delete all cards in the group first
    for (const card of cardsInGroup) {
      await deleteKanjiCard(card.id)
    }

    // Then delete the group
    await deleteGroup(groupId)
  }

  // Drag & drop handlers
  const handleDragStart = (e, cardId) => {
    e.dataTransfer.setData('cardId', cardId)
  }

  const handleDragOver = (e, groupId) => {
    e.preventDefault()
    setDragOverGroupId(groupId)
  }

  const handleDragLeave = () => {
    setDragOverGroupId(null)
  }

  const handleDrop = async (e, targetGroupId) => {
    e.preventDefault()
    setDragOverGroupId(null)
    const cardId = e.dataTransfer.getData('cardId')
    if (!cardId) return

    const card = cards.find(c => c.id === cardId)
    if (!card || card.group_id === targetGroupId) return

    const sourceGroupId = card.group_id
    // Check if moving this card will empty the source group (before the async move)
    const isLastInSourceGroup = sourceGroupId
      ? cards.filter(c => c.group_id === sourceGroupId).length === 1
      : false

    const result = await moveCardToGroup(cardId, targetGroupId)
    if (!result.success) {
      alert('Error moving card: ' + result.error)
      return
    }

    // Auto-delete source group if it is now empty
    if (isLastInSourceGroup) {
      await deleteGroup(sourceGroupId)
    }
  }

  // Build nested structure: { [section]: { [groupId]: card[] } }
  // 'Custom' section for user-defined standalone groups, radical or 'No Radical' otherwise
  const groupedCards = cards.reduce((acc, card) => {
    const group = groups.find(g => g.id === card.group_id)
    const section = group?.radical === CUSTOM_GROUP_RADICAL ? CUSTOM_GROUP_RADICAL : (card.radical || 'No Radical')
    if (!acc[section]) acc[section] = {}
    const gid = card.group_id || 'ungrouped'
    if (!acc[section][gid]) acc[section][gid] = []
    acc[section][gid].push(card)
    return acc
  }, {})

  // Total card count per section
  const sectionCardCount = (section) =>
    Object.values(groupedCards[section] || {}).reduce((sum, arr) => sum + arr.length, 0)

  // Existing groups for the pending kanji's radical (derived from pre-fetched data)
  const pendingRadical = pendingKanji?.radical || null
  const groupsForModal = groups.filter(g => g.radical === (pendingRadical || 'No Radical'))
  // All custom (theme) groups available for the Skip panel
  const existingCustomGroups = groups.filter(g => g.radical === CUSTOM_GROUP_RADICAL)

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
        title="🎌 Kanji Group & Comparator"
        subtitle="Gom nhóm và so sánh Kanji — theo Radical hoặc chủ đề tùy chọn"
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
              Copy Kanji directly from{' '}
              <a href="https://jisho.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                Jisho.org
              </a>
            </span>
          </div>
        </form>
      </div>

      {/* Cards — empty state */}
      {cards.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-7xl mb-4">🎌</div>
          <p className="text-gray-500 font-medium text-lg mb-2">No Kanji cards yet</p>
          <p className="text-gray-400">Add your first Kanji to start comparing!</p>
        </div>
      ) : (
        /* Grouped display: Section (Radical / Custom) → Subgroups → Cards */
        <div className="space-y-6">
          {Object.entries(groupedCards).map(([section, groupsInSection]) => {
            const isCustom = section === CUSTOM_GROUP_RADICAL
            const count = sectionCardCount(section)
            return (
            <div key={section} className={`card p-6 border ${isCustom ? 'border-purple-200' : 'border-gray-200'}`}>
              {/* Section header */}
              <div className="flex items-center gap-3 mb-5">
                <span className="text-4xl">
                  {isCustom ? '🏷️' : section !== 'No Radical' ? section : '🔤'}
                </span>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {isCustom ? 'Nhóm tùy chọn' : `Radical: ${section}`}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {count} {count === 1 ? 'card' : 'cards'}
                    {isCustom && (
                      <span className="ml-2 text-purple-600 text-xs font-medium">
                        (nhóm chủ đề)
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Subgroups */}
              <div className="space-y-4">
                {Object.entries(groupsInSection).map(([groupId, cardsInGroup]) => {
                  const group = groups.find(g => g.id === groupId)
                  const groupName = group?.name || 'Ungrouped'
                  const isDragOver = dragOverGroupId === groupId

                  return (
                    <div
                      key={groupId}
                      className={`border rounded-lg p-4 transition-colors ${
                        isDragOver
                          ? 'border-blue-400 bg-blue-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                      onDragOver={(e) => handleDragOver(e, groupId)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, groupId)}
                    >
                      {/* Subgroup header */}
                      <div className="flex items-center gap-2 mb-3">
                        {renamingGroup === groupId ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="text"
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveRename(groupId)
                                if (e.key === 'Escape') setRenamingGroup(null)
                              }}
                              className="px-2 py-1 text-sm border border-blue-400 rounded-lg focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveRename(groupId)}
                              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setRenamingGroup(null)}
                              className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <h3 className="text-base font-semibold text-gray-800 flex-1">
                              {groupName}
                            </h3>
                            {group && (
                              <>
                                <button
                                  onClick={() => handleStartRename(group)}
                                  className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                                  title="Rename group"
                                >
                                  ✏️ Rename
                                </button>
                                <button
                                  onClick={() => handleDeleteGroup(group.id)}
                                  className="text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                                  title="Delete group"
                                >
                                  🗑️ Delete
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>

                      {/* Cards grid — responsive, wraps to new rows */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {cardsInGroup.map(card => (
                          <div
                            key={card.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, card.id)}
                            className="cursor-grab active:cursor-grabbing"
                          >
                            <KanjiCard
                              card={card}
                              onUpdate={updateKanjiCard}
                              onDelete={(id) => handleDelete(id, card.group_id)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            )
          })}
        </div>
      )}

      {/* Group Selection Modal */}
      <GroupSelectionModal
        isOpen={showGroupModal}
        onClose={() => {
          setShowGroupModal(false)
          setPendingKanji(null)
        }}
        radical={pendingRadical}
        existingGroups={groupsForModal}
        existingCustomGroups={existingCustomGroups}
        onSelectGroup={handleGroupSelected}
        onCreateGroup={handleCreateGroup}
        onSkipCustomGroup={handleSkipCustomGroup}
      />

      {/* Radical Selection Modal */}
      <RadicalSelectionModal
        isOpen={showRadicalModal}
        onClose={() => {
          setShowRadicalModal(false)
          setPendingKanji(null)
        }}
        onSelectRadical={handleRadicalSelected}
        kanji={pendingKanji?.kanji}
      />
    </div>
  )
}

