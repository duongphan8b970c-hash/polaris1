import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { generateOccurrences, isRecurring } from '../../utils/recurrence'

/**
 * Normalize date to midnight in local timezone
 */
function normalizeDate(dateInput) {
  const date = new Date(dateInput)
  date.setHours(0, 0, 0, 0)
  return date
}

/**
 * Convert YYYY-MM-DD string to local midnight date
 */
function dateStringToLocal(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Hook to fetch calendar items (tasks + subtasks) with recurring support
 */
export function useCalendarItems(startDate, endDate, options = {}) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const { userId = null, includeTeam = true } = options
  const optionsKey = useMemo(() => 
    JSON.stringify({ userId, includeTeam }), 
    [userId, includeTeam]
  )

  const dateKey = useMemo(() => 
    `${startDate?.getTime()}-${endDate?.getTime()}`,
    [startDate, endDate]
  )

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    const fetchCalendarItems = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user || cancelled) return

        // ✅ Normalize date range to local midnight
        const normalizedStart = normalizeDate(startDate)
        const normalizedEnd = normalizeDate(endDate)
        normalizedEnd.setHours(23, 59, 59, 999) // Include full end day

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
            duration_days,
            goal:goals(id, name, icon, color)
          `)
          .eq('is_calendar_visible', true)
          .is('deleted_at', null)
          .abortSignal(controller.signal)

        if (userId) {
          tasksQuery = tasksQuery.contains('assigned_to', [userId])
        } else if (!includeTeam) {
          tasksQuery = tasksQuery.contains('assigned_to', [user.id])
        }

        const { data: tasks, error: tasksError } = await tasksQuery
        if (tasksError || cancelled) {
          if (tasksError) throw tasksError
          return
        }

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
          .abortSignal(controller.signal)

        if (userId) {
          subtasksQuery = subtasksQuery.contains('assigned_to', [userId])
        } else if (!includeTeam) {
          subtasksQuery = subtasksQuery.contains('assigned_to', [user.id])
        }

        const { data: subtasks, error: subtasksError } = await subtasksQuery
        if (subtasksError || cancelled) {
          if (subtasksError) throw subtasksError
          return
        }

        // Process items
        const calendarItems = []

        // ✅ Process tasks with timezone fix
        ;(tasks || []).forEach(task => {
          if (isRecurring(task)) {
            const occurrences = generateOccurrences(
              task.recurrence_rule,
              dateStringToLocal(task.scheduled_date || normalizedStart),
              normalizedEnd,
              365
            )

            occurrences.forEach(date => {
              const normalizedOccurrence = normalizeDate(date)
              if (normalizedOccurrence >= normalizedStart && normalizedOccurrence <= normalizedEnd) {
                calendarItems.push({
                  ...task,
                  type: 'task',
                  original_id: task.id,
                  instance_date: normalizedOccurrence.toISOString().split('T')[0],
                  is_recurring: true
                })
              }
            })
          } else if (task.scheduled_date) {
            // ✅ FIX: Parse date string correctly
            const taskDate = dateStringToLocal(task.scheduled_date)
            const duration = task.duration_days || 1
            
            for (let i = 0; i < duration; i++) {
              const currentDate = new Date(taskDate)
              currentDate.setDate(currentDate.getDate() + i)
              const normalizedCurrent = normalizeDate(currentDate)
              
              if (normalizedCurrent >= normalizedStart && normalizedCurrent <= normalizedEnd) {
                calendarItems.push({
                  ...task,
                  type: 'task',
                  original_id: task.id,
                  instance_date: normalizedCurrent.toISOString().split('T')[0],
                  is_recurring: false,
                  duration_day: i + 1,
                  total_duration: duration
                })
              }
            }
          }
        })

        // ✅ Process subtasks with timezone fix
        ;(subtasks || []).forEach(subtask => {
          if (isRecurring(subtask)) {
            const occurrences = generateOccurrences(
              subtask.recurrence_rule,
              dateStringToLocal(subtask.scheduled_date || normalizedStart),
              normalizedEnd,
              365
            )

            occurrences.forEach(date => {
              const normalizedOccurrence = normalizeDate(date)
              if (normalizedOccurrence >= normalizedStart && normalizedOccurrence <= normalizedEnd) {
                calendarItems.push({
                  ...subtask,
                  type: 'subtask',
                  original_id: subtask.id,
                  instance_date: normalizedOccurrence.toISOString().split('T')[0],
                  is_recurring: true,
                  goal: subtask.task?.goal
                })
              }
            })
          } else if (subtask.scheduled_date) {
            // ✅ FIX: Parse date string correctly
            const subtaskDate = dateStringToLocal(subtask.scheduled_date)
            const normalizedSubtask = normalizeDate(subtaskDate)
            
            if (normalizedSubtask >= normalizedStart && normalizedSubtask <= normalizedEnd) {
              calendarItems.push({
                ...subtask,
                type: 'subtask',
                original_id: subtask.id,
                instance_date: normalizedSubtask.toISOString().split('T')[0],
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
  }, [dateKey, optionsKey])

  return {
    items,
    loading,
    error,
    refetch: () => {
      setLoading(true)
      setError(null)
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
  // ✅ Create dates in local timezone
  const startDate = new Date(year, month, 1)
  startDate.setHours(0, 0, 0, 0)
  
  const endDate = new Date(year, month + 1, 0)
  endDate.setHours(23, 59, 59, 999)

  return useCalendarItems(startDate, endDate, options)
}