import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { isRecurring, generateOccurrences } from '../../utils/recurrence'

/**
 * Hook to fetch calendar items (tasks & subtasks) for a date range
 * @param {Date} startDate - Start of date range
 * @param {Date} endDate - End of date range
 * @param {Object} options - { includeTeam: boolean }
 */
export function useCalendarItems(startDate, endDate, options = {}) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Memoize date key to prevent unnecessary re-fetches
  const dateKey = useMemo(() => {
    if (!startDate || !endDate) return ''
    return `${startDate.toISOString()}-${endDate.toISOString()}`
  }, [startDate, endDate])

  // Memoize options key
  const optionsKey = useMemo(() => {
    return JSON.stringify(options)
  }, [options])

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    const fetchCalendarItems = async () => {
      try {
        setLoading(true)
        setError(null)

        // ✅ FIXED: Use task_completions (not task_assignments)
        let tasksQuery = supabase
          .from('tasks')
          .select(`
            *,
            goal:goals (
              id,
              name,
              icon,
              color
            ),
            completions:task_completions (
              id,
              completed_by,
              completed_date,
              notes
            )
          `)
          .eq('is_calendar_visible', true)
          .is('deleted_at', null)

        // ✅ FIXED: Use subtask_completions (not subtask_assignments)
        let subtasksQuery = supabase
          .from('subtasks')
          .select(`
            *,
            task:tasks!inner (
              id,
              title,
              goal:goals (
                id,
                name,
                icon,
                color
              )
            ),
            completions:subtask_completions (
              id,
              completed_by,
              completed_date,
              notes
            )
          `)
          .eq('is_calendar_visible', true)
          .is('deleted_at', null)

        // Apply team filter if needed
        if (!options.includeTeam) {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            tasksQuery = tasksQuery.contains('assigned_to', [user.id])
            subtasksQuery = subtasksQuery.contains('assigned_to', [user.id])
          }
        }

        const [tasksResult, subtasksResult] = await Promise.all([
          tasksQuery,
          subtasksQuery
        ])

        if (tasksResult.error) throw tasksResult.error
        if (subtasksResult.error) throw subtasksResult.error

        const tasks = tasksResult.data || []
        const subtasks = subtasksResult.data || []

        console.log('✅ Tasks fetched:', tasks.length)
        console.log('✅ Subtasks fetched:', subtasks.length)

        // Generate calendar items
        const calendarItems = []

        // Process tasks
        tasks.forEach(task => {
          if (isRecurring(task)) {
            // Handle recurring tasks
            const occurrences = generateOccurrences(
              task.recurrence_rule,
              new Date(task.scheduled_date || startDate),
              endDate,
              365 // Max occurrences
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
            // Handle one-time or multi-day tasks
            const taskDate = new Date(task.scheduled_date)
            const duration = task.duration_days || 1
            
            // Generate entries for each day in duration
            for (let i = 0; i < duration; i++) {
              const currentDate = new Date(taskDate)
              currentDate.setDate(currentDate.getDate() + i)
              
              if (currentDate >= startDate && currentDate <= endDate) {
                calendarItems.push({
                  ...task,
                  type: 'task',
                  original_id: task.id,
                  instance_date: currentDate.toISOString().split('T')[0],
                  is_recurring: false,
                  duration_day: i + 1, // Which day of duration (1, 2, 3...)
                  total_duration: duration
                })
              }
            }
          }
        })

        // Process subtasks
        subtasks.forEach(subtask => {
          if (isRecurring(subtask)) {
            // Handle recurring subtasks
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
            // Handle one-time subtasks
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

        console.log('✅ Calendar items generated:', calendarItems.length)

        if (!cancelled) {
          setItems(calendarItems)
          setLoading(false)
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          return
        }
        if (!cancelled) {
          console.error('❌ Error fetching calendar items:', err)
          setError(err.message)
          setLoading(false)
        }
      }
    }

    if (startDate && endDate) {
      fetchCalendarItems()
    }

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [dateKey, optionsKey, refreshTrigger]) // ✅ Include refreshTrigger

  return {
    items,
    loading,
    error,
    refetch: () => {
      console.log('🔄 Refetch triggered')
      setRefreshTrigger(prev => prev + 1) // ✅ Increment to trigger re-fetch
    }
  }
}

/**
 * Hook to fetch calendar items for a specific date
 */
export function useCalendarItemsByDate(date, options = {}) {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  return useCalendarItems(startOfDay, endOfDay, options)
}

/**
 * Hook to fetch calendar items for a specific month
 */
export function useCalendarItemsForMonth(year, month, options = {}) {
  const startDate = new Date(year, month, 1)
  const endDate = new Date(year, month + 1, 0)

  return useCalendarItems(startDate, endDate, options)
}