import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export function usePaybackGoals() {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch all payback goals with calculated progress
  const fetchGoals = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Get payback goals
      const { data: goalsData, error: goalsError } = await supabase
        .from('payback_goals')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

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
          // Get transactions linked to this goal
          const { data: transactions } = await supabase
            .from('financial_transactions')
            .select('amount')
            .eq('payback_goal_id', goal.id)
            .gte('date', goal.start_date)
            .is('deleted_at', null)

          const currentPaid = (transactions || []).reduce((sum, txn) => {
            return sum + Math.abs(txn.amount)
          }, 0)

          const progress = goal.target_amount > 0 
            ? Math.min((currentPaid / goal.target_amount) * 100, 100)
            : 0

          const isCompleted = currentPaid >= goal.target_amount

          return {
            ...goal,
            current_paid: currentPaid,
            progress,
            remaining: Math.max(goal.target_amount - currentPaid, 0),
            is_completed: isCompleted,
            is_overdue: !isCompleted && new Date(goal.deadline) < new Date()
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
          status: 'active'
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
          status: goalData.status
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
  }, [])

  return {
    goals,
    loading,
    error,
    createGoal,
    updateGoal,
    completeGoal,
    deleteGoal,
    refetch: fetchGoals
  }
}