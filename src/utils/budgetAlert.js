import { supabase } from '../lib/supabase'
import { getBudgetPeriodRange } from './budgetPeriod'

/**
 * Kiểm tra ngân sách sau khi tạo/sửa giao dịch chi tiêu và bắn thông báo nếu vượt/gần vượt.
 * Dùng chung cho modal giao dịch và trang thêm giao dịch riêng.
 */
export async function checkBudgetAfterTransaction(formData, budgets, { notifyBudgetExceeded, notifyBudgetWarning }) {
  if (formData.type !== 'expense' || !formData.category_id) return

  const budget = budgets.find(b => b.category_id === formData.category_id)
  if (!budget) return

  const { periodStart, periodEnd } = getBudgetPeriodRange(budget, new Date())

  const { data } = await supabase
    .from('financial_transactions')
    .select('amount')
    .eq('category_id', formData.category_id)
    .eq('type', 'expense')
    .gte('date', periodStart)
    .lte('date', periodEnd)
    .is('deleted_at', null)

  const totalSpent = data?.reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0
  const percentage = budget.amount > 0 ? (totalSpent / budget.amount) * 100 : 0

  if (totalSpent > budget.amount) {
    notifyBudgetExceeded(budget.category?.name || 'Danh mục', totalSpent, budget.amount)
  } else if (percentage > 80) {
    notifyBudgetWarning(budget.category?.name || 'Danh mục', percentage)
  }
}
