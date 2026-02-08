import { useState } from 'react'
import { useWallets } from '../../hooks/finance/useWallets'
import WalletList from '../../components/wallets/WalletList'
import WalletForm from '../../components/wallets/WalletForm'
import Modal from '../../components/common/Modal'
import PageHeader from '../../components/layout/PageHeader'
import Loading from '../../components/common/Loading'
import ErrorMessage from '../../components/common/ErrorMessage'
import { WALLET_TYPES, getWalletTypeInfo } from '../../constants' 

export default function WalletConfig() {
  const { wallets, loading, error, createWallet, updateWallet, refetch } = useWallets()
  const [showForm, setShowForm] = useState(false)
  const [editingWallet, setEditingWallet] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // ✅ Filter wallets by type
  const filteredWallets = useMemo(() => {
    return selectedType === 'all' 
      ? wallets 
      : wallets.filter(w => w.type === selectedType)
  }, [wallets, selectedType])

  // ✅ Group wallets by type
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
        action={
          <button onClick={handleCreate} className="btn btn-primary">
            <svg className="w-5 h-5 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Thêm ví
          </button>
        }
      />
      {/* ✅ Filter Buttons */}
      <div className="mb-6 flex flex-wrap gap-2">
        {WALLET_TYPES.map(type => {
          const count = type.value === 'all' 
            ? wallets.length 
            : wallets.filter(w => w.type === type.value).length
          
          return (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                selectedType === type.value
                  ? `${type.color} ring-2 ring-offset-2 ${type.activeRing} shadow-md`
                  : `bg-gray-50 text-gray-600 border border-gray-200 ${type.hoverColor}`
              }`}
              title={type.description}
            >
              <span className="mr-1.5">{type.icon}</span>
              {type.label}
              <span className="ml-1.5 text-xs opacity-70">({count})</span>
            </button>
          )
        })}
      </div>

      {/* ✅ OPTION C: Grouped khi "Tất cả", Filtered khi chọn type cụ thể */}
      {selectedType === 'all' ? (
        /* Show grouped by type */
        <div className="space-y-8">
          {Object.keys(groupedWallets).length === 0 ? (
            <div className="card text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <p className="text-gray-500">Chưa có ví nào</p>
            </div>
          ) : (
            Object.entries(groupedWallets)
              .sort((a, b) => {
                // Sort by type order in WALLET_TYPES
                const orderA = WALLET_TYPES.findIndex(t => t.value === a[0])
                const orderB = WALLET_TYPES.findIndex(t => t.value === b[0])
                return orderA - orderB
              })
              .map(([type, typeWallets]) => {
                const typeInfo = getWalletTypeInfo(type)
                return (
                  <div key={type}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`px-3 py-1.5 rounded-lg ${typeInfo.color} font-medium text-sm`}>
                        <span className="mr-1.5">{typeInfo.icon}</span>
                        {typeInfo.label}
                        <span className="ml-1.5 opacity-70">({typeWallets.length})</span>
                      </div>
                      <div className="flex-1 h-px bg-gray-200"></div>
                    </div>
                    <WalletList wallets={typeWallets} onEdit={handleEdit} />
                  </div>
                )
              })
          )}
        </div>
      ) : (
        /* Show filtered flat list */
        filteredWallets.length > 0 ? (
          <WalletList wallets={filteredWallets} onEdit={handleEdit} />
        ) : (
          <div className="card text-center py-12">
            <div className="text-4xl mb-4">{getWalletTypeInfo(selectedType).icon}</div>
            <p className="text-gray-500 font-medium">Chưa có ví {getWalletTypeInfo(selectedType).label.toLowerCase()}</p>
            <button 
              onClick={handleCreate}
              className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              + Tạo ví mới
            </button>
          </div>
        )
      )}

      {/* Modal */}
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