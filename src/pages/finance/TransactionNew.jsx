import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTransactions } from '../../hooks/finance/useTransactions'
import { useBudgets } from '../../hooks/finance/useBudgets'
import { useNotifications } from '../../contexts/NotificationContext'
import TransactionForm from '../../components/transactions/TransactionForm'
import { checkBudgetAfterTransaction } from '../../utils/budgetAlert'

// Trang thêm giao dịch riêng, tối ưu cho mobile.
export default function TransactionNew() {
  const navigate = useNavigate()
  const { notifyBudgetExceeded, notifyBudgetWarning } = useNotifications()
  const { budgets } = useBudgets()

  // Trang này chỉ cần createTransaction -> giới hạn danh sách tải kèm về hôm nay cho nhẹ.
  const [filters] = useState(() => {
    const today = new Date().toISOString().split('T')[0]
    return { date_from: today, date_to: today }
  })
  const { createTransaction } = useTransactions(filters)
  const [submitting, setSubmitting] = useState(false)

  const goBack = () => navigate('/transactions')

  const handleSubmit = async (formData) => {
    setSubmitting(true)
    const result = await createTransaction(formData)
    setSubmitting(false)

    if (!result.success) {
      alert('Lỗi: ' + result.error)
      return
    }
    if (formData.type === 'expense') {
      await checkBudgetAfterTransaction(formData, budgets, { notifyBudgetExceeded, notifyBudgetWarning })
    }
    goBack()
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-3">
        <button
          type="button"
          onClick={goBack}
          className="p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100"
          aria-label="Quay lại"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Thêm giao dịch mới</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <TransactionForm
          variant="page"
          onSubmit={handleSubmit}
          onCancel={goBack}
          loading={submitting}
        />
      </div>
    </div>
  )
}
