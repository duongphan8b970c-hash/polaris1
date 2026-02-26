import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { generateOccurrences, isRecurring } from '../../utils/recurrence'

/**
 * Hook to fetch calendar items (tasks + subtasks) with recurring support
 * @param {Date} startDate - Start of date range
 * @param {Date} endDate - End of date range
 * @param {Object} options - { userId: null, includeTeam: true }
 */
export function useCalendarItems(startDate, endDate, options = {}) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const { userId = null, includeTeam = true } = options

  const fetchCalendarItems = async () => {
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
      tasks.forEach(task => {
        if (isRecurring(task)) {
          // Generate occurrences for date range
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
          // Single occurrence
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
      subtasks.forEach(subtask => {
        if (isRecurring(subtask)) {
          // Generate occurrences
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
          // Single occurrence
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
      console.error('Error fetching calendar items:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (startDate && endDate) {
      fetchCalendarItems()
    }
  }, [startDate, endDate, userId, includeTeam])

  return {
    items,
    loading,
    error,
    refetch: fetchCalendarItems
  }
}

/**
 * Hook to get items for a specific date
 */
export function useCalendarItemsByDate(date, options = {}) {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  return useCalendarItems(startOfDay, endOfDay, options)
}

/**
 * Hook to get items for current month
 */
export function useCalendarItemsForMonth(year, month, options = {}) {
  const startDate = new Date(year, month, 1)
  const endDate = new Date(year, month + 1, 0)

  return useCalendarItems(startDate, endDate, options)
}