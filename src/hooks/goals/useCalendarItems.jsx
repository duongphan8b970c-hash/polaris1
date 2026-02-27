import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { isRecurring, generateOccurrences } from '../../utils/recurrence'

export function useCalendarItems(startDate, endDate, options = {}) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0) // ✅ ADD: Refresh trigger

  // Memoize date key
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

        // Build query
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
            assigned_users:task_completions (
              user:users (
                id,
                display_name,
                email,
                avatar_url
              )
            )
          `)
          .eq('is_calendar_visible', true)
          .is('deleted_at', null)

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
            assigned_users:subtask_completions (
              user:users (
                id,
                display_name,
                email,
                avatar_url
              )
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

        // Generate calendar items
        const calendarItems = []

        // Process tasks
        tasks.forEach(task => {
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
            const duration = task.duration_days || 1
            
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
                  duration_day: i + 1,
                  total_duration: duration
                })
              }
            }
          }
        })

        // Process subtasks
        subtasks.forEach(subtask => {
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

        if (!cancelled) {
          setItems(calendarItems)
          setLoading(false)
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          return
        }
        if (!cancelled) {
          console.error('Error fetching calendar items:', err)
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
  }, [dateKey, optionsKey, refreshTrigger]) // ✅ ADD: refreshTrigger dependency

  return {
    items,
    loading,
    error,
    refetch: () => {
      console.log('🔄 Refetch triggered')
      setRefreshTrigger(prev => prev + 1) // ✅ FIX: Increment trigger to re-run useEffect
    }
  }
}

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