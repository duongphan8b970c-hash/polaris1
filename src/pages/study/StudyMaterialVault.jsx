import { useState, useMemo } from 'react'
import { useStudyMaterials } from '../../hooks/study/useStudyMaterials'
import MaterialCard from '../../components/study/MaterialCard'
import MaterialFormModal from '../../components/study/MaterialFormModal'
import MaterialDetailModal from '../../components/study/MaterialDetailModal'
import PageHeader from '../../components/layout/PageHeader'
import Loading from '../../components/common/Loading'
import ErrorMessage from '../../components/common/ErrorMessage'

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'grammar', label: 'Grammar' },
  { value: 'vocab', label: 'Vocab' },
  { value: 'kanji', label: 'Kanji' },
  { value: 'general', label: 'General' },
]

export default function StudyMaterialVault() {
  const { materials, loading, error, createMaterial, updateMaterial, deleteMaterial, uploadImage } = useStudyMaterials()

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [view, setView] = useState('grid') // 'grid' | 'list'

  const [formOpen, setFormOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState(null)

  const [detailOpen, setDetailOpen] = useState(false)
  const [viewingMaterial, setViewingMaterial] = useState(null)

  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Filter + search
  const filtered = useMemo(() => {
    return materials.filter(m => {
      const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory
      const q = search.toLowerCase()
      const matchesSearch =
        !q ||
        m.title.toLowerCase().includes(q) ||
        (m.content || '').toLowerCase().includes(q) ||
        (m.tags || []).some(t => t.toLowerCase().includes(q))
      return matchesCategory && matchesSearch
    })
  }, [materials, selectedCategory, search])

  const handleOpenCreate = () => {
    setEditingMaterial(null)
    setFormOpen(true)
  }

  const handleOpenEdit = (material) => {
    setDetailOpen(false)
    setEditingMaterial(material)
    setFormOpen(true)
  }

  const handleView = (material) => {
    setViewingMaterial(material)
    setDetailOpen(true)
  }

  const handleSave = async (formData) => {
    if (editingMaterial) {
      return await updateMaterial(editingMaterial.id, formData)
    }
    return await createMaterial(formData)
  }

  const handleDeleteRequest = (material) => {
    setDetailOpen(false)
    setDeleteConfirm(material)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return
    setDeleting(true)
    await deleteMaterial(deleteConfirm.id)
    setDeleting(false)
    setDeleteConfirm(null)
  }

  if (loading) return <Loading />
  if (error) return <ErrorMessage message={error} />

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Study Material Vault"
        subtitle="Manage your study notes, images and references"
        action={
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Material
          </button>
        }
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, content or tag..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1">
          <button
            onClick={() => setView('grid')}
            className={`p-1.5 rounded transition-colors ${view === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            title="Grid view"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-1.5 rounded transition-colors ${view === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            title="List view"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 flex-wrap mb-5">
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === cat.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-400 self-center">
          {filtered.length} {filtered.length === 1 ? 'material' : 'materials'}
        </span>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm">
            {search || selectedCategory !== 'all' ? 'No materials match your filters.' : 'No materials yet. Create your first one!'}
          </p>
          {!search && selectedCategory === 'all' && (
            <button
              onClick={handleOpenCreate}
              className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              + New Material
            </button>
          )}
        </div>
      )}

      {/* Grid view */}
      {view === 'grid' && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(material => (
            <MaterialCard
              key={material.id}
              material={material}
              onView={handleView}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteRequest}
            />
          ))}
        </div>
      )}

      {/* List view */}
      {view === 'list' && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map(material => (
            <ListRow
              key={material.id}
              material={material}
              onView={handleView}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteRequest}
            />
          ))}
        </div>
      )}

      {/* Form modal */}
      <MaterialFormModal
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditingMaterial(null) }}
        onSave={handleSave}
        onUploadImage={uploadImage}
        material={editingMaterial}
      />

      {/* Detail modal */}
      <MaterialDetailModal
        isOpen={detailOpen}
        onClose={() => { setDetailOpen(false); setViewingMaterial(null) }}
        onEdit={handleOpenEdit}
        onDelete={handleDeleteRequest}
        material={viewingMaterial}
      />

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Material</h3>
            <p className="text-sm text-gray-600 mb-5">
              Are you sure you want to delete <strong>{deleteConfirm.title}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// List row component
function ListRow({ material, onView, onEdit, onDelete }) {
  const CATEGORY_COLORS = {
    grammar: 'bg-blue-100 text-blue-700',
    vocab: 'bg-green-100 text-green-700',
    kanji: 'bg-purple-100 text-purple-700',
    general: 'bg-gray-100 text-gray-700',
  }
  const CATEGORY_LABELS = {
    grammar: 'Grammar', vocab: 'Vocab', kanji: 'Kanji', general: 'General',
  }

  const date = new Date(material.created_at).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
  const preview = (() => {
    if (!material.content) return ''
    const div = document.createElement('div')
    div.innerHTML = material.content
    return ((div.textContent || div.innerText || '').trim()).slice(0, 100)
  })()

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 px-4 py-3">
      {material.images?.length > 0 && (
        <img src={material.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[material.category] || CATEGORY_COLORS.general}`}>
            {CATEGORY_LABELS[material.category] || material.category}
          </span>
          <span className="text-xs text-gray-400">{date}</span>
        </div>
        <p className="font-medium text-gray-900 text-sm truncate">{material.title}</p>
        {preview && <p className="text-xs text-gray-500 truncate">{preview}</p>}
      </div>
      {material.tags?.length > 0 && (
        <div className="hidden sm:flex flex-wrap gap-1 max-w-[140px]">
          {material.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">#{tag}</span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={() => onView(material)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors" title="View">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
        <button onClick={() => onEdit(material)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors" title="Edit">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button onClick={() => onDelete(material)} className="p-1.5 text-red-400 hover:bg-red-50 rounded transition-colors" title="Delete">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}
