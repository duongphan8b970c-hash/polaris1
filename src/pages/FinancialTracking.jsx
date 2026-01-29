import { useState } from 'react'
import { useTransactions } from '../hooks/useTransactions'
import { useCategories } from '../hooks/useCategories'
import { useWallets } from '../hooks/useWallets'
import TransactionList from '../components/transactions/TransactionList'
import TransactionForm from '../components/transactions/TransactionForm'
import CategoryList from '../components/transactions/CategoryList'
import CategoryForm from '../components/transactions/CategoryForm'
import Modal from '../components/common/Modal'
import PageHeader from '../components/layout/PageHeader'
import Loading from '../components/common/Loading'
import ErrorMessage from '../components/common/ErrorMessage'

export default function FinancialTracking() {
  const [activeTab, setActiveTab] = useState('transactions')
  const [categoryType, setCategoryType] = useState('expense')
  
  // Filters state
  const [filters, setFilters] = useState({
    wallet_id: '',
    type: '',
    category_id: '',
    date_from: '',
    date_to: ''
  })
  const [filtersOpen, setFiltersOpen] = useState(false)
  
  const { wallets } = useWallets()
  const { transactions, loading: transactionsLoading, error: transactionsError, createTransaction, updateTransaction, deleteTransaction, refetch: refetchTransactions } = useTransactions(filters)
  const { categories, loading: categoriesLoading, error: categoriesError, createCategory, updateCategory, refetch: refetchCategories } = useCategories(categoryType)
  
  const [showTransactionForm, setShowTransactionForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [submittingTransaction, setSubmittingTransaction] = useState(false)
  
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [submittingCategory, setSubmittingCategory] = useState(false)

  // Filter handlers
  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleClearFilters = () => {
    setFilters({
      wallet_id: '',
      type: '',
      category_id: '',
      date_from: '',
      date_to: ''
    })
  }

  // Transaction handlers (existing)
  const handleCreateTransaction = () => {
    setEditingTransaction(null)
    setShowTransactionForm(true)
  }

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction)
    setShowTransactionForm(true)
  }

  const handleCloseTransactionForm = () => {
    setShowTransactionForm(false)
    setEditingTransaction(null)
  }

  const handleSubmitTransaction = async (formData) => {
    setSubmittingTransaction(true)
    
    const result = editingTransaction
      ? await updateTransaction(editingTransaction.id, formData)
      : await createTransaction(formData)
    
    setSubmittingTransaction(false)
    
    if (result.success) {
      handleCloseTransactionForm()
    } else {
      alert('Lỗi: ' + result.error)
    }
  }
  const handleDeleteTransaction = async (transaction) => {
  console.log('🗑️ Delete called with:', transaction) // ✅ ADD THIS
  
  if (!window.confirm(
    transaction.type === 'transfer' 
      ? 'Xóa giao dịch chuyển khoản này? Cả 2 bên chuyển/nhận sẽ bị xóa.'
      : 'Xác nhận xóa giao dịch này?'
  )) {
    return
  }

  console.log('✅ User confirmed, deleting...') // ✅ ADD THIS
  
  const result = await deleteTransaction(transaction.id, transaction)
  
  console.log('📊 Delete result:', result) // ✅ ADD THIS
  
  if (!result.success) {
    alert('Lỗi: ' + result.error)
  } else {
    console.log('✅ Delete successful!') // ✅ ADD THIS
  }
}

  // Category handlers (existing)
  const handleCreateCategory = () => {
    setEditingCategory(null)
    setShowCategoryForm(true)
  }

  const handleEditCategory = (category) => {
    setEditingCategory(category)
    setShowCategoryForm(true)
  }

  const handleCloseCategoryForm = () => {
    setShowCategoryForm(false)
    setEditingCategory(null)
  }

  const handleSubmitCategory = async (formData) => {
    setSubmittingCategory(true)
    
    const result = editingCategory
      ? await updateCategory(editingCategory.id, formData)
      : await createCategory(formData)
    
    setSubmittingCategory(false)
    
    if (result.success) {
      handleCloseCategoryForm()
    } else {
      alert('Lỗi: ' + result.error)
    }
  }

  const loading = activeTab === 'transactions' ? transactionsLoading : categoriesLoading
  const error = activeTab === 'transactions' ? transactionsError : categoriesError

  if (loading) {
    return <Loading message={activeTab === 'transactions' ? 'Đang tải giao dịch...' : 'Đang tải danh mục...'} />
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={activeTab === 'transactions' ? refetchTransactions : refetchCategories} />
  }

  // Get all categories for filter
  const allCategories = [...(categories || [])]

  return (
    <div>
      <PageHeader 
        title="Quản lý thu chi" 
        subtitle="Theo dõi các khoản thu nhập và chi tiêu"
      />

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('transactions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'transactions'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <svg className="w-5 h-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Giao dịch
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'categories'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <svg className="w-5 h-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Danh mục
            </button>
          </nav>
        </div>
      </div>

      {/* Transactions Tab Content */}
      {activeTab === 'transactions' && (
        <>
          {/* ✅ FILTERS + ADD BUTTON - SEPARATE CLICKABLE AREAS */}
    <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 overflow-hidden mb-6">
      
      {/* Filter Header Row */}
      <div className="flex items-stretch">
        {/* Left: Filter Toggle (clickable) */}
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="flex-1 px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <div>
              <h3 className="font-semibold text-gray-900">Bộ Lọc & Tìm Kiếm</h3>
              <p className="text-xs text-gray-500">
                {(filters.wallet_id || filters.type || filters.category_id || filters.date_from || filters.date_to) ? (
                  <>
                    {filters.type && `${filters.type === 'income' ? 'Thu nhập' : filters.type === 'expense' ? 'Chi tiêu' : 'Chuyển khoản'} • `}
                    {filters.wallet_id && `${wallets.find(w => w.id === filters.wallet_id)?.name} • `}
                    {filters.category_id && `${allCategories.find(c => c.id === filters.category_id)?.name} • `}
                    {(filters.date_from || filters.date_to) && 'Lọc theo ngày'}
                  </>
                ) : (
                  'Nhấn để mở bộ lọc'
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {(filters.wallet_id || filters.type || filters.category_id || filters.date_from || filters.date_to) && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                {transactions.length} kết quả
              </span>
            )}
            
            <svg 
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${filtersOpen ? 'rotate-180' : ''}`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* Right: Add Button (separate, not nested in toggle button) */}
        <div className="flex items-center px-6 py-4 border-l border-gray-200 bg-gray-50">
          <button 
            onClick={handleCreateTransaction}
            type="button"
            className="btn btn-primary whitespace-nowrap flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Thêm giao dịch</span>
          </button>
        </div>
      </div>

      {/* Filter Content - Collapsible */}
      {filtersOpen && (
        <div className="px-6 pb-6 border-t border-gray-200 animate-slideIn">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-4">
            
            {/* Wallet Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ví</label>
              <select
                name="wallet_id"
                value={filters.wallet_id}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">Tất cả ví</option>
                {wallets.map(wallet => (
                  <option key={wallet.id} value={wallet.id}>
                    {wallet.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại</label>
              <select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">Tất cả</option>
                <option value="income">Thu nhập</option>
                <option value="expense">Chi tiêu</option>
                <option value="transfer">Chuyển khoản</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục</label>
              <select
                name="category_id"
                value={filters.category_id}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">Tất cả danh mục</option>
                {allCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Từ ngày</label>
              <input
                type="date"
                name="date_from"
                value={filters.date_from}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Đến ngày</label>
              <input
                type="date"
                name="date_to"
                value={filters.date_to}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            
          </div>

          {/* Clear Filters Button */}
          {(filters.wallet_id || filters.type || filters.category_id || filters.date_from || filters.date_to) && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleClearFilters}
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Xóa bộ lọc
              </button>
            </div>
          )}

        </div>
      )}
    </div>

    {/* Transaction List */}
    <TransactionList
      transactions={transactions}
      onEdit={handleEditTransaction}
      onDelete={handleDeleteTransaction}
    />

    {/* Transaction Form Modal */}
    <Modal
      isOpen={showTransactionForm}
      onClose={handleCloseTransactionForm}
      title={editingTransaction ? 'Sửa giao dịch' : 'Thêm giao dịch mới'}
    >
      <TransactionForm
        transaction={editingTransaction}
        onSubmit={handleSubmitTransaction}
        onCancel={handleCloseTransactionForm}
        loading={submittingTransaction}
      />
    </Modal>
  </>
)}

      {/* Categories Tab Content (unchanged) */}
      {activeTab === 'categories' && (
        <>
          <div className="mb-6 flex items-center justify-between">
            <div className="flex space-x-4">
              <button
                onClick={() => setCategoryType('expense')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  categoryType === 'expense'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Chi tiêu
              </button>
              <button
                onClick={() => setCategoryType('income')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  categoryType === 'income'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Thu nhập
              </button>
            </div>

            <button onClick={handleCreateCategory} className="btn btn-primary">
              <svg className="w-5 h-5 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Thêm danh mục
            </button>
          </div>

          <CategoryList
            categories={categories}
            onEdit={handleEditCategory}
          />

          <Modal
            isOpen={showCategoryForm}
            onClose={handleCloseCategoryForm}
            title={editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}
          >
            <CategoryForm
              category={editingCategory}
              defaultType={categoryType}
              onSubmit={handleSubmitCategory}
              onCancel={handleCloseCategoryForm}
              loading={submittingCategory}
            />
          </Modal>
        </>
      )}
    </div>
  )
}