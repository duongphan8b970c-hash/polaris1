import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import {
  TASK_DEPENDENCY_COLUMN,
  dependencySelectFragment,
  disableTaskDependency,
  isTaskDependencySupported,
  isUnknownColumnError,
  stripDependencyField,
} from '../../lib/taskColumns'
import { decorateTasks } from '../../utils/taskHealth'

const buildSelect = () => `
          *,
          assigned_to,
          created_by,
          scheduled_date,
          recurrence_rule,
          is_calendar_visible${dependencySelectFragment()},
          goal:goals(
            id,
            name,
            icon,
            color
          ),
          subtasks(
            id,
            title,
            is_completed,
            scheduled_date,
            recurrence_rule,
            is_calendar_visible,
            assigned_to
          )
        `

export function useTasks(goalId = null, filters = {}) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTasks = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const runQuery = () => {
        let query = supabase
          .from('tasks')
          .select(buildSelect())
          .is('deleted_at', null)
          .order('created_at', { ascending: false })

        if (goalId) {
          query = query.eq('goal_id', goalId)
        }

        if (filters.status) {
          query = query.eq('status', filters.status)
        }

        if (filters.priority) {
          query = query.eq('priority', filters.priority)
        }

        if (filters.date_from) {
          query = query.gte('due_date', filters.date_from)
        }

        if (filters.date_to) {
          query = query.lte('due_date', filters.date_to)
        }

        return query
      }

      let { data, error: fetchError } = await runQuery()

      // The dependency column may not be migrated yet — retry without it once.
      if (fetchError && isUnknownColumnError(fetchError)) {
        disableTaskDependency()
        ;({ data, error: fetchError } = await runQuery())
      }

      if (fetchError) throw fetchError

      const tasksWithMetrics = (data || []).map(task => {
        const totalSubtasks = task.subtasks?.length || 0
        const completedSubtasks = task.subtasks?.filter(s => s.is_completed).length || 0
        const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0

        return {
          ...task,
          total_subtasks: totalSubtasks,
          completed_subtasks: completedSubtasks,
          progress: progress.toFixed(2),
        }
      })

      // Adds is_blocked / blocked_by / days_remaining / urgency_score.
      // Dependencies are scoped to the same goal, so the fetched set is a
      // complete index whenever `goalId` is set.
      setTasks(decorateTasks(tasksWithMetrics))
    } catch (err) {
      console.error('Error fetching tasks:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  /** Run a write, retrying without the dependency column if it is missing. */
  const writeWithDependencyFallback = async (run, payload) => {
    let result = await run(payload)
    if (result.error && isUnknownColumnError(result.error)) {
      disableTaskDependency()
      result = await run(stripDependencyField(payload))
    }
    return result
  }

  const createTask = async (taskData) => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        const insertPayload = {
          user_id: user.id,
          goal_id: taskData.goal_id,
          title: taskData.title,
          start_date: taskData.start_date || null,
          due_date: taskData.due_date || null,
          priority: taskData.priority || 'medium',
          status: 'todo',
          assigned_to: taskData.assigned_to || [],
          scheduled_date: taskData.scheduled_date || null,
          recurrence_rule: taskData.recurrence_rule || null,
          is_calendar_visible: taskData.is_calendar_visible || false
        }

        if (isTaskDependencySupported()) {
          insertPayload[TASK_DEPENDENCY_COLUMN] = taskData[TASK_DEPENDENCY_COLUMN] || null
        }

        const { data, error: createError } = await writeWithDependencyFallback(
          (payload) => supabase
            .from('tasks')
            .insert([payload])
            .select('*, assigned_to, created_by')
            .single(),
          insertPayload
        )

        if (createError) {
          console.error('❌ Create error:', createError)
          throw createError
        }

        await fetchTasks()
        return { success: true, data }
      } catch (err) {
        console.error('❌ Error creating task:', err)
        return { success: false, error: err.message }
      }
    }

  const updateTask = async (id, taskData) => {
      try {
        const updateData = {
          title: taskData.title,
          description: taskData.description,
          start_date: taskData.start_date,
          due_date: taskData.due_date,
          priority: taskData.priority,
          status: taskData.status,
          assigned_to: taskData.assigned_to || []
        }

        // ✅ ADD: Include new fields if provided
        if (Object.hasOwn(taskData, 'scheduled_date')) {
          updateData.scheduled_date = taskData.scheduled_date
        }
        if (Object.hasOwn(taskData, 'recurrence_rule')) {
          updateData.recurrence_rule = taskData.recurrence_rule
        }
        if (Object.hasOwn(taskData, 'is_calendar_visible')) {
          updateData.is_calendar_visible = taskData.is_calendar_visible
        }
        if (Object.hasOwn(taskData, TASK_DEPENDENCY_COLUMN) && isTaskDependencySupported()) {
          updateData[TASK_DEPENDENCY_COLUMN] = taskData[TASK_DEPENDENCY_COLUMN] || null
        }

        const { data, error: updateError } = await writeWithDependencyFallback(
          (payload) => supabase
            .from('tasks')
            .update(payload)
            .eq('id', id)
            .select('*, assigned_to, created_by')
            .single(),
          updateData
        )

        if (updateError) {
          console.error('❌ Update error:', updateError)
          throw updateError
        }

        await fetchTasks()
        return { success: true, data }
      } catch (err) {
        console.error('❌ Error updating task:', err)
        return { success: false, error: err.message }
      }
    }

  const deleteTask = async (id) => {
    try {
      const { error: deleteError } = await supabase
        .from('tasks')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (deleteError) throw deleteError

      await fetchTasks()
      return { success: true }
    } catch (err) {
      console.error('Error deleting task:', err)
      return { success: false, error: err.message }
    }
  }

  const toggleTaskStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'todo' : 'completed'
    try {
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', id)

      if (updateError) throw updateError

      await fetchTasks()
      return { success: true }
    } catch (err) {
      console.error('Error toggling task status:', err)
      return { success: false, error: err.message }
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [goalId, filters.status, filters.priority, filters.date_from, filters.date_to])

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    refetch: fetchTasks
  }
}
