import { useState } from 'react'
import { useWallets } from '../../hooks/finance/useWallets'
import WalletList from '../../components/wallets/WalletList'
import WalletForm from '../../components/wallets/WalletForm'
import Modal from '../../components/common/Modal'
import Loading from '../../components/common/Loading'

export default function Wallets() {
  const { 
    wallets, 
    loading, 
    createWallet, 
    updateWallet, 
    deleteWallet, 
    resetWalletBalance, 
    refetch 
  } = useWallets()
  
  const [showModal, setShowModal] = useState(false)
  const [editingWallet, setEditingWallet] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleCreate = () => {
    setEditingWallet(null)
    setShowModal(true)
  }

  const handleEdit = (wallet) => {
    setEditingWallet(wallet)
    setShowModal(true)
  }

  const handleDelete = async (wallet) => {
    if (!window.confirm(`Xóa ví "${wallet.name}"? Tất cả giao dịch liên quan sẽ bị xóa.`)) {
      return
    }

    // Implement delete wallet function
    // For now, just show alert
    alert('Chức năng xóa ví đang được phát triển')
  }

  const handleSubmit = async (formData) => {
    setSubmitting(true)
    
    let result
    if (editingWallet) {
      result = await updateWallet(editingWallet.id, formData)
    } else {
      result = await createWallet(formData)
    }

    if (result.success) {
      setShowModal(false)
      setEditingWallet(null)
      await refetch()
    } else {
      alert(`Lỗi: ${result.error}`)
    }
    
    setSubmitting(false)
  }

  const handleResetBalance = async (walletId, newBalance) => {
    const result = await resetWalletBalance(walletId, newBalance)
    
    if (result.success) {
      alert(result.message)
      await refetch()
    } else {
      alert(`Lỗi: ${result.error}`)
    }
  }

  if (loading) {
    return <Loading message="Đang tải ví..." />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ví của bạn</h1>
          <p className="text-gray-600 mt-1">
            Quản lý các tài khoản và ví tiền của bạn
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="btn btn-primary flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tạo ví mới
        </button>
      </div>

      {/* Wallet List */}
      <WalletList
        wallets={wallets}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onResetBalance={handleResetBalance}
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingWallet(null)
        }}
        title={editingWallet ? 'Sửa ví' : 'Tạo ví mới'}
      >
        <WalletForm
          wallet={editingWallet}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowModal(false)
            setEditingWallet(null)
          }}
          loading={submitting}
        />
      </Modal>
    </div>
  )
}