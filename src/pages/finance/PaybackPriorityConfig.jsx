import { useState } from 'react'
import { usePaybackPriorities } from '../../hooks/finance/usePaybackPriorities'
import PaybackPriorityForm from '../../components/payback/PaybackPriorityForm'
import Modal from '../../components/common/Modal'
import PageHeader from '../../components/layout/PageHeader'
import Loading from '../../components/common/Loading'
import ErrorMessage from '../../components/common/ErrorMessage'

export default function PaybackPriorityConfig() {
  const { priorities, loading, error, createPriority, updatePriority, deletePriority, refetch } = usePaybackPriorities()
  
  const [showForm, setShowForm] = useState(false)
  const [editingPriority, setEditingPriority] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleCreate = () => {
    setEditingPriority(null)
    setShowForm(true)
  }

  const handleEdit = (priority) => {
    setEditingPriority(priority)
    setShowForm(true)
  }

  const handleDelete = async (priority) => {
    if (!confirm(`Xóa priority "${priority.name}"?`)) return
    
    const result = await deletePriority(priority.id)
    if (!result.success) {
      alert('Lỗi: ' + result.error)
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingPriority(null)
  }

  const handleSubmit = async (formData) => {
    setSubmitting(true)
    
    const result = editingPriority
      ? await updatePriority(editingPriority.id, formData)
      : await createPriority(formData)
    
    if (result.success) {
      handleCloseForm()
    } else {
      alert('Lỗi: ' + result.error)
    }
    
    setSubmitting(false)
  }

  if (loading) {
    return <Loading message="Đang tải priorities..." />
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={refetch} />
  }

  return (
    <div>
      <PageHeader 
        title="Quản lý Priorities" 
        subtitle="Tùy chỉnh mức độ ưu tiên cho payback goals"
        action={
          <button onClick={handleCreate} className="btn btn-primary">
            <svg className="w-5 h-5 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Thêm Priority
          </button>
        }
      />

      {/* Priority List */}
      {priorities.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-3xl mb-3">📌</div>
          <p className="text-gray-500 font-medium">Chưa có priority nào</p>
          <button onClick={handleCreate} className="mt-4 text-sm text-blue-600 hover:text-blue-700">
            + Tạo priority đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {priorities.map(priority => (
            <div 
              key={priority.id}
              className="card hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{priority.icon}</span>
                  <div>
                    <h3 className="font-bold text-gray-900">{priority.name}</h3>
                    <p className="text-xs text-gray-500">Thứ tự: {priority.sort_order}</p>
                  </div>
                </div>
              </div>

              {/* Color Preview */}
              <div 
                className="px-3 py-2 rounded-lg mb-2.5 text-xs font-medium"
                style={{ 
                  backgroundColor: `${priority.color}20`, 
                  color: priority.color,
                  border: `2px solid ${priority.color}40`
                }}
              >
                {priority.icon} {priority.name}
              </div>

              {/* Actions */}
              <div className="flex gap-1.5">
                <button
                  onClick={() => handleEdit(priority)}
                  className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  Sửa
                </button>
                <button
                  onClick={() => handleDelete(priority)}
                  className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={handleCloseForm}
        title={editingPriority ? 'Sửa Priority' : 'Tạo Priority Mới'}
      >
        <PaybackPriorityForm
          priority={editingPriority}
          onSubmit={handleSubmit}
          onCancel={handleCloseForm}
          loading={submitting}
        />
      </Modal>
    </div>
  )
}