import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

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

      let query = supabase
      .from('tasks')
      .select(`
        *,
        assigned_to,
        created_by,
        goal:goals(
          id,
          name,
          icon,
          color
        ),
        subtasks(
          id,
          title,
          is_completed
        )
      `)
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

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      const tasksWithMetrics = (data || []).map(task => {
        const totalSubtasks = task.subtasks?.length || 0
        const completedSubtasks = task.subtasks?.filter(s => s.is_completed).length || 0
        const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0

        const isOverdue = task.due_date && 
                         task.status !== 'completed' && 
                         new Date(task.due_date) < new Date()

        return {
          ...task,
          total_subtasks: totalSubtasks,
          completed_subtasks: completedSubtasks,
          progress: progress.toFixed(2),
          is_overdue: isOverdue
        }
      })

      setTasks(tasksWithMetrics)
    } catch (err) {
      console.error('Error fetching tasks:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createTask = async (taskData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error: createError } = await supabase
        .from('tasks')
        .insert([{
          user_id: user.id,
          goal_id: taskData.goal_id,
          title: taskData.title,
          description: taskData.description,
          start_date: taskData.start_date || null,
          due_date: taskData.due_date || null,
          priority: taskData.priority || 'medium',
          status: 'todo',
          tags: taskData.tags || [],
          estimated_hours: taskData.estimated_hours ? parseFloat(taskData.estimated_hours) : null
        }])
        .select()
        .single()

      if (createError) throw createError

      await fetchTasks()
      return { success: true, data }
    } catch (err) {
      console.error('Error creating task:', err)
      return { success: false, error: err.message }
    }
  }

  const updateTask = async (id, taskData) => {
    try {
      const updateData = {
        title: taskData.title,
        description: taskData.description,
        due_date: taskData.due_date || null,
        priority: taskData.priority,
        status: taskData.status,
        tags: taskData.tags
      }

      if (taskData.status === 'completed' && !taskData.completed_date) {
        updateData.completed_date = new Date().toISOString().split('T')[0]
      }

      const { data, error: updateError } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      await fetchTasks()
      return { success: true, data }
    } catch (err) {
      console.error('Error updating task:', err)
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
    return updateTask(id, { status: newStatus })
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