import { useState } from 'react'
import { useBudgets } from '../hooks/useBudgets'
import BudgetList from '../components/budgets/BudgetList'
import BudgetForm from '../components/budgets/BudgetForm'
import Modal from '../components/common/Modal'
import PageHeader from '../components/layout/PageHeader'
import Loading from '../components/common/Loading'
import ErrorMessage from '../components/common/ErrorMessage'

export default function Budgets() {
  const { budgets, loading, error, createBudget, updateBudget, deleteBudget, refetch } = useBudgets()
  
  const [showForm, setShowForm] = useState(false)
  const [editingBudget, setEditingBudget] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleCreate = () => {
    setEditingBudget(null)
    setShowForm(true)
  }

  const handleEdit = (budget) => {
    setEditingBudget(budget)
    setShowForm(true)
  }

  const handleDelete = async (budget) => {
    if (!confirm(`Xóa ngân sách "${budget.category?.name}"?`)) return
    
    const result = await deleteBudget(budget.id)
    if (!result.success) {
      alert('Lỗi: ' + result.error)
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingBudget(null)
  }

  const handleSubmit = async (formData) => {
    setSubmitting(true)
    
    const result = editingBudget
      ? await updateBudget(editingBudget.id, formData)
      : await createBudget(formData)
    
    setSubmitting(false)
    
    if (result.success) {
      handleCloseForm()
    } else {
      alert('Lỗi: ' + result.error)
    }
  }

  if (loading) {
    return <Loading message="Đang tải ngân sách..." />
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={refetch} />
  }

  return (
    <div>
      <PageHeader 
        title="Ngân sách" 
        subtitle="Quản lý hạn mức chi tiêu"
        action={
          <button onClick={handleCreate} className="btn btn-primary">
            <svg className="w-5 h-5 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Thêm ngân sách
          </button>
        }
      />

      <BudgetList
        budgets={budgets}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Modal
        isOpen={showForm}
        onClose={handleCloseForm}
        title={editingBudget ? 'Sửa ngân sách' : 'Thêm ngân sách mới'}
      >
        <BudgetForm
          budget={editingBudget}
          onSubmit={handleSubmit}
          onCancel={handleCloseForm}
          loading={submitting}
        />
      </Modal>
    </div>
  )
}