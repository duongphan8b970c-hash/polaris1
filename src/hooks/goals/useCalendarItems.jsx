import { useState, useEffect, useCallback } from 'react' // ✅ ADD useCallback
import { supabase } from '../../lib/supabase'
import { generateOccurrences, isRecurring } from '../../utils/recurrence'

export function useCalendarItems(startDate, endDate, options = {}) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const { userId = null, includeTeam = true } = options

  // ✅ WRAP with useCallback to stabilize function reference
  const fetchCalendarItems = useCallback(async () => {
    // ✅ ADD AbortController to cancel previous requests
    const controller = new AbortController()

    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Fetch tasks
      let tasksQuery = supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          status,
          priority,
          scheduled_date,
          recurrence_rule,
          is_calendar_visible,
          assigned_to,
          goal_id,
          goal:goals(id, name, icon, color)
        `)
        .eq('is_calendar_visible', true)
        .is('deleted_at', null)
        .abortSignal(controller.signal) // ✅ ADD abort signal

      // Filter by user if specified
      if (userId) {
        tasksQuery = tasksQuery.contains('assigned_to', [userId])
      } else if (!includeTeam) {
        tasksQuery = tasksQuery.contains('assigned_to', [user.id])
      }

      const { data: tasks, error: tasksError } = await tasksQuery

      if (tasksError) throw tasksError

      // Fetch subtasks
      let subtasksQuery = supabase
        .from('subtasks')
        .select(`
          id,
          title,
          description,
          is_completed,
          scheduled_date,
          recurrence_rule,
          is_calendar_visible,
          assigned_to,
          task_id,
          task:tasks(
            id,
            title,
            goal_id,
            goal:goals(id, name, icon, color)
          )
        `)
        .eq('is_calendar_visible', true)
        .is('deleted_at', null)
        .abortSignal(controller.signal) // ✅ ADD abort signal

      // Filter by user if specified
      if (userId) {
        subtasksQuery = subtasksQuery.contains('assigned_to', [userId])
      } else if (!includeTeam) {
        subtasksQuery = subtasksQuery.contains('assigned_to', [user.id])
      }

      const { data: subtasks, error: subtasksError } = await subtasksQuery

      if (subtasksError) throw subtasksError

      // Process items and generate recurring instances
      const calendarItems = []

      // Process tasks
      (tasks || []).forEach(task => {
        if (isRecurring(task)) {
          const occurrences = generateOccurrences(
            task.recurrence_rule,
            new Date(task.scheduled_date || startDate),
            endDate,
            365
          )

          occurrences.forEach(date => {
            if (date >= startDate && date <= endDate) {
              calendarItems.push({
                ...task,
                type: 'task',
                original_id: task.id,
                instance_date: date.toISOString().split('T')[0],
                is_recurring: true
              })
            }
          })
        } else if (task.scheduled_date) {
          const taskDate = new Date(task.scheduled_date)
          if (taskDate >= startDate && taskDate <= endDate) {
            calendarItems.push({
              ...task,
              type: 'task',
              original_id: task.id,
              instance_date: task.scheduled_date,
              is_recurring: false
            })
          }
        }
      })

      // Process subtasks
      (subtasks || []).forEach(subtask => {
        if (isRecurring(subtask)) {
          const occurrences = generateOccurrences(
            subtask.recurrence_rule,
            new Date(subtask.scheduled_date || startDate),
            endDate,
            365
          )

          occurrences.forEach(date => {
            if (date >= startDate && date <= endDate) {
              calendarItems.push({
                ...subtask,
                type: 'subtask',
                original_id: subtask.id,
                instance_date: date.toISOString().split('T')[0],
                is_recurring: true,
                goal: subtask.task?.goal
              })
            }
          })
        } else if (subtask.scheduled_date) {
          const subtaskDate = new Date(subtask.scheduled_date)
          if (subtaskDate >= startDate && subtaskDate <= endDate) {
            calendarItems.push({
              ...subtask,
              type: 'subtask',
              original_id: subtask.id,
              instance_date: subtask.scheduled_date,
              is_recurring: false,
              goal: subtask.task?.goal
            })
          }
        }
      })

      // Sort by date
      calendarItems.sort((a, b) => 
        new Date(a.instance_date) - new Date(b.instance_date)
      )

      setItems(calendarItems)
    } catch (err) {
      // ✅ Ignore abort errors
      if (err.name === 'AbortError') {
        console.log('Request cancelled')
        return
      }
      console.error('Error fetching calendar items:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }

    // ✅ Cleanup function
    return () => controller.abort()
  }, [startDate, endDate, userId, includeTeam]) // ✅ ADD all dependencies

  useEffect(() => {
    if (startDate && endDate) {
      const cleanup = fetchCalendarItems()
      return cleanup // ✅ Return cleanup function
    }
  }, [fetchCalendarItems, startDate, endDate])

  return {
    items,
    loading,
    error,
    refetch: fetchCalendarItems
  }
}

// Keep other exports unchanged...
export function useCalendarItemsByDate(date, options = {}) {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  return useCalendarItems(startOfDay, endOfDay, options)
}

export function useCalendarItemsForMonth(year, month, options = {}) {
  const startDate = new Date(year, month, 1)
  const endDate = new Date(year, month + 1, 0)

  return useCalendarItems(startDate, endDate, options)
}