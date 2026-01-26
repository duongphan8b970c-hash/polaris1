import { useState } from 'react'
import { useWallets } from '../hooks/useWallets'
import WalletList from '../components/wallets/WalletList'
import WalletForm from '../components/wallets/WalletForm'
import Modal from '../components/common/Modal'
import PageHeader from '../components/layout/PageHeader'
import Loading from '../components/common/Loading'
import ErrorMessage from '../components/common/ErrorMessage'

export default function WalletConfig() {
  const { wallets, loading, error, createWallet, updateWallet, refetch } = useWallets()
  const [showForm, setShowForm] = useState(false)
  const [editingWallet, setEditingWallet] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleCreate = () => {
    setEditingWallet(null)
    setShowForm(true)
  }

  const handleEdit = (wallet) => {
    setEditingWallet(wallet)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingWallet(null)
  }

  const handleSubmit = async (formData) => {
    setSubmitting(true)
    
    const result = editingWallet
      ? await updateWallet(editingWallet.id, formData)
      : await createWallet(formData)
    
    setSubmitting(false)
    
    if (result.success) {
      handleCloseForm()
    } else {
      alert('Lỗi: ' + result.error)
    }
  }

  if (loading) {
    return <Loading message="Đang tải ví..." />
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={refetch} />
  }

  return (
    <div>
      <PageHeader 
        title="Cấu hình ví" 
        subtitle="Quản lý các tài khoản và ví tiền"
        action={
          <button onClick={handleCreate} className="btn btn-primary">
            <svg className="w-5 h-5 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Thêm ví
          </button>
        }
      />

      <WalletList wallets={wallets} onEdit={handleEdit} />

      <Modal
        isOpen={showForm}
        onClose={handleCloseForm}
        title={editingWallet ? 'Sửa ví' : 'Thêm ví mới'}
      >
        <WalletForm
          wallet={editingWallet}
          onSubmit={handleSubmit}
          onCancel={handleCloseForm}
          loading={submitting}
        />
      </Modal>
    </div>
  )
}