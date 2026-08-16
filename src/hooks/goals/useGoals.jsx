import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { dependencySelectFragment, disableTaskDependency, isUnknownColumnError } from '../../lib/taskColumns'
import { computeGoalHealth, decorateTasks } from '../../utils/taskHealth'

/**
 * One batched query for the tasks of every goal, used to derive goal health
 * (overdue / blocked counts). Returns Map<goalId, decoratedTasks[]>.
 */
async function fetchTasksByGoal(goalIds) {
  if (goalIds.length === 0) return new Map()

  const runQuery = () =>
    supabase
      .from('tasks')
      .select(
        `id, goal_id, title, status, priority, start_date, due_date, scheduled_date${dependencySelectFragment()}`
      )
      .in('goal_id', goalIds)
      .is('deleted_at', null)

  let { data, error } = await runQuery()

  if (error && isUnknownColumnError(error)) {
    disableTaskDependency()
    ;({ data, error } = await runQuery())
  }

  if (error) {
    // Health is a nice-to-have; never block the goal list on it.
    console.error('Error fetching tasks for goal health:', error)
    return new Map()
  }

  // Decorate across all goals at once so dependency lookups always resolve.
  const decorated = decorateTasks(data || [])
  const byGoal = new Map()
  decorated.forEach((task) => {
    if (!byGoal.has(task.goal_id)) byGoal.set(task.goal_id, [])
    byGoal.get(task.goal_id).push(task)
  })
  return byGoal
}

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

      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (goalsError) throw goalsError

      // ✅ NEW: Calculate progress based on subtasks for each goal
      const goalsWithProgress = await Promise.all(
        goalsData.map(async (goal) => {
          const { data: progressData } = await supabase
            .rpc('calculate_goal_progress_by_subtasks', { goal_id_param: goal.id })
            .single()

          return {
            ...goal,
            total_subtasks: progressData?.total_subtasks || 0,
            completed_subtasks: progressData?.completed_subtasks || 0,
            progress: progressData?.progress || 0,
            // Keep task counts for reference
            total_tasks: goal.total_tasks || 0,
            completed_tasks: goal.completed_tasks || 0
          }
        })
      )

      // ✅ NEW: On Track / At Risk / Off Track status per goal
      const tasksByGoal = await fetchTasksByGoal(goalsWithProgress.map((g) => g.id))
      const goalsWithHealth = goalsWithProgress.map((goal) => {
        const goalTasks = tasksByGoal.get(goal.id) || []
        return {
          ...goal,
          tasks_summary: goalTasks,
          health: computeGoalHealth(goal, goalTasks),
        }
      })

      setGoals(goalsWithHealth)
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

      const insertPayload = {
        user_id: user.id,
        name: goalData.name,
        icon: goalData.icon,
        color: goalData.color,
        category: goalData.category,
        priority: goalData.priority || 'medium',
        start_date: goalData.start_date || null,
        target_date: goalData.target_date || null,
        end_date: goalData.end_date || null,
        assigned_to: goalData.assigned_to || [],
      }

      const { data, error: createError } = await supabase
        .from('goals')
        .insert([insertPayload])
        .select('*')
        .single()

      if (createError) throw createError

      await fetchGoals() // ✅ Refresh list
      return { success: true, data }
    } catch (err) {
      console.error('Error creating goal:', err)
      return { success: false, error: err.message }
    }
  }

  // ✅ ADD: updateGoal function
  const updateGoal = async (id, goalData) => {
    try {
      console.log('🔵 Updating goal:', id, goalData)

      const { data, error: updateError } = await supabase
        .from('goals')
        .update(goalData)
        .eq('id', id)
        .select('*')
        .single()

      if (updateError) throw updateError

      console.log('✅ Goal updated:', data)

      // ✅ CRITICAL: Immediately update local state, keeping derived fields
      // (progress from the RPC, task summary) and re-deriving health.
      setGoals(prevGoals =>
        prevGoals.map(g => {
          if (g.id !== id) return g
          const merged = {
            ...g,
            ...data,
            progress: Object.hasOwn(goalData, 'progress') ? data.progress : g.progress,
          }
          return { ...merged, health: computeGoalHealth(merged, g.tasks_summary || []) }
        })
      )

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

  useEffect(() => {
    fetchGoals()
  }, [])

  return {
    goals,
    loading,
    error,
    createGoal,
    updateGoal, // ✅ Export updateGoal
    deleteGoal,
    refetch: fetchGoals,
  }
}