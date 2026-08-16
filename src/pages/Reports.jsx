import { useTransactions } from '../hooks/finance/useTransactions'
import { useBudgets } from '../hooks/finance/useBudgets'
import FinanceReport from '../components/reports/FinanceReport'
import PageHeader from '../components/layout/PageHeader'
import Loading from '../components/common/Loading'
import ErrorMessage from '../components/common/ErrorMessage'

export default function Reports() {
  const { transactions, loading: transactionsLoading, error: transactionsError, refetch: refetchTransactions } = useTransactions()
  const { budgets, loading: budgetsLoading, error: budgetsError, refetch: refetchBudgets } = useBudgets()

  const loading = budgetsLoading || transactionsLoading

  const refreshReport = async () => {
    await Promise.all([refetchTransactions(), refetchBudgets()])
  }

  if (loading) {
    return <Loading message="Đang tải báo cáo..." />
  }

  if (transactionsError || budgetsError) {
    return <ErrorMessage message={transactionsError || budgetsError} onRetry={refreshReport} />
  }

  return (
    <div>
      <PageHeader title="📊 Báo cáo tài chính"/>
      <FinanceReport transactions={transactions} budgets={budgets} onRefresh={refreshReport} />
    </div>
  )
}
