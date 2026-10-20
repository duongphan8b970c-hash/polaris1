import { useState, useEffect } from 'react'
import { useWallets } from '../../hooks/finance/useWallets'
import { useCategories } from '../../hooks/finance/useCategories'
import { usePaybackGoals } from '../../hooks/finance/usePaybackGoals'
import { supabase } from '../../lib/supabase'
import { getWalletTypeInfo } from '../../constants'
import ReceiptScanner from './ReceiptScanner'

// Số tiền hiển thị = số tiền thực / hệ số. Tự động theo tiền tệ của ví:
// ví VND -> nhập theo đơn vị nghìn (gõ 50 = 50.000 ₫), tiền tệ khác -> nhập chính xác.
const computeMultiplier = (currency) => (currency === 'VND' ? 1000 : 1)

// Chuyển số tiền thực (đã lưu) sang chuỗi hiển thị theo hệ số hiện tại.
const actualToRaw = (actual, multiplier) => {
  if (actual === '' || actual == null || isNaN(parseFloat(actual))) return ''
  const value = parseFloat(actual) / multiplier
  // Bỏ số 0 thừa sau dấu thập phân (50.0 -> 50)
  return String(parseFloat(value.toFixed(6)))
}

// Mô tả gần nhất (không trùng) từ danh sách giao dịch đã sắp xếp mới -> cũ.
const getRecentDescriptions = (rows, limit = 10) => {
  const unique = []
  for (const row of rows) {
    const desc = (row.description || '').trim()
    if (desc && !unique.includes(desc)) unique.push(desc)
    if (unique.length >= limit) break
  }
  return unique
}

// Số tiền gần nhất (không trùng), chỉ lấy giao dịch cùng tiền tệ với ví đang chọn.
const getRecentAmounts = (rows, wallets, currency, limit = 5) => {
  const unique = []
  for (const row of rows) {
    const amount = Math.abs(parseFloat(row.amount))
    if (!amount || unique.includes(amount)) continue
    const rowCurrency = wallets.find(w => w.id === row.wallet_id)?.currency || 'VND'
    if (rowCurrency === currency) unique.push(amount)
    if (unique.length >= limit) break
  }
  return unique
}

// Danh sách ví dạng card bấm chọn (giống danh mục) để thao tác nhanh trên mobile.
function WalletPicker({ wallets, value, onSelect, emptyText = 'Chưa có ví nào.' }) {
  if (wallets.length === 0) {
    return <p className="text-sm text-gray-400 py-2">{emptyText}</p>
  }
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {wallets.map(wallet => {
        const active = value === wallet.id
        return (
          <button
            key={wallet.id}
            type="button"
            onClick={() => onSelect(wallet.id)}
            className={`flex items-center gap-2 py-2 px-2.5 rounded-lg border-2 text-left transition-all min-w-0 ${
              active
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-transparent bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={`${wallet.name} (${wallet.currency})`}
          >
            <span className="text-xl leading-none shrink-0">{getWalletTypeInfo(wallet.type || 'other')?.icon || '💼'}</span>
            <span className="min-w-0">
              <span className="block text-xs font-medium leading-tight truncate">{wallet.name}</span>
              <span className={`block text-[11px] leading-tight truncate ${active ? 'text-blue-600' : 'text-gray-400'}`}>
                {(wallet.current_amount || 0).toLocaleString('vi-VN')} {wallet.currency}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

// variant="page": dùng cho trang thêm giao dịch riêng (thanh nút cố định ở đáy màn hình).
export default function TransactionForm({ transaction, onSubmit, onCancel, loading, variant = 'modal' }) {
  const { wallets } = useWallets()
  const { goals: paybackGoals } = usePaybackGoals()
  const isEditingTransfer = transaction && transaction.type === 'transfer'

  const [formData, setFormData] = useState({
    type: transaction?.type || 'expense',
    wallet_id: transaction?.wallet_id || '',
    to_wallet_id: transaction?.to_wallet_id || '',
    category_id: transaction?.category_id || '',
    amount: transaction?.amount ? Math.abs(transaction.amount) : '', // luôn là số tiền THỰC
    fee: transaction?.fee || '', // luôn là số tiền THỰC
    description: transaction?.description || '',
    payback_goal_id: transaction?.payback_goal_id || '',
    date: transaction?.date ? transaction.date.split('T')[0] : new Date().toISOString().split('T')[0],
    time: transaction?.time || new Date().toTimeString().slice(0, 5)
  })

  const transactionType = formData.type
  const { categories } = useCategories(transactionType === 'transfer' ? 'expense' : transactionType)

  const selectedCategory = categories.find(c => c.id === formData.category_id)
  const isPaybackCategory = selectedCategory?.name === 'Payback' && formData.type === 'expense'

  // ===== Số tiền theo đơn vị nghìn (VND) =====
  // Tiền tệ được lấy từ ví nguồn (áp dụng cho cả giao dịch thường lẫn chuyển khoản).
  const selectedWallet = wallets.find(w => w.id === formData.wallet_id)
  const walletCurrency = selectedWallet?.currency || transaction?.currency || 'VND'
  const isVND = walletCurrency === 'VND'
  const multiplier = computeMultiplier(walletCurrency)

  // Chuỗi hiển thị của ô nhập (giữ đúng những gì người dùng gõ, tránh nhảy số).
  const [amountRaw, setAmountRaw] = useState(() =>
    actualToRaw(transaction?.amount ? Math.abs(transaction.amount) : '', computeMultiplier(transaction?.currency || 'VND'))
  )
  const [feeRaw, setFeeRaw] = useState(() =>
    actualToRaw(transaction?.fee || '', computeMultiplier(transaction?.currency || 'VND'))
  )

  // Đồng bộ lại chuỗi hiển thị khi hệ số thay đổi (đổi ví VND↔tiền tệ khác).
  const syncRawToMultiplier = (newMultiplier) => {
    setAmountRaw(actualToRaw(formData.amount, newMultiplier))
    setFeeRaw(actualToRaw(formData.fee, newMultiplier))
  }

  const handleAmountChange = (field, rawValue) => {
    if (field === 'amount') setAmountRaw(rawValue)
    else setFeeRaw(rawValue)
    const actual = rawValue === '' ? '' : String(parseFloat(rawValue) * multiplier)
    setFormData(prev => ({ ...prev, [field]: actual }))
  }

  // ===== Gợi ý mô tả & số tiền gần nhất theo cùng danh mục =====
  const [recentTxns, setRecentTxns] = useState([])

  useEffect(() => {
    let cancelled = false
    const catId = formData.category_id
    const fetchRecent = async () => {
      if (!catId || formData.type === 'transfer') {
        if (!cancelled) setRecentTxns([])
        return
      }
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('description, amount, wallet_id, date, time')
        .eq('category_id', catId)
        .is('deleted_at', null)
        .order('date', { ascending: false })
        .order('time', { ascending: false })
        .limit(50)
      if (error || cancelled) return
      setRecentTxns(data || [])
    }
    fetchRecent()
    return () => { cancelled = true }
  }, [formData.category_id, formData.type])

  const recentDescriptions = getRecentDescriptions(recentTxns)
  const recentAmounts = getRecentAmounts(recentTxns, wallets, walletCurrency)

  const handlePickAmount = (actual) => {
    setAmountRaw(actualToRaw(actual, multiplier))
    setFormData(prev => ({ ...prev, amount: String(actual) }))
  }

  // ===== Điền sẵn từ ảnh hóa đơn =====
  const [scanInfo, setScanInfo] = useState(null)

  const handleReceiptResult = (result) => {
    const categoryValid = categories.some(c => c.id === result.category_id)
    setFormData(prev => ({
      ...prev,
      amount: result.amount ? String(result.amount) : prev.amount,
      description: result.description || prev.description,
      date: result.date || prev.date,
      time: result.time || prev.time,
      category_id: categoryValid ? result.category_id : prev.category_id,
    }))
    if (result.amount) setAmountRaw(actualToRaw(result.amount, multiplier))
    setScanInfo(result)
  }

  const selectWallet = (name, value) => handleChange({ target: { name, value } })

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'wallet_id') {
      // Đổi ví có thể đổi tiền tệ -> đồng bộ lại chuỗi hiển thị theo hệ số mới.
      const nextWallet = wallets.find(w => w.id === value)
      const nextCurrency = nextWallet?.currency || 'VND'
      const newMultiplier = computeMultiplier(nextCurrency)
      setFormData(prev => ({ ...prev, wallet_id: value }))
      syncRawToMultiplier(newMultiplier)
      return
    }
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!formData.wallet_id) {
      alert('Vui lòng chọn ví')
      return
    }

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
      if (!formData.category_id) {
        alert('Vui lòng chọn danh mục')
        return
      }
    }

    if (isPaybackCategory && !formData.payback_goal_id) {
      const confirmWithoutGoal = confirm(
        'Bạn chưa chọn mục tiêu.\n\n' +
        'Giao dịch này sẽ không được tính vào bất kỳ mục tiêu nào.\n\n' +
        'Bạn có muốn tiếp tục không?'
      )
      if (!confirmWithoutGoal) return
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Vui lòng nhập số tiền hợp lệ')
      return
    }

    // ✅ Validate fee
    const fee = parseFloat(formData.fee || 0)
    if (fee < 0) {
      alert('Phí không thể âm')
      return
    }

    const submitData = {
      ...formData,
      amount: formData.type === 'expense'
        ? -Math.abs(parseFloat(formData.amount))
        : Math.abs(parseFloat(formData.amount)),
      fee: fee // ✅ ADD: Include fee
    }

    if (formData.type === 'transfer') {
      delete submitData.category_id
      delete submitData.payback_goal_id
    } else {
      delete submitData.to_wallet_id
      delete submitData.fee // ✅ Fee only for transfers

      if (!isPaybackCategory) {
        delete submitData.payback_goal_id
      }
    }

    onSubmit(submitData)
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
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
        >
          Đóng
        </button>
      </div>
    )
  }

  // Helper hiển thị số tiền thực đã quy đổi bên dưới ô nhập.
  const renderResolvedHint = (rawValue) => {
    if (!isVND || multiplier === 1 || !rawValue) return null
    const actual = parseFloat(rawValue) * multiplier
    if (isNaN(actual)) return null
    return (
      <p className="mt-1 text-xs text-blue-600 font-medium">
        = {actual.toLocaleString('vi-VN')} ₫
      </p>
    )
  }

  // Nhãn cho biết đang nhập theo đơn vị nghìn (tự động khi ví là VND).
  const renderThousandsBadge = () => {
    if (!isVND) return null
    return (
      <span
        className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-300"
        title="Ví VND: nhập theo đơn vị nghìn (gõ 50 = 50.000 ₫)"
      >
        đơn vị: nghìn
      </span>
    )
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
            onClick={() => setFormData(prev => ({ ...prev, type: 'income', to_wallet_id: '', category_id: '', payback_goal_id: '', fee: '' }))}
            className={`px-4 py-3 rounded-lg font-medium transition-all ${
              formData.type === 'income'
                ? 'bg-green-100 text-green-700 border-2 border-green-500'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
            }`}
            disabled={transaction}
          >
            <svg className="w-5 h-5 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Thu nhập
          </button>

          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, type: 'expense', to_wallet_id: '', category_id: '', payback_goal_id: '', fee: '' }))}
            className={`px-4 py-3 rounded-lg font-medium transition-all ${
              formData.type === 'expense'
                ? 'bg-red-100 text-red-700 border-2 border-red-500'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
            }`}
            disabled={transaction}
          >
            <svg className="w-5 h-5 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
            Chi tiêu
          </button>

          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, type: 'transfer', category_id: '', payback_goal_id: '' }))}
            className={`px-4 py-3 rounded-lg font-medium transition-all ${
              formData.type === 'transfer'
                ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
            }`}
            disabled={transaction}
          >
            <svg className="w-5 h-5 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Chuyển khoản
          </button>
        </div>
      </div>

      {/* Quét hóa đơn để điền sẵn (chỉ khi thêm mới thu/chi) */}
      {!transaction && formData.type !== 'transfer' && (
        <div>
          <ReceiptScanner categories={categories} onResult={handleReceiptResult} disabled={loading} />
          {scanInfo && (
            <div className="mt-2 text-xs rounded-lg bg-green-50 border border-green-200 text-green-800 px-3 py-2">
              ✅ Đã điền từ ảnh{scanInfo.merchant ? ` "${scanInfo.merchant}"` : ''}
              {scanInfo.amount ? `: ${scanInfo.amount.toLocaleString('vi-VN')} ${scanInfo.currency}` : ''}.
              {' '}Kiểm tra lại {formData.wallet_id ? '' : 'ví, '}danh mục và số tiền trước khi lưu.
              {formData.wallet_id && scanInfo.currency !== walletCurrency && (
                <span className="block mt-1 text-amber-700">
                  ⚠️ Hóa đơn dùng {scanInfo.currency} nhưng ví đang chọn là {walletCurrency}.
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* CONDITIONAL LAYOUT: Transfer vs Regular Transaction */}
      {formData.type === 'transfer' ? (
        <>
          {/* TRANSFER LAYOUT */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Từ ví <span className="text-red-500">*</span>
            </label>
            <WalletPicker
              wallets={wallets}
              value={formData.wallet_id}
              onSelect={(id) => selectWallet('wallet_id', id)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Đến ví <span className="text-red-500">*</span>
            </label>
            <WalletPicker
              wallets={wallets.filter(w => w.id !== formData.wallet_id)}
              value={formData.to_wallet_id}
              onSelect={(id) => selectWallet('to_wallet_id', id)}
              emptyText="Không có ví đích khả dụng."
            />
          </div>

          {/* ✅ NEW: Amount + Fee row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Amount */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Số tiền chuyển <span className="text-red-500">*</span>
                </label>
                {renderThousandsBadge()}
              </div>
              <input
                type="number"
                inputMode="decimal"
                name="amount"
                value={amountRaw}
                onChange={(e) => handleAmountChange('amount', e.target.value)}
                step={multiplier === 1 ? '0.01' : 'any'}
                min="0"
                placeholder={multiplier === 1 ? '0.00' : 'VD: 50 = 50.000'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              {renderResolvedHint(amountRaw)}
              <p className="mt-1 text-xs text-gray-500">
                💰 Số tiền người nhận sẽ nhận được
              </p>
            </div>

            {/* ✅ Fee */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phí giao dịch (không bắt buộc)
              </label>
              <input
                type="number"
                inputMode="decimal"
                name="fee"
                value={feeRaw}
                onChange={(e) => handleAmountChange('fee', e.target.value)}
                step={multiplier === 1 ? '0.01' : 'any'}
                min="0"
                placeholder={multiplier === 1 ? '0.00' : 'VD: 5 = 5.000'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              {renderResolvedHint(feeRaw)}
              <p className="mt-1 text-xs text-gray-500">
                💸 Phí sẽ bị trừ từ ví nguồn
              </p>
            </div>
          </div>

          {/* Transfer Summary Card */}
          {formData.wallet_id && formData.to_wallet_id && formData.amount && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm">
                  <p className="text-gray-600 mb-1">Từ:</p>
                  <p className="font-semibold text-gray-900">
                    {wallets.find(w => w.id === formData.wallet_id)?.name}
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    -{parseFloat(formData.amount).toLocaleString('vi-VN')}
                    {formData.fee && parseFloat(formData.fee) > 0 && (
                      <span className="text-orange-600">
                        {' '}- {parseFloat(formData.fee).toLocaleString('vi-VN')} (phí)
                      </span>
                    )}
                    {' '}{wallets.find(w => w.id === formData.wallet_id)?.currency}
                  </p>
                  {formData.fee && parseFloat(formData.fee) > 0 && (
                    <p className="text-xs font-semibold text-red-700 mt-1">
                      Tổng trừ: -{(parseFloat(formData.amount) + parseFloat(formData.fee)).toLocaleString('vi-VN')}
                      {' '}{wallets.find(w => w.id === formData.wallet_id)?.currency}
                    </p>
                  )}
                </div>

                <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>

                <div className="text-sm text-right">
                  <p className="text-gray-600 mb-1">Đến:</p>
                  <p className="font-semibold text-gray-900">
                    {wallets.find(w => w.id === formData.to_wallet_id)?.name}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ví <span className="text-red-500">*</span>
            </label>
            <WalletPicker
              wallets={wallets}
              value={formData.wallet_id}
              onSelect={(id) => selectWallet('wallet_id', id)}
            />
          </div>

          {/* Danh mục dạng icon bấm chọn */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Danh mục <span className="text-red-500">*</span>
            </label>
            {categories.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">Chưa có danh mục nào.</p>
            ) : (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                {categories.map(category => {
                  const active = formData.category_id === category.id
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, category_id: category.id }))}
                      className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg border-2 transition-all ${
                        active
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-transparent bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={category.name}
                    >
                      <span className="text-2xl leading-none">{category.icon || '📁'}</span>
                      <span className="text-[11px] leading-tight text-center line-clamp-2">
                        {category.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Amount for regular transactions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Số tiền <span className="text-red-500">*</span>
              </label>
              {renderThousandsBadge()}
            </div>
            <input
              type="number"
              inputMode="decimal"
              name="amount"
              value={amountRaw}
              onChange={(e) => handleAmountChange('amount', e.target.value)}
              step={multiplier === 1 ? '0.01' : 'any'}
              min="0"
              placeholder={multiplier === 1 ? '0.00' : 'VD: 50 = 50.000'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            {renderResolvedHint(amountRaw)}

            {/* Gợi ý 5 số tiền gần nhất của cùng danh mục */}
            {recentAmounts.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {recentAmounts.map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handlePickAmount(amt)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      parseFloat(formData.amount) === amt
                        ? 'bg-blue-100 text-blue-700 border-blue-300'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {amt.toLocaleString('vi-VN')} {isVND ? '₫' : walletCurrency}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ✅ Payback Goal Selector */}
      {isPaybackCategory && (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            💳 Mục tiêu
          </label>
          <select
            name="payback_goal_id"
            value={formData.payback_goal_id}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            disabled={loading}
          >
            <option value="">-- Không gán vào mục tiêu --</option>
            {paybackGoals
              .filter(g => g.status === 'active')
              .map(goal => (
                <option key={goal.id} value={goal.id}>
                  {goal.name} - {goal.progress.toFixed(0)}%
                  (Còn {goal.remaining.toLocaleString('vi-VN')} ₫)
                </option>
              ))}
          </select>

          {paybackGoals.filter(g => g.status === 'active').length === 0 ? (
            <p className="text-xs text-amber-600 mt-2">
              ⚠️ Chưa có mục tiêu nào. Tạo mục tiêu trước để theo dõi tiến độ.
            </p>
          ) : (
            <p className="text-xs text-gray-600 mt-2">
              💡 Chọn mục tiêu để giao dịch này được tính vào tiến độ
            </p>
          )}
        </div>
      )}

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mô tả
        </label>

        {/* Gợi ý 5 mô tả gần nhất của cùng danh mục */}
        {recentDescriptions.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {recentDescriptions.map((desc, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, description: desc }))}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors max-w-[220px] truncate ${
                  formData.description === desc
                    ? 'bg-blue-100 text-blue-700 border-blue-300'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
                title={desc}
              >
                {desc}
              </button>
            ))}
          </div>
        )}

        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
          placeholder={
            formData.type === 'transfer'
              ? 'Ghi chú chuyển khoản...'
              : 'Chọn gợi ý phía trên hoặc nhập ghi chú...'
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ngày <span className="text-red-500">*</span>
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Thời gian <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            name="time"
            value={formData.time}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className={variant === 'page'
        ? 'sticky bottom-0 -mx-4 -mb-4 px-4 pt-3 bg-white border-t border-gray-200 rounded-b-xl flex gap-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]'
        : 'flex gap-3 pt-4'}>
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
          {loading ? 'Đang xử lý...' : (transaction ? 'Cập nhật' : 'Thêm mới')}
        </button>
      </div>

    </form>
  )
}
