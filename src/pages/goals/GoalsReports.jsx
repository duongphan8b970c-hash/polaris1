import GoalsReport from '../../components/reports/GoalsReport'
import ErrorMessage from '../../components/common/ErrorMessage'
import Loading from '../../components/common/Loading'
import PageHeader from '../../components/layout/PageHeader'
import { useGoals } from '../../hooks/goals/useGoals'
import { useTasks } from '../../hooks/goals/useTasks'

export default function GoalsReports() {
  const { goals, loading: goalsLoading, error: goalsError, refetch: refetchGoals } = useGoals()
  const { tasks, loading: tasksLoading, error: tasksError, refetch: refetchTasks } = useTasks()

  const refreshReport = async () => {
    await Promise.all([refetchGoals(), refetchTasks()])
  }

  if (goalsLoading || tasksLoading) return <Loading message="Đang tải báo cáo Goal..." />
  if (goalsError || tasksError) return <ErrorMessage message={goalsError || tasksError} onRetry={refreshReport} />

  return (
    <div>
      <PageHeader title="🎯 Báo cáo Goal" subtitle="Theo dõi hiệu suất cá nhân theo ngày, tuần và tháng." />
      <GoalsReport goals={goals} tasks={tasks} onRefresh={refreshReport} />
    </div>
  )
}
