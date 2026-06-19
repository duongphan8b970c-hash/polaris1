import { useState, useMemo, useEffect } from 'react'
import { useWallets } from '../../hooks/finance/useWallets'
import WalletList from '../../components/wallets/WalletList'
import WalletForm from '../../components/wallets/WalletForm'
import Modal from '../../components/common/Modal'
import PageHeader from '../../components/layout/PageHeader'
import Loading from '../../components/common/Loading'
import ErrorMessage from '../../components/common/ErrorMessage'
import { getWalletTypeInfo } from '../../constants' 

export default function WalletConfig() {
  const { 
    wallets, 
    loading, 
    error, 
    createWallet, 
    updateWallet, 
    resetWalletBalance,
    recalculateBalances,
    refetch 
  } = useWallets()
  
  const [showForm, setShowForm] = useState(false)
  const [editingWallet, setEditingWallet] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [recalculating, setRecalculating] = useState(false)
  const [expandedSections, setExpandedSections] = useState({})

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

  // Initialize all sections as expanded, preserving user's toggle state for existing sections
  useEffect(() => {
    const initialState = {}
    Object.keys(groupedWallets).forEach(type => {
      initialState[type] = true
    })
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExpandedSections(prev => {
      const next = { ...initialState }
      Object.keys(prev).forEach(key => {
        if (key in next) next[key] = prev[key]
      })
      return next
    })
  }, [groupedWallets])

  const toggleSection = (type) => {
    setExpandedSections(prev => ({
      ...prev,
      [type]: !prev[type]
    }))
  }

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

  const handleRecalculate = async () => {
    setRecalculating(true)
    const result = await recalculateBalances()
    setRecalculating(false)
    
    if (result.success) {
      alert(`✅ Đã tính lại số dư tất cả ví thành công!${result.updatedCount > 0 ? ` (${result.updatedCount} ví được cập nhật)` : ' (Tất cả số dư đã đúng)'}`)
    } else {
      alert('❌ Lỗi: ' + result.error)
    }
  }

  if (loading) {
    return <Loading message="Đang tải ví..." />
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={refetch} />
  }

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <PageHeader 
        title="Cấu hình ví" 
        action={
          <div className="flex gap-2">
            <button 
              onClick={handleRecalculate} 
              disabled={recalculating}
              className="btn bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
            >
              {recalculating ? (
                <>
                  <svg className="w-5 h-5 mr-2 inline animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang tính...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Tính lại số dư
                </>
              )}
            </button>
            <button onClick={handleCreate} className="btn btn-primary">
              <svg className="w-5 h-5 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Thêm ví
            </button>
          </div>
        }
      />


      {/* Grouped Wallets with Collapsible Sections */}
      {Object.keys(groupedWallets).length === 0 ? (
        <div className="card text-center py-12">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <p className="text-gray-500 font-medium mb-2">Chưa có ví nào</p>
          <p className="text-gray-400 text-sm">Tạo ví đầu tiên của bạn!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedWallets)
            .filter(([, walletList]) => walletList.length > 0)
            .map(([type, walletList]) => {
              const typeInfo = getWalletTypeInfo(type)
              const isExpanded = expandedSections[type]
              const colorMap = {
                'bg-blue-100 text-blue-700': 'from-blue-500 to-blue-600',
                'bg-green-100 text-green-700': 'from-green-500 to-green-600',
                'bg-purple-100 text-purple-700': 'from-purple-500 to-purple-600',
                'bg-pink-100 text-pink-700': 'from-pink-500 to-pink-600',
                'bg-indigo-100 text-indigo-700': 'from-indigo-500 to-indigo-600',
                'bg-amber-100 text-amber-700': 'from-amber-500 to-amber-600',
                'bg-gray-100 text-gray-700': 'from-gray-500 to-gray-600',
              }
              const gradient = colorMap[typeInfo.color] || 'from-gray-500 to-gray-600'

              return (
                <div key={type} className="rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  {/* Section Header */}
                  <button
                    onClick={() => toggleSection(type)}
                    className={`w-full flex items-center justify-between px-4 py-4 bg-gradient-to-r ${gradient} text-white hover:brightness-105 transition-all duration-200`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{typeInfo.icon}</span>
                      <span className="font-semibold text-base uppercase tracking-wide">{typeInfo.label}</span>
                      <span className="bg-white/25 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                        {walletList.length}
                      </span>
                    </div>
                    <svg
                      className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Section Content */}
                  {isExpanded && (
                    <div className="p-4 bg-white animate-slideIn">
                      <WalletList
                        wallets={walletList}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onResetBalance={handleResetBalance}
                      />
                    </div>
                  )}
                </div>
              )
            })}
        </div>
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