import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { recalculateAllWalletBalances } from '../../utils/walletBalance'

export function usePaybackGoals(goalType = 'payback') {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [monthFilter, setMonthFilter] = useState(null) // null = all-time, 'YYYY-MM' = specific month

  // Fetch all payback goals with calculated progress
  const fetchGoals = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Get payback goals filtered by goal_type
      let query = supabase
      .from('payback_goals')
      .select(`
        *,
        priority:payback_priorities(
          id,
          name,
          icon,
          color,
          sort_order
        )
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

      // Filter by goal_type if column exists
      if (goalType) {
        query = query.eq('goal_type', goalType)
      }

      const { data: goalsData, error: goalsError } = await query

      if (goalsError) throw goalsError

      // Get payback category ID
      const { data: paybackCategory } = await supabase
        .from('categories')
        .select('id')
        .eq('name', 'Payback')
        .eq('type', 'expense')
        .single()

      if (!paybackCategory) {
        console.warn('Payback category not found')
        setGoals(goalsData || [])
        setLoading(false)
        return
      }

      // ✅ Tính current_paid từ transactions có payback_goal_id
      const goalsWithProgress = await Promise.all(
        (goalsData || []).map(async (goal) => {
          // Get ALL transactions linked to this goal (all-time)
          const { data: allTransactions } = await supabase
            .from('financial_transactions')
            .select('amount, date')
            .eq('payback_goal_id', goal.id)
            .gte('date', goal.start_date)
            .is('deleted_at', null)

          const currentPaid = (allTransactions || []).reduce((sum, txn) => {
            return sum + Math.abs(txn.amount)
          }, 0)

          // Calculate monthly paid if filter is active
          let monthlyPaid = 0
          if (monthFilter) {
            const [filterYear, filterMonth] = monthFilter.split('-').map(Number)
            const monthStart = `${filterYear}-${String(filterMonth).padStart(2, '0')}-01`
            const monthEnd = `${filterYear}-${String(filterMonth).padStart(2, '0')}-${new Date(filterYear, filterMonth, 0).getDate()}`
            monthlyPaid = (allTransactions || []).reduce((sum, txn) => {
              if (txn.date >= monthStart && txn.date <= monthEnd) {
                return sum + Math.abs(txn.amount)
              }
              return sum
            }, 0)
          }

          const progress = goal.target_amount > 0 
            ? Math.min((currentPaid / goal.target_amount) * 100, 100)
            : 0

          const isCompleted = currentPaid >= goal.target_amount

          return {
            ...goal,
            current_paid: currentPaid,
            monthly_paid: monthlyPaid,
            progress,
            remaining: Math.max(goal.target_amount - currentPaid, 0),
            is_completed: isCompleted,
            is_overdue: !isCompleted && new Date(goal.deadline) < new Date(),
            transaction_count: allTransactions?.length || 0,  
            priority_sort_order: goal.priority?.sort_order || 999,  
            priority_name: goal.priority?.name || 'Chưa phân loại',  
            priority_icon: goal.priority?.icon || '❓',            
            priority_color: goal.priority?.color || '#6B7280'        
          }
        })
      )

      setGoals(goalsWithProgress)
    } catch (err) {
      console.error('Error fetching payback goals:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Create new payback goal
  const createGoal = async (goalData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error: createError } = await supabase
        .from('payback_goals')
        .insert([{
          user_id: user.id,
          name: goalData.name,
          description: goalData.description,
          target_amount: parseFloat(goalData.target_amount),
          initial_amount: parseFloat(goalData.initial_amount) || 0,
          start_date: goalData.start_date,
          deadline: goalData.deadline,
          status: 'active',
          priority_id: goalData.priority_id || null,
          goal_type: goalType,
          recurrence: goalData.recurrence || 'none'
        }])
        .select()
        .single()

      if (createError) throw createError

      await fetchGoals() // Refresh list
      return { success: true, data }
    } catch (err) {
      console.error('Error creating payback goal:', err)
      return { success: false, error: err.message }
    }
  }

  // Update payback goal
  const updateGoal = async (id, goalData) => {
    try {
      const { data, error: updateError } = await supabase
        .from('payback_goals')
        .update({
          name: goalData.name,
          description: goalData.description,
          target_amount: parseFloat(goalData.target_amount),
          initial_amount: parseFloat(goalData.initial_amount) || 0,
          deadline: goalData.deadline,
          status: goalData.status,
          priority_id: goalData.priority_id || null,
          recurrence: goalData.recurrence || 'none'
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      await fetchGoals() // Refresh list
      return { success: true, data }
    } catch (err) {
      console.error('Error updating payback goal:', err)
      return { success: false, error: err.message }
    }
  }

  // Mark goal as completed
  const completeGoal = async (id) => {
    try {
      const { data, error: updateError } = await supabase
        .from('payback_goals')
        .update({
          status: 'completed',
          completed_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      await fetchGoals() // Refresh list
      return { success: true, data }
    } catch (err) {
      console.error('Error completing goal:', err)
      return { success: false, error: err.message }
    }
  }

  // Tìm (hoặc tạo mới nếu chưa có) category chi tiêu theo tên.
  const getOrCreateExpenseCategory = async (name, icon) => {
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('name', name)
      .eq('type', 'expense')
      .is('deleted_at', null)
      .limit(1)

    if (existing && existing.length > 0) return existing[0].id

    // Chưa có -> tạo mặc định (best-effort). category_id cho phép null nên nếu
    // tạo thất bại vẫn không chặn việc ghi giao dịch.
    const { data: { user } } = await supabase.auth.getUser()
    const { data: created, error: createErr } = await supabase
      .from('categories')
      .insert([{
        name,
        type: 'expense',
        icon,
        description: `${name} (tự động)`,
        display_order: 0,
        is_active: true,
        created_by: user?.id
      }])
      .select('id')
      .single()

    if (createErr) {
      console.warn(`Không thể tạo category "${name}":`, createErr.message)
      return null
    }
    return created.id
  }

  // Với plan có recurrence: tạo plan kế tiếp (theo tuần/tháng) khi plan cũ xong.
  const createNextRecurrence = async (goal) => {
    const recurrence = goal.recurrence
    if (!recurrence || recurrence === 'none') return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const base = new Date(goal.deadline)
    if (recurrence === 'weekly') base.setDate(base.getDate() + 7)
    else if (recurrence === 'monthly') base.setMonth(base.getMonth() + 1)
    const nextDeadline = base.toISOString().split('T')[0]
    const today = new Date().toISOString().split('T')[0]

    await supabase
      .from('payback_goals')
      .insert([{
        user_id: user.id,
        name: goal.name,
        description: goal.description,
        target_amount: goal.target_amount,
        initial_amount: goal.initial_amount || 0,
        start_date: today,
        deadline: nextDeadline,
        status: 'active',
        priority_id: null,
        goal_type: 'plan',
        recurrence
      }])
  }

  // Xác nhận đã thanh toán: tạo giao dịch chi tiêu tự động (category Payback/Plan,
  // mô tả = tên mục tiêu, gán payback_goal_id để cập nhật tiến độ).
  // isFull = true -> thanh toán hết phần còn lại và đánh dấu hoàn thành.
  const confirmPayment = async (goal, { amount, walletId, isFull }) => {
    try {
      const payAmount = Math.round(parseFloat(amount))
      if (!walletId) throw new Error('Vui lòng chọn ví')
      if (!payAmount || payAmount <= 0) throw new Error('Số tiền không hợp lệ')

      const isPlan = goal.goal_type === 'plan'
      const categoryId = await getOrCreateExpenseCategory(
        isPlan ? 'Plan' : 'Payback',
        isPlan ? '📋' : '💳'
      )

      // Lấy tiền tệ của ví để ghi vào giao dịch.
      const { data: wallet, error: walletErr } = await supabase
        .from('wallets')
        .select('currency')
        .eq('id', walletId)
        .single()
      if (walletErr || !wallet) throw new Error('Không tìm thấy ví')

      const today = new Date().toISOString().split('T')[0]
      const now = new Date().toTimeString().slice(0, 5)

      const { error: insertErr } = await supabase
        .from('financial_transactions')
        .insert([{
          wallet_id: walletId,
          type: 'expense',
          amount: -Math.abs(payAmount),
          fee: 0,
          currency: wallet.currency,
          category_id: categoryId,
          payback_goal_id: goal.id,
          description: goal.name,
          date: today,
          time: now
        }])
      if (insertErr) throw insertErr

      await recalculateAllWalletBalances()

      // Xác định hoàn thành: thanh toán hết hoặc đã đủ target.
      const newPaid = (goal.current_paid || 0) + payAmount
      const completed = isFull || newPaid >= goal.target_amount

      if (completed) {
        await supabase
          .from('payback_goals')
          .update({ status: 'completed', completed_date: today })
          .eq('id', goal.id)

        // Plan có recurrence -> tạo plan kế tiếp.
        if (isPlan) await createNextRecurrence(goal)
      }

      await fetchGoals()
      return { success: true, completed }
    } catch (err) {
      console.error('Error confirming payment:', err)
      return { success: false, error: err.message }
    }
  }

  // Soft delete payback goal
  const deleteGoal = async (id) => {
    try {
      const { error: deleteError } = await supabase
        .from('payback_goals')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (deleteError) throw deleteError

      await fetchGoals() // Refresh list
      return { success: true }
    } catch (err) {
      console.error('Error deleting payback goal:', err)
      return { success: false, error: err.message }
    }
  }

  useEffect(() => {
    fetchGoals()
  }, [goalType, monthFilter])

  return {
    goals,
    loading,
    error,
    monthFilter,
    setMonthFilter,
    createGoal,
    updateGoal,
    completeGoal,
    confirmPayment,
    deleteGoal,
    refetch: fetchGoals
  }
}