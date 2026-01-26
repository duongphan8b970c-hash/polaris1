import { useWallets } from '../hooks/useWallets'
import { useTransactions } from '../hooks/useTransactions'
import { useTrades } from '../hooks/useTrades'
import MonthlyReport from '../components/reports/MonthlyReport'
import PageHeader from '../components/layout/PageHeader'
import Loading from '../components/common/Loading'

export default function Reports() {
  const { wallets, loading: walletsLoading } = useWallets()
  const { transactions, loading: transactionsLoading } = useTransactions()
  const { trades, loading: tradesLoading } = useTrades()

  const loading = walletsLoading || transactionsLoading || tradesLoading

  if (loading) {
    return <Loading message="Đang tải báo cáo..." />
  }

  return (
    <div>
      <PageHeader 
        title="Báo cáo" 
        subtitle="Phân tích và xuất dữ liệu tài chính"
      />

      <MonthlyReport 
        transactions={transactions}
        trades={trades}
        wallets={wallets}
      />
    </div>
  )
}