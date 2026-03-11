import { useState, useMemo } from 'react'
import { useWallets } from '../../hooks/finance/useWallets'
import WalletList from '../../components/wallets/WalletList'
import WalletForm from '../../components/wallets/WalletForm'
import Modal from '../../components/common/Modal'
import PageHeader from '../../components/layout/PageHeader'
import Loading from '../../components/common/Loading'
import ErrorMessage from '../../components/common/ErrorMessage'
import { WALLET_TYPES, getWalletTypeInfo } from '../../constants' 

export default function WalletConfig() {
  const { 
    wallets, 
    loading, 
    error, 
    createWallet, 
    updateWallet, 
    resetWalletBalance,
    refetch 
  } = useWallets()
  
  const [showForm, setShowForm] = useState(false)
  const [editingWallet, setEditingWallet] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [selectedType, setSelectedType] = useState('all')

  // Filter wallets by type
  const filteredWallets = useMemo(() => {
    return selectedType === 'all' 
      ? wallets 
      : wallets.filter(w => w.type === selectedType)
  }, [wallets, selectedType])

  // Group wallets by type
  const groupedWallets = useMemo(() => {
    const groups = {}
    
    wallets.forEach(wallet => {
      const type = wallet.type || 'other'
      if (!groups[type]) {
        groups[type] = []
      }
      groups[type].push(wallet)
    })
    
    return groups
  }, [wallets])

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

  // Handle reset balance - match WalletCard's signature
  const handleResetBalance = async (walletId, newBalance) => {
    const result = await resetWalletBalance(walletId, newBalance)
    
    if (result.success) {
      alert(result.message || '✅ Đã reset số dư thành công!')
    } else {
      alert('❌ Lỗi: ' + result.error)
    }
  }

  const handleDelete = async (wallet) => {
    if (!confirm(`Xác nhận xóa ví "${wallet.name}"?`)) return
    
    alert('Chức năng xóa ví đang được phát triển')
  }

  if (loading) {
    return <Loading message="Đang tải ví..." />
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={refetch} />
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader 
        title="Cấu hình ví" 
        action={
          <button onClick={handleCreate} className="btn btn-primary">
            <svg className="w-5 h-5 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Thêm ví
          </button>
        }
      />

      {/* Filter Tabs */}
      <div className="card">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedType === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Tất cả ({wallets.length})
          </button>
          
          {Object.keys(WALLET_TYPES).map(type => {
            const count = wallets.filter(w => w.type === type).length
            if (count === 0) return null
            
            const typeInfo = getWalletTypeInfo(type)
            return (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {typeInfo.icon} {typeInfo.label} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Wallet List */}
      {filteredWallets.length === 0 ? (
        <div className="card text-center py-12">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <p className="text-gray-500 font-medium mb-2">
            {selectedType === 'all' ? 'Chưa có ví nào' : `Chưa có ví ${getWalletTypeInfo(selectedType).label}`}
          </p>
          <p className="text-gray-400 text-sm">
            {selectedType === 'all' ? 'Tạo ví đầu tiên của bạn!' : 'Thêm ví mới cho loại này'}
          </p>
        </div>
      ) : (
        <WalletList 
          wallets={filteredWallets}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onResetBalance={handleResetBalance}
        />
      )}

      {/* Wallet Form Modal */}
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