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

      // ✅ BỎ query goal_categories
      const { data, error: fetchError } = await supabase
        .from('goals')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      // Calculate metrics for each goal
      const goalsWithMetrics = await Promise.all(
        (data || []).map(async (goal) => {
          // ✅ Count projects
          const { data: projectsData } = await supabase
            .from('projects')
            .select('id, status')
            .eq('goal_id', goal.id)
            .is('deleted_at', null)

          // ✅ Get all tasks for this goal through projects
          const { data: tasksData } = await supabase
            .from('tasks')
            .select(`
              id,
              status,
              projects!inner(goal_id)
            `)
            .eq('projects.goal_id', goal.id)
            .is('deleted_at', null)

          const totalTasks = tasksData?.length || 0
          const completedTasks = tasksData?.filter(t => t.status === 'completed').length || 0
          const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

          return {
            ...goal,
            total_tasks: totalTasks,
            completed_tasks: completedTasks,
            progress: progress.toFixed(2),
            projects_count: projectsData?.length || 0
          }
        })
      )

      setGoals(goalsWithMetrics)
    } catch (err) {
      console.error('Error fetching goals:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createGoal = async (goalData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error: createError } = await supabase
        .from('goals')
        .insert([{
          user_id: user.id,
          name: goalData.name,
          description: goalData.description,
          icon: goalData.icon || '🎯',
          color: goalData.color || '#3B82F6',
          start_date: goalData.start_date,
          target_date: goalData.target_date,
          status: 'active'
        }])
        .select()
        .single()

      if (createError) throw createError

      await fetchGoals()
      return { success: true, data }
    } catch (err) {
      console.error('Error creating goal:', err)
      return { success: false, error: err.message }
    }
  }

  const updateGoal = async (id, goalData) => {
    try {
      const { data, error: updateError } = await supabase
        .from('goals')
        .update({
          name: goalData.name,
          description: goalData.description,
          icon: goalData.icon,
          color: goalData.color,
          target_date: goalData.target_date,
          status: goalData.status
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

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