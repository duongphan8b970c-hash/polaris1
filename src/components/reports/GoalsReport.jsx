import { useMemo, useState } from 'react'

function toDateInputValue(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseLocalDate(dateString) {
  if (!dateString) return null
  const [year, month, day] = dateString.slice(0, 10).split('-').map(Number)
  return new Date(year, month - 1, day)
}

function dateKey(date) {
  return toDateInputValue(date)
}

function addDays(date, days) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function isBetween(date, start, end) {
  return date && date >= start && date <= end
}

function getRange(period, anchorValue) {
  const anchor = parseLocalDate(anchorValue) || new Date()
  if (period === 'day') return { start: anchor, end: anchor }
  if (period === 'week') {
    const start = addDays(anchor, -((anchor.getDay() + 6) % 7))
    return { start, end: addDays(start, 6) }
  }
  return { start: new Date(anchor.getFullYear(), anchor.getMonth(), 1), end: new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0) }
}

function rangeLabel(range, period) {
  if (period === 'day') return range.start.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const format = (date) => date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  return `${format(range.start)} – ${format(range.end)}`
}

function plannedDate(task) {
  return parseLocalDate(task.scheduled_date || task.due_date || task.created_at)
}

function completedDate(task) {
  return parseLocalDate(task.completed_date)
}

function taskIsDone(task) {
  return task.status === 'completed'
}

/** Reporting includes completed subtasks, which are the source of progress for many Goals. */
function getWorkItems(tasks) {
  return tasks.flatMap((task) => [
    { ...task, kind: 'task' },
    ...(task.subtasks || []).map((subtask) => ({
      ...subtask,
      kind: 'subtask',
      status: subtask.is_completed ? 'completed' : 'todo',
      priority: task.priority,
      due_date: task.due_date,
      scheduled_date: subtask.scheduled_date || task.scheduled_date,
      goal_id: task.goal_id,
      goal: task.goal,
    })),
  ])
}

function getStreak(tasks, anchorDate) {
  const completionDays = new Set(tasks.map(completedDate).filter(Boolean).map(dateKey))
  let streak = 0
  let cursor = new Date(anchorDate)
  while (completionDays.has(dateKey(cursor))) {
    streak += 1
    cursor = addDays(cursor, -1)
  }
  return streak
}

function groupPerformance(tasks, range, period) {
  const days = []
  for (let date = new Date(range.start); date <= range.end; date = addDays(date, 1)) days.push(new Date(date))

  const byDay = days.map((date) => {
    const key = dateKey(date)
    const planned = tasks.filter((task) => plannedDate(task) && dateKey(plannedDate(task)) === key)
    const completed = tasks.filter((task) => completedDate(task) && dateKey(completedDate(task)) === key)
    return { key, label: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }), planned: planned.length, completed: completed.length }
  })

  if (period !== 'month') return byDay
  const grouped = []
  for (let index = 0; index < byDay.length; index += 7) {
    const chunk = byDay.slice(index, index + 7)
    grouped.push({
      key: chunk[0].key,
      label: `${chunk[0].label} – ${chunk.at(-1).label}`,
      planned: chunk.reduce((sum, day) => sum + day.planned, 0),
      completed: chunk.reduce((sum, day) => sum + day.completed, 0),
    })
  }
  return grouped
}

export default function GoalsReport({ goals = [], tasks = [], onRefresh }) {
  const [period, setPeriod] = useState('week')
  const [anchorDate, setAnchorDate] = useState(() => toDateInputValue(new Date()))
  const [generatedAt, setGeneratedAt] = useState(() => new Date())
  const [generating, setGenerating] = useState(false)

  const report = useMemo(() => {
    const range = getRange(period, anchorDate)
    const workItems = getWorkItems(tasks)
    const planned = workItems.filter((task) => isBetween(plannedDate(task), range.start, range.end))
    const completed = workItems.filter((task) => isBetween(completedDate(task), range.start, range.end))
    const completedAsPlanned = planned.filter(taskIsDone)
    const completedWithDeadline = completed.filter((task) => task.due_date)
    const onTime = completedWithDeadline.filter((task) => completedDate(task) <= parseLocalDate(task.due_date))
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const overdue = tasks.filter((task) => !taskIsDone(task) && task.due_date && parseLocalDate(task.due_date) < today)
    const blocked = tasks.filter((task) => !taskIsDone(task) && (task.status === 'blocked' || task.is_blocked))
    const highPriorityOpen = tasks.filter((task) => !taskIsDone(task) && ['urgent', 'high'].includes(task.priority)).sort((a, b) => String(a.due_date || '9999').localeCompare(String(b.due_date || '9999')))
    const atRiskGoals = goals.filter((goal) => ['at_risk', 'off_track'].includes(goal.health?.key))
    const goalsCompleted = goals.filter((goal) => goal.status === 'completed' && isBetween(parseLocalDate(goal.completed_date), range.start, range.end))
    const performance = groupPerformance(workItems, range, period)
    const completionRate = planned.length ? (completedAsPlanned.length / planned.length) * 100 : 0
    const onTimeRate = completedWithDeadline.length ? (onTime.length / completedWithDeadline.length) * 100 : 0

    return {
      range,
      planned,
      completed,
      completedAsPlanned,
      completionRate,
      onTime,
      onTimeRate,
      overdue,
      blocked,
      highPriorityOpen,
      atRiskGoals,
      goalsCompleted,
      performance,
      streak: getStreak(workItems, parseLocalDate(anchorDate) || new Date()),
      activeGoals: goals.filter((goal) => goal.status !== 'completed'),
    }
  }, [goals, tasks, period, anchorDate])

  const regenerate = async () => {
    setGenerating(true)
    try {
      await onRefresh?.()
      setGeneratedAt(new Date())
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-5">
      <section className="card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div><h2 className="text-lg font-bold text-gray-900">Báo cáo hiệu suất</h2></div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg bg-gray-100 p-1">
              {[{ value: 'day', label: 'Ngày' }, { value: 'week', label: 'Tuần' }, { value: 'month', label: 'Tháng' }].map((option) => <button key={option.value} onClick={() => setPeriod(option.value)} className={`rounded-md px-3 py-1.5 text-sm font-medium ${period === option.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>{option.label}</button>)}
            </div>
            <input type="date" value={anchorDate} onChange={(event) => setAnchorDate(event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" aria-label="Ngày tham chiếu báo cáo Goal" />
            <button onClick={regenerate} disabled={generating} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{generating ? 'Đang tạo...' : '↻ Tạo báo cáo'}</button>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-500">Thời gian báo cáo: <strong>{rangeLabel(report.range, period)}</strong> · Cập nhật lần cuối: {generatedAt.toLocaleTimeString('vi-VN')}</p>
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Hoàn thành theo kế hoạch" value={`${report.completionRate.toFixed(0)}%`} detail={`${report.completedAsPlanned.length}/${report.planned.length} việc đã lên lịch`} tone="green" />
        <Metric label="Hoàn thành trong kỳ" value={report.completed.length} detail={`${report.onTimeRate.toFixed(0)}% đúng hạn trong số việc có deadline`} tone="blue" />
        <Metric label="Task quá hạn" value={report.overdue.length} detail={report.blocked.length ? `${report.blocked.length} task đang bị chặn` : 'Không tính task đã hoàn thành'} tone={report.overdue.length ? 'red' : 'green'} />
        <Metric label="Streak hoàn thành" value={`${report.streak} ngày`} detail={`${report.activeGoals.length} Goal đang thực hiện`} tone="purple" />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <section className="card">
            <div className="mb-4"><h3 className="font-bold text-gray-900">Nhịp thực hiện {period === 'month' ? 'theo tuần' : 'theo ngày'}</h3><p className="text-xs text-gray-500">“Đã lên lịch” dùng ngày lịch hoặc hạn chót; “hoàn thành” dùng ngày task/subtask được đánh dấu xong.</p></div>
            {report.performance.every((item) => item.planned === 0 && item.completed === 0) ? <EmptyState message="Chưa có task hoặc subtask có lịch, hạn chót hay ngày hoàn thành trong kỳ này." /> : <PerformanceTable rows={report.performance} />}
          </section>

          <section className="card overflow-hidden">
            <div className="mb-4 flex items-center justify-between"><div><h3 className="font-bold text-gray-900">Tiến độ Goal đang thực hiện</h3><p className="text-xs text-gray-500">Ưu tiên xem các Goal có rủi ro hoặc chậm tiến độ.</p></div><span className="text-xs text-gray-500">{report.activeGoals.length} Goal</span></div>
            {report.activeGoals.length === 0 ? <EmptyState message="Không có Goal đang thực hiện." /> : <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="border-y border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500"><tr><th className="px-3 py-3 text-left">Goal</th><th className="px-3 py-3 text-right">Tiến độ</th><th className="px-3 py-3 text-left">Trạng thái</th><th className="px-3 py-3 text-right">Task trễ</th></tr></thead><tbody className="divide-y divide-gray-100">{report.activeGoals.map((goal) => <GoalRow key={goal.id} goal={goal} />)}</tbody></table></div>}
          </section>
        </div>
        <ReviewPanel report={report} />
      </div>
    </div>
  )
}

function Metric({ label, value, detail, tone }) {
  const colors = { green: 'border-green-500 text-green-600', blue: 'border-blue-500 text-blue-600', red: 'border-red-500 text-red-600', purple: 'border-purple-500 text-purple-600' }
  return <div className={`card border-l-4 ${colors[tone]}`}><p className="text-sm text-gray-600">{label}</p><p className="mt-1 text-xl font-bold">{value}</p><p className="mt-1 text-xs text-gray-500">{detail}</p></div>
}

function PerformanceTable({ rows }) {
  const max = Math.max(...rows.map((row) => Math.max(row.planned, row.completed)), 1)
  return <div className="space-y-3">{rows.map((row) => <div key={row.key} className="grid grid-cols-[70px_minmax(0,1fr)_72px] items-center gap-3"><span className="text-xs font-medium text-gray-600">{row.label}</span><div className="space-y-1"><Bar value={row.planned} max={max} color="bg-blue-400" /><Bar value={row.completed} max={max} color="bg-green-500" /></div><span className="text-right text-xs text-gray-600"><span className="text-blue-600">{row.planned}</span> / <span className="font-semibold text-green-600">{row.completed}</span></span></div>)}<div className="flex gap-4 pt-1 text-[11px] text-gray-500"><span><i className="mr-1 inline-block h-2 w-2 rounded bg-blue-400" />Đã lên lịch</span><span><i className="mr-1 inline-block h-2 w-2 rounded bg-green-500" />Hoàn thành</span></div></div>
}

function Bar({ value, max, color }) {
  return <div className="h-1.5 overflow-hidden rounded-full bg-gray-100"><div className={`h-full rounded-full ${color}`} style={{ width: `${(value / max) * 100}%` }} /></div>
}

function GoalRow({ goal }) {
  const progress = Number(goal.progress) || 0
  const health = goal.health?.meta
  const lateTasks = goal.health?.lateTasks?.length || 0
  return <tr className="hover:bg-gray-50"><td className="px-3 py-3"><span className="mr-2">{goal.icon}</span><span className="font-medium text-gray-900">{goal.name}</span></td><td className="min-w-[120px] px-3 py-3"><div className="flex items-center gap-2"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200"><div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(progress, 100)}%` }} /></div><span className="text-xs font-semibold text-gray-700">{progress.toFixed(0)}%</span></div></td><td className="px-3 py-3"><span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${health?.chip || 'bg-gray-100 text-gray-600'}`}><span>{health?.icon || '•'}</span>{health?.label || 'Chưa đủ dữ liệu'}</span></td><td className={`px-3 py-3 text-right text-sm font-semibold ${lateTasks ? 'text-red-600' : 'text-gray-500'}`}>{lateTasks || '—'}</td></tr>
}

function ReviewPanel({ report }) {
  const insights = []
  if (report.overdue.length) insights.push({ tone: 'red', title: `${report.overdue.length} task đang quá hạn`, detail: report.overdue.slice(0, 3).map((task) => task.title).join(', ') })
  if (report.atRiskGoals.length) insights.push({ tone: 'amber', title: `${report.atRiskGoals.length} Goal có rủi ro`, detail: report.atRiskGoals.map((goal) => goal.name).join(', ') })
  if (report.highPriorityOpen.length) insights.push({ tone: 'purple', title: `${report.highPriorityOpen.length} task ưu tiên cao chưa xong`, detail: report.highPriorityOpen.slice(0, 3).map((task) => task.title).join(', ') })
  if (report.planned.length && report.completionRate < 60) insights.push({ tone: 'blue', title: 'Tỷ lệ hoàn thành kế hoạch còn thấp', detail: 'Chọn 1–3 task quan trọng nhất cho kỳ tiếp theo và chuyển các việc chưa làm vào lịch mới.' })
  if (!insights.length) insights.push({ tone: 'green', title: 'Kỳ làm việc đang ổn định', detail: report.planned.length ? `Đã hoàn thành ${report.completedAsPlanned.length}/${report.planned.length} task đã lên lịch.` : 'Hãy lên lịch cho các task quan trọng để báo cáo phản ánh rõ hiệu suất.' })

  const classes = { red: 'border-red-200 bg-red-50 text-red-800', amber: 'border-amber-200 bg-amber-50 text-amber-800', purple: 'border-purple-200 bg-purple-50 text-purple-800', blue: 'border-blue-200 bg-blue-50 text-blue-800', green: 'border-green-200 bg-green-50 text-green-800' }
  return <aside className="card h-fit"><h3 className="font-bold text-gray-900">🪞 Gợi ý để tự review</h3><p className="mt-1 text-xs text-gray-500">Tập trung vào rủi ro, deadline và nhịp hoàn thành thay vì chỉ số lượng task.</p><div className="mt-4 space-y-3">{insights.map((item) => <div key={item.title} className={`rounded-lg border p-3 ${classes[item.tone]}`}><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs leading-relaxed opacity-90">{item.detail}</p></div>)}</div></aside>
}

function EmptyState({ message }) {
  return <p className="py-10 text-center text-sm text-gray-500">{message}</p>
}
