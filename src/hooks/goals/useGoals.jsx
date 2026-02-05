import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export function useGoals() {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchGoals = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // ✅ Get goals
      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (goalsError) throw goalsError

      // ✅ Calculate metrics for each goal using TASKS (not projects)
      const goalsWithMetrics = await Promise.all(
        (goalsData || []).map(async (goal) => {
          // Get all tasks for this goal DIRECTLY
          const { data: tasksData, error: tasksError } = await supabase
            .from('tasks')
            .select('id, status')
            .eq('goal_id', goal.id)  // ✅ Direct link to goal
            .is('deleted_at', null)

          if (tasksError) {
            console.error('Error fetching tasks for goal:', goal.id, tasksError)
            return {
              ...goal,
              total_tasks: 0,
              completed_tasks: 0,
              progress: 0
            }
          }

          const totalTasks = tasksData?.length || 0
          const completedTasks = tasksData?.filter(t => t.status === 'completed').length || 0
          const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

          return {
            ...goal,
            total_tasks: totalTasks,
            completed_tasks: completedTasks,
            progress: progress.toFixed(2)
          }
        })
      )

      setGoals(goalsWithMetrics)
    } catch (err) {
      console.error('Error fetching goals:', err)
      setError(err.message)
      setGoals([])  // ✅ Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  // REPLACE createGoal function (lines ~68-95):

const createGoal = async (goalData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    console.log('📤 Creating goal with data:', goalData)  // ✅ Debug log

    const { data, error: createError } = await supabase
      .from('goals')
      .insert([{
        user_id: user.id,
        name: goalData.name,
        description: goalData.description,
        icon: goalData.icon || '🎯',
        color: goalData.color || '#3B82F6',
        category: goalData.category || 'personal',
        priority: goalData.priority || 'medium',
        start_date: goalData.start_date,
        target_date: goalData.target_date,
        status: 'active',
        // ✅ ADD: Checkin settings
        is_checkin_enabled: goalData.is_checkin_enabled || false,
        checkin_frequency: goalData.checkin_frequency || 'daily',
        checkin_days_per_week: goalData.checkin_days_per_week || 7,
        checkin_target_days: goalData.checkin_target_days || null
      }])
      .select()
      .single()

    if (createError) {
      console.error('❌ Create error:', createError)
      throw createError
    }

    console.log('✅ Goal created:', data)
    await fetchGoals()
    return { success: true, data }
  } catch (err) {
    console.error('Error creating goal:', err)
    return { success: false, error: err.message }
  }
}

// REPLACE updateGoal function (lines ~97-119):

const updateGoal = async (id, goalData) => {
  try {
    console.log('📤 Updating goal with data:', goalData)  // ✅ Debug log

    const { data, error: updateError } = await supabase
      .from('goals')
      .update({
        name: goalData.name,
        description: goalData.description,
        icon: goalData.icon,
        color: goalData.color,
        category: goalData.category,
        priority: goalData.priority,
        start_date: goalData.start_date,  // ✅ ADD
        target_date: goalData.target_date,
        status: goalData.status,
        // ✅ ADD: Checkin settings
        is_checkin_enabled: goalData.is_checkin_enabled || false,
        checkin_frequency: goalData.checkin_frequency || 'daily',
        checkin_days_per_week: goalData.checkin_days_per_week || 7,
        checkin_target_days: goalData.checkin_target_days || null
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Update error:', updateError)
      throw updateError
    }

    console.log('✅ Goal updated:', data)
    await fetchGoals()
    return { success: true, data }
  } catch (err) {
    console.error('Error updating goal:', err)
    return { success: false, error: err.message }
  }
}

  const deleteGoal = async (id) => {
    try {
      const { error: deleteError } = await supabase
        .from('goals')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (deleteError) throw deleteError

      await fetchGoals()
      return { success: true }
    } catch (err) {
      console.error('Error deleting goal:', err)
      return { success: false, error: err.message }
    }
  }

  const completeGoal = async (id) => {
    try {
      const { data, error: updateError } = await supabase
        .from('goals')
        .update({
          status: 'completed',
          completed_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      await fetchGoals()
      return { success: true, data }
    } catch (err) {
      console.error('Error completing goal:', err)
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
    deleteGoal,
    completeGoal,
    refetch: fetchGoals
  }
}