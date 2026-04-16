import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useWallets } from '../../hooks/finance/useWallets'
import { useWalletHistory } from '../../hooks/finance/useWalletHistory'
import { useCategories } from '../../hooks/finance/useCategories'
import WalletHistoryTable from '../../components/wallets/WalletHistoryTable'
import PageHeader from '../../components/layout/PageHeader'
import Loading from '../../components/common/Loading'
import { formatNumber } from '../../utils'

export default function WalletHistory() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const walletId = searchParams.get('wallet') || ''

  const { wallets, loading: walletsLoading } = useWallets()
  const { categories } = useCategories()

  const [filters, setFilters] = useState({
    type: searchParams.get('type') || 'all',
    category_id: searchParams.get('category') || '',
    date_from: searchParams.get('from') || '',
    date_to: searchParams.get('to') || ''
  })

  const { transactions, wallet, stats, loading, error } = useWalletHistory(walletId, filters)

  const handleWalletChange = (newWalletId) => {
    setSearchParams({ wallet: newWalletId })
  }

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    
    // Update URL params
    const params = { wallet: walletId }
    if (newFilters.type && newFilters.type !== 'all') params.type = newFilters.type
    if (newFilters.category_id) params.category = newFilters.category_id
    if (newFilters.date_from) params.from = newFilters.date_from
    if (newFilters.date_to) params.to = newFilters.date_to
    setSearchParams(params)
  }

  const handleExport = () => {
    if (!transactions || transactions.length === 0) {
      alert('Không có dữ liệu để export')
      return
    }

    // Create CSV content
    const headers = ['Ngày', 'Giờ', 'Loại', 'Mô tả', 'Danh mục', 'Số dư trước', 'Thay đổi', 'Số dư sau']
    const rows = transactions.map(txn => [
      txn.date,
      txn.time || '00:00:00',
      txn.type,
      txn.description || '',
      txn.categories?.name || '',
      txn.balance_before,
      txn.balance_change,
      txn.balance_after
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Download
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `wallet_history_${wallet?.name}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  if (walletsLoading) {
    return <Loading message="Đang tải..." />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lịch sử giao dịch"
        subtitle="Theo dõi chi tiết các giao dịch theo từng ví"
        action={
          <button onClick={() => navigate('/wallets')} className="btn btn-secondary">
            ← Quay lại
          </button>
        }
      />

      {/* Wallet selector */}
      <div className="card">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Chọn ví
        </label>
        <select
          value={walletId}
          onChange={(e) => handleWalletChange(e.target.value)}
          className="input max-w-md"
        >
          <option value="">-- Chọn ví --</option>
          {wallets.map(w => (
            <option key={w.id} value={w.id}>
              {w.name} ({formatNumber(w.current_amount)} {w.currency})
            </option>
          ))}
        </select>
      </div>

      {walletId && wallet && (
        <>
          {/* Statistics cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card">
              <div className="text-sm text-gray-600 mb-1">Số dư hiện tại</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatNumber(wallet.current_amount)} {wallet.currency}
              </div>
            </div>

            <div className="card">
              <div className="text-sm text-gray-600 mb-1">Tổng tiền vào</div>
              <div className="text-2xl font-bold text-green-600">
                +{formatNumber(stats.totalInflow)} {wallet.currency}
              </div>
            </div>

            <div className="card">
              <div className="text-sm text-gray-600 mb-1">Tổng tiền ra</div>
              <div className="text-2xl font-bold text-red-600">
                -{formatNumber(stats.totalOutflow)} {wallet.currency}
              </div>
            </div>

            <div className="card">
              <div className="text-sm text-gray-600 mb-1">Biến động ròng</div>
              <div className={`text-2xl font-bold ${
                stats.netChange >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {stats.netChange >= 0 ? '+' : ''}{formatNumber(stats.netChange)} {wallet.currency}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Type filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại giao dịch
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="input"
                >
                  <option value="all">Tất cả</option>
                  <option value="income">Thu nhập</option>
                  <option value="expense">Chi tiêu</option>
                  <option value="transfer">Chuyển khoản</option>
                </select>
              </div>

              {/* Category filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Danh mục
                </label>
                <select
                  value={filters.category_id}
                  onChange={(e) => handleFilterChange('category_id', e.target.value)}
                  className="input"
                >
                  <option value="">Tất cả</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date from */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Từ ngày
                </label>
                <input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                  className="input"
                />
              </div>

              {/* Date to */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Đến ngày
                </label>
                <input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Transaction table */}
          {loading ? (
            <Loading message="Đang tải lịch sử..." />
          ) : error ? (
            <div className="card text-center py-8 text-red-600">
              Lỗi: {error}
            </div>
          ) : (
            <WalletHistoryTable
              transactions={transactions}
              wallet={wallet}
              onExport={handleExport}
            />
          )}
        </>
      )}
    </div>
  )
}