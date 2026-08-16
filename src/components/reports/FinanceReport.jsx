import { useMemo, useState } from 'react'
import { formatNumber } from '../../utils'
import { getBudgetPeriodRange } from '../../utils/budgetPeriod'

const MS_PER_DAY = 24 * 60 * 60 * 1000

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

function addDays(date, days) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function getRange(period, anchorValue) {
  const anchor = parseLocalDate(anchorValue) || new Date()
  let start
  let end

  if (period === 'week') {
    const mondayOffset = (anchor.getDay() + 6) % 7
    start = addDays(anchor, -mondayOffset)
    end = addDays(start, 6)
  } else {
    start = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
    end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0)
  }

  const days = Math.round((end - start) / MS_PER_DAY) + 1
  const previousEnd = addDays(start, -1)
  return { start, end, previousStart: addDays(previousEnd, -days + 1), previousEnd }
}

function rangeLabel(range) {
  const display = (date) => date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  return `${display(range.start)} – ${display(range.end)}`
}

function isInRange(transaction, start, end) {
  const date = parseLocalDate(transaction.date)
  return date && date >= start && date <= end
}

function isReportable(transaction) {
  return !transaction.deleted_at && (transaction.type === 'income' || transaction.type === 'expense')
}

function categoryIdentity(transaction) {
  const category = transaction.categories || transaction.category
  return {
    id: transaction.category_id || category?.id || 'uncategorized',
    name: category?.name || 'Chưa phân loại',
    icon: category?.icon || '📁',
  }
}

function comparePercent(current, previous) {
  if (previous === 0) return current === 0 ? 0 : null
  return ((current - previous) / Math.abs(previous)) * 100
}

function summary(transactions) {
  const income = transactions.filter((transaction) => transaction.type === 'income').reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount) || 0), 0)
  const expense = transactions.filter((transaction) => transaction.type === 'expense').reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount) || 0), 0)
  return { income, expense, net: income - expense, count: transactions.length }
}

function buildCategoryRows(transactions, previousTransactions, budgets, reportDate) {
  const rows = new Map()
  const ensureRow = ({ id, name, icon }) => {
    if (!rows.has(id)) rows.set(id, { id, name, icon, income: 0, expense: 0, previousExpense: 0, budget: 0, budgetPeriods: [] })
    return rows.get(id)
  }

  transactions.forEach((transaction) => {
    const row = ensureRow(categoryIdentity(transaction))
    if (transaction.type === 'income') row.income += Math.abs(Number(transaction.amount) || 0)
    if (transaction.type === 'expense') row.expense += Math.abs(Number(transaction.amount) || 0)
  })
  previousTransactions.forEach((transaction) => {
    if (transaction.type === 'expense') ensureRow(categoryIdentity(transaction)).previousExpense += Math.abs(Number(transaction.amount) || 0)
  })
  budgets.forEach((budget) => {
    const category = budget.category || {}
    const row = ensureRow({ id: budget.category_id || category.id || `budget-${budget.id}`, name: category.name || 'Danh mục ngân sách', icon: category.icon || '💰' })
    const budgetRange = getBudgetPeriodRange(budget, reportDate)
    row.budget += Number(budget.amount) || 0
    row.budgetPeriods.push(budgetRange)
  })

  return Array.from(rows.values())
    .map((row) => ({ ...row, change: comparePercent(row.expense, row.previousExpense) }))
    .sort((a, b) => Math.max(b.expense, b.income, b.budget) - Math.max(a.expense, a.income, a.budget))
}

export default function FinanceReport({ transactions = [], budgets = [], onRefresh }) {
  const [period, setPeriod] = useState('month')
  const [anchorDate, setAnchorDate] = useState(() => toDateInputValue(new Date()))
  const [generatedAt, setGeneratedAt] = useState(() => new Date())
  const [generating, setGenerating] = useState(false)

  const report = useMemo(() => {
    const range = getRange(period, anchorDate)
    const reportDate = parseLocalDate(anchorDate) || new Date()
    const reportable = transactions.filter(isReportable)
    const current = reportable.filter((transaction) => isInRange(transaction, range.start, range.end))
    const previous = reportable.filter((transaction) => isInRange(transaction, range.previousStart, range.previousEnd))
    const currentSummary = summary(current)
    const previousSummary = summary(previous)
    const rows = buildCategoryRows(current, previous, budgets, reportDate)
    const totalBudget = rows.reduce((sum, row) => sum + row.budget, 0)
    const budgetedExpense = rows.filter((row) => row.budget > 0).reduce((sum, row) => sum + row.expense, 0)
    const withoutBudget = rows.filter((row) => row.expense > 0 && row.budget === 0)
    const overBudget = rows.filter((row) => row.budget > 0 && row.expense > row.budget)
    const nearBudget = rows.filter((row) => row.budget > 0 && row.expense <= row.budget && row.expense / row.budget >= 0.8)
    const topExpense = [...rows].sort((a, b) => b.expense - a.expense)[0]

    return {
      range,
      current,
      currentSummary,
      previousSummary,
      rows,
      totalBudget,
      budgetedExpense,
      withoutBudget,
      overBudget,
      nearBudget,
      topExpense,
    }
  }, [transactions, budgets, period, anchorDate])

  const regenerate = async () => {
    setGenerating(true)
    try {
      await onRefresh?.()
      setGeneratedAt(new Date())
    } finally {
      setGenerating(false)
    }
  }

  const exportCsv = () => {
    const rows = [
      ['BÁO CÁO TÀI CHÍNH', rangeLabel(report.range)],
      [],
      ['Tổng thu nhập', report.currentSummary.income],
      ['Tổng chi tiêu', report.currentSummary.expense],
      ['Chênh lệch', report.currentSummary.net],
      ['Tổng giao dịch', report.currentSummary.count],
      [],
      ['Danh mục', 'Thu nhập', 'Chi tiêu', 'Kỳ trước', 'Hạn mức', 'Tỷ lệ hạn mức'],
      ...report.rows.map((row) => [row.name, row.income, row.expense, row.previousExpense, row.budget, row.budget > 0 ? `${((row.expense / row.budget) * 100).toFixed(1)}%` : '—']),
    ]
    const csv = '\uFEFF' + rows.map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `bao-cao-tai-chinh-${period}-${anchorDate}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const budgetUsage = report.totalBudget ? (report.budgetedExpense / report.totalBudget) * 100 : 0
  const expenseChange = comparePercent(report.currentSummary.expense, report.previousSummary.expense)

  return (
    <div className="space-y-5">
      <section className="card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Báo cáo giao dịch theo danh mục</h2>
            <p className="mt-1 text-sm text-gray-600">So sánh chi tiêu với kỳ trước, tổng giao dịch và hạn mức ngân sách đã thiết lập.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg bg-gray-100 p-1">
              {[{ value: 'week', label: 'Theo tuần' }, { value: 'month', label: 'Theo tháng' }].map((option) => (
                <button key={option.value} onClick={() => setPeriod(option.value)} className={`rounded-md px-3 py-1.5 text-sm font-medium ${period === option.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>{option.label}</button>
              ))}
            </div>
            <input type="date" value={anchorDate} onChange={(event) => setAnchorDate(event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" aria-label="Ngày tham chiếu báo cáo" />
            <button onClick={regenerate} disabled={generating} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              {generating ? 'Đang tạo...' : '↻ Tạo báo cáo'}
            </button>
            <button onClick={exportCsv} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">⇩ CSV</button>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-500">Kỳ đang xem: <strong>{rangeLabel(report.range)}</strong> · Cập nhật lần cuối: {generatedAt.toLocaleTimeString('vi-VN')}</p>
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Tổng thu nhập" value={`+${formatNumber(report.currentSummary.income)} ₫`} detail={`${report.current.filter((item) => item.type === 'income').length} giao dịch`} tone="green" />
        <SummaryCard label="Tổng chi tiêu" value={`-${formatNumber(report.currentSummary.expense)} ₫`} detail={changeDescription(expenseChange, 'so với kỳ trước')} tone="red" />
        <SummaryCard label="Chênh lệch" value={`${report.currentSummary.net >= 0 ? '+' : ''}${formatNumber(report.currentSummary.net)} ₫`} detail="Thu nhập trừ chi tiêu" tone={report.currentSummary.net >= 0 ? 'blue' : 'orange'} />
        <SummaryCard label="Tổng giao dịch" value={report.currentSummary.count} detail={`${report.rows.filter((row) => row.expense > 0 || row.income > 0).length} danh mục phát sinh`} tone="purple" />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="card overflow-hidden">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div><h3 className="font-bold text-gray-900">Chi tiết danh mục</h3><p className="text-xs text-gray-500">Chi tiêu kỳ này được so với cùng độ dài của kỳ trước.</p></div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${budgetUsage > 100 ? 'bg-red-100 text-red-700' : budgetUsage >= 80 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-700'}`}>Đã dùng {budgetUsage.toFixed(0)}% hạn mức</span>
          </div>
          {report.rows.length === 0 ? <EmptyState message="Chưa có giao dịch hoặc hạn mức trong kỳ đã chọn." /> : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="border-y border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500"><tr><th className="px-3 py-3 text-left">Danh mục</th><th className="px-3 py-3 text-right">Thu</th><th className="px-3 py-3 text-right">Chi</th><th className="px-3 py-3 text-right">Kỳ trước</th><th className="px-3 py-3 text-right">Hạn mức</th><th className="px-3 py-3 text-left">Mức dùng</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {report.rows.map((row) => {
                    const utilization = row.budget ? (row.expense / row.budget) * 100 : null
                    return <tr key={row.id} className="hover:bg-gray-50"><td className="px-3 py-3"><span className="mr-2 text-base">{row.icon}</span><span className="font-medium text-gray-900">{row.name}</span></td><td className="px-3 py-3 text-right font-medium text-green-600">{row.income ? `+${formatNumber(row.income)} ₫` : '—'}</td><td className="px-3 py-3 text-right font-medium text-red-600">{row.expense ? `-${formatNumber(row.expense)} ₫` : '—'}</td><td className="px-3 py-3 text-right text-gray-600">{row.previousExpense ? `${formatNumber(row.previousExpense)} ₫` : '—'}<ChangeBadge value={row.change} /></td><td className="px-3 py-3 text-right text-gray-700">{row.budget ? `${formatNumber(row.budget)} ₫` : '—'}</td><td className="min-w-[130px] px-3 py-3">{utilization === null ? <span className="text-xs text-gray-400">Chưa đặt</span> : <BudgetMeter value={utilization} label={`${utilization.toFixed(0)}%`} />}</td></tr>
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <ReviewInsights report={report} budgetUsage={budgetUsage} />
      </div>
    </div>
  )
}

function SummaryCard({ label, value, detail, tone }) {
  const tones = { green: 'border-green-500 text-green-600', red: 'border-red-500 text-red-600', blue: 'border-blue-500 text-blue-600', orange: 'border-orange-500 text-orange-600', purple: 'border-purple-500 text-purple-600' }
  return <div className={`card border-l-4 ${tones[tone]}`}><p className="text-sm text-gray-600">{label}</p><p className="mt-1 text-xl font-bold">{value}</p><p className="mt-1 text-xs text-gray-500">{detail}</p></div>
}

function BudgetMeter({ value, label }) {
  const color = value > 100 ? 'bg-red-500' : value >= 80 ? 'bg-amber-500' : 'bg-green-500'
  return <div><div className="h-1.5 overflow-hidden rounded-full bg-gray-200"><div className={`h-full ${color}`} style={{ width: `${Math.min(value, 100)}%` }} /></div><p className="mt-1 text-right text-xs text-gray-600">{label}</p></div>
}

function ChangeBadge({ value }) {
  if (value === null) return <span className="ml-1 text-[10px] text-gray-400">mới</span>
  if (value === 0) return null
  return <span className={`ml-1 text-[10px] font-semibold ${value > 0 ? 'text-red-600' : 'text-green-600'}`}>{value > 0 ? '↑' : '↓'} {Math.abs(value).toFixed(0)}%</span>
}

function changeDescription(value, suffix) {
  if (value === null) return `Có phát sinh mới ${suffix}`
  if (value === 0) return `Không đổi ${suffix}`
  return `${value > 0 ? 'Tăng' : 'Giảm'} ${Math.abs(value).toFixed(0)}% ${suffix}`
}

function EmptyState({ message }) {
  return <p className="py-10 text-center text-sm text-gray-500">{message}</p>
}

function ReviewInsights({ report, budgetUsage }) {
  const insights = []
  if (report.overBudget.length) insights.push({ tone: 'red', title: `${report.overBudget.length} danh mục vượt hạn mức`, detail: report.overBudget.map((row) => row.name).join(', ') })
  if (report.nearBudget.length) insights.push({ tone: 'amber', title: `${report.nearBudget.length} danh mục sắp chạm hạn mức`, detail: report.nearBudget.map((row) => row.name).join(', ') })
  if (report.topExpense?.expense > 0) insights.push({ tone: 'blue', title: `Chi nhiều nhất: ${report.topExpense.name}`, detail: `${formatNumber(report.topExpense.expense)} ₫ · xem lại nhu cầu hoặc kế hoạch cho danh mục này.` })
  if (report.withoutBudget.length) insights.push({ tone: 'purple', title: `${report.withoutBudget.length} danh mục chưa có hạn mức`, detail: report.withoutBudget.map((row) => row.name).join(', ') })
  if (!insights.length) insights.push({ tone: 'green', title: 'Ngân sách đang trong tầm kiểm soát', detail: budgetUsage ? `Đã dùng ${budgetUsage.toFixed(0)}% tổng hạn mức.` : 'Hãy đặt hạn mức cho các danh mục chi tiêu thường xuyên để theo dõi kỹ hơn.' })

  const toneClasses = { red: 'border-red-200 bg-red-50 text-red-800', amber: 'border-amber-200 bg-amber-50 text-amber-800', blue: 'border-blue-200 bg-blue-50 text-blue-800', purple: 'border-purple-200 bg-purple-50 text-purple-800', green: 'border-green-200 bg-green-50 text-green-800' }
  return <aside className="card h-fit"><h3 className="font-bold text-gray-900">🔎 Gợi ý để tự review</h3><p className="mt-1 text-xs text-gray-500">Các điểm đáng chú ý được tạo từ dữ liệu kỳ đang xem.</p><div className="mt-4 space-y-3">{insights.map((insight) => <div key={insight.title} className={`rounded-lg border p-3 ${toneClasses[insight.tone]}`}><p className="text-sm font-semibold">{insight.title}</p><p className="mt-1 text-xs leading-relaxed opacity-90">{insight.detail}</p></div>)}</div></aside>
}
