import { formatDate } from '../../lib/utils'
import { useState, useEffect } from 'react'
import { useWallets } from '../../hooks/useWallets'
import { useCategories } from '../../hooks/useCategories'

export default function TransactionForm({ transaction, onSubmit, onCancel, loading }) {
  const { wallets } = useWallets()
  const isEditingTransfer = transaction && transaction.type === 'transfer'
  
  const [formData, setFormData] = useState({
    type: transaction?.type || 'expense',
    wallet_id: transaction?.wallet_id || '',
    to_wallet_id: transaction?.to_wallet_id || '', // ✅ NEW: For transfers
    category_id: transaction?.category_id || '',
    amount: transaction?.amount || '',
    description: transaction?.description || '',
    date: transaction?.date ? transaction.date.split('T')[0] : new Date().toISOString().split('T')[0]
  })

  const [transactionType, setTransactionType] = useState(transaction?.type || 'expense')
  const { categories } = useCategories(transactionType === 'transfer' ? 'expense' : transactionType)

  useEffect(() => {
    setTransactionType(formData.type)
  }, [formData.type])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.wallet_id) {
      alert('Vui lòng chọn ví')
      return
    }

    if (isEditingTransfer) {
    return (
      <div className="text-center py-8">
        <svg className="w-16 h-16 mx-auto mb-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-gray-700 font-medium mb-2">Không thể sửa giao dịch chuyển khoản</p>
        <p className="text-gray-500 text-sm mb-4">
          Giao dịch chuyển khoản tạo 2 bản ghi liên kết. <br />
          Vui lòng xóa và tạo lại nếu cần thay đổi.
        </p>
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="text-gray-600">Từ:</p>
              <p className="font-semibold">{transaction.wallets?.name}</p>
            </div>
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <div>
              <p className="text-gray-600">Đến:</p>
              <p className="font-semibold">{transaction.to_wallet?.name}</p>
            </div>
          </div>
          <div className="mt-2 text-center">
            <p className="text-lg font-bold text-red-600">
              {Math.abs(transaction.amount).toLocaleString('vi-VN')} VND
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
        >
          Đóng
        </button>
      </div>
    )}
    // ✅ Transfer validation
    if (formData.type === 'transfer') {
      if (!formData.to_wallet_id) {
        alert('Vui lòng chọn ví đích')
        return
      }
      if (formData.wallet_id === formData.to_wallet_id) {
        alert('Không thể chuyển vào cùng một ví')
        return
      }
    } else {
      // Regular transaction validation
      if (!formData.category_id) {
        alert('Vui lòng chọn danh mục')
        return
      }
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Vui lòng nhập số tiền hợp lệ')
      return
    }

    // Prepare data
    const submitData = {
      ...formData,
      amount: parseFloat(formData.amount)
    }

    // ✅ For transfers, remove category_id
    if (formData.type === 'transfer') {
      delete submitData.category_id
    } else {
      delete submitData.to_wallet_id
    }

    onSubmit(submitData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      
      {/* Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Loại giao dịch <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, type: 'income', to_wallet_id: '', category_id: '' }))}
            className={`px-4 py-3 rounded-lg font-medium transition-all ${
              formData.type === 'income'
                ? 'bg-green-100 text-green-700 border-2 border-green-500'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
            }`}
          >
            <svg className="w-5 h-5 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Thu nhập
          </button>

          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, type: 'expense', to_wallet_id: '', category_id: '' }))}
            className={`px-4 py-3 rounded-lg font-medium transition-all ${
              formData.type === 'expense'
                ? 'bg-red-100 text-red-700 border-2 border-red-500'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
            }`}
          >
            <svg className="w-5 h-5 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
            Chi tiêu
          </button>

          {/* ✅ NEW: Transfer Button */}
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, type: 'transfer', category_id: '' }))}
            className={`px-4 py-3 rounded-lg font-medium transition-all ${
              formData.type === 'transfer'
                ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
            }`}
          >
            <svg className="w-5 h-5 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Chuyển khoản
          </button>
        </div>
      </div>

      {/* ✅ CONDITIONAL LAYOUT: Transfer vs Regular Transaction */}
      {formData.type === 'transfer' ? (
        <>
          {/* TRANSFER LAYOUT */}
          <div className="grid grid-cols-2 gap-4">
            {/* From Wallet */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Từ ví <span className="text-red-500">*</span>
              </label>
              <select
                name="wallet_id"
                value={formData.wallet_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Chọn ví nguồn</option>
                {wallets.map(wallet => (
                  <option key={wallet.id} value={wallet.id}>
                    {wallet.name} ({wallet.currency})
                  </option>
                ))}
              </select>
              {/* ✅ Show selected wallet balance */}
        {formData.wallet_id && (
          <p className="mt-1 text-xs text-gray-500">
            Số dư: <span className="font-semibold text-gray-700">
              {wallets.find(w => w.id === formData.wallet_id)?.current_amount?.toLocaleString('vi-VN') || '0'} 
              {' '}{wallets.find(w => w.id === formData.wallet_id)?.currency}
            </span>
          </p>
        )}
            </div>

            {/* To Wallet */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Đến ví <span className="text-red-500">*</span>
              </label>
              <select
                name="to_wallet_id"
                value={formData.to_wallet_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Chọn ví đích</option>
                {wallets
                  .filter(w => w.id !== formData.wallet_id)
                  .map(wallet => (
                    <option key={wallet.id} value={wallet.id}>
                      {wallet.name} ({wallet.currency})
                    </option>
                  ))}
              </select>
              {/* ✅ Show selected wallet balance */}
        {formData.to_wallet_id && (
          <p className="mt-1 text-xs text-gray-500">
            Số dư: <span className="font-semibold text-gray-700">
              {wallets.find(w => w.id === formData.to_wallet_id)?.current_amount?.toLocaleString('vi-VN') || '0'}
              {' '}{wallets.find(w => w.id === formData.to_wallet_id)?.currency}
            </span>
          </p>
        )}
            </div>
          </div>
          {/* ✅ Transfer Summary Card */}
    {formData.wallet_id && formData.to_wallet_id && formData.amount && (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm">
            <p className="text-gray-600">Từ:</p>
            <p className="font-semibold text-gray-900">
              {wallets.find(w => w.id === formData.wallet_id)?.name}
            </p>
            <p className="text-xs text-red-600">
              -{parseFloat(formData.amount).toLocaleString('vi-VN')} {wallets.find(w => w.id === formData.wallet_id)?.currency}
            </p>
          </div>
          
          <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          
          <div className="text-sm text-right">
            <p className="text-gray-600">Đến:</p>
            <p className="font-semibold text-gray-900">
              {wallets.find(w => w.id === formData.to_wallet_id)?.name}
            </p>
            <p className="text-xs text-green-600">
              +{parseFloat(formData.amount).toLocaleString('vi-VN')} {wallets.find(w => w.id === formData.to_wallet_id)?.currency}
            </p>
          </div>
        </div>
      </div>
    )}
        </>
      ) : (
        <>
          {/* REGULAR TRANSACTION LAYOUT */}
          {/* Wallet Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ví <span className="text-red-500">*</span>
            </label>
            <select
              name="wallet_id"
              value={formData.wallet_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Chọn ví</option>
              {wallets.map(wallet => (
                <option key={wallet.id} value={wallet.id}>
                  {wallet.name} ({wallet.currency})
                </option>
              ))}
            </select>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Danh mục <span className="text-red-500">*</span>
            </label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Chọn danh mục</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Số tiền <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          step="0.01"
          min="0"
          placeholder="0.00"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mô tả
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
          placeholder={
            formData.type === 'transfer' 
              ? 'Ghi chú chuyển khoản...' 
              : 'Ghi chú giao dịch...'
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ngày giao dịch <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          disabled={loading}
        >
          Hủy
        </button>
        <button
          type="submit"
          className={`flex-1 px-4 py-2 rounded-lg font-medium text-white transition-colors ${
            formData.type === 'income' ? 'bg-green-600 hover:bg-green-700' :
            formData.type === 'expense' ? 'bg-red-600 hover:bg-red-700' :
            'bg-blue-600 hover:bg-blue-700'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang xử lý...
            </span>
          ) : (
            transaction ? 'Cập nhật' : 'Thêm mới'
          )}
        </button>
      </div>

    </form>
  )
}