import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { generateOccurrences, isRecurring } from '../../utils/recurrence'
import { parseDateString, formatDateString, normalizeToMidnight } from '../../utils/dateUtils'

export function useCalendarItems(startDate, endDate, options = {}) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0) // ⭐ ADD: Trigger để force re-fetch

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

        // ✅ Normalize date range
        const rangeStart = normalizeToMidnight(startDate)
        const rangeEnd = normalizeToMidnight(endDate)
        rangeEnd.setHours(23, 59, 59, 999)

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
            goal:goals!goal_id(id, name, icon, color)
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
            task:tasks!task_id(
              id,
              title,
              goal_id,
              goal:goals!goal_id(id, name, icon, color)
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

        const calendarItems = []

        // Process tasks
        ;(tasks || []).forEach(task => {
          if (isRecurring(task)) {
            const taskStartDate = parseDateString(task.scheduled_date) || rangeStart
            const occurrences = generateOccurrences(
              task.recurrence_rule,
              taskStartDate,
              rangeEnd
            ).filter(d => d >= rangeStart)

            occurrences.forEach(occDate => {
              calendarItems.push({
                ...task,
                type: 'task',
                original_id: task.id,
                instance_date: formatDateString(occDate),
                is_recurring_instance: true
              })
            })
          } else if (task.scheduled_date) {
            const taskDate = parseDateString(task.scheduled_date)
            if (taskDate && taskDate >= rangeStart && taskDate <= rangeEnd) {
              calendarItems.push({
                ...task,
                type: 'task',
                original_id: task.id,
                instance_date: formatDateString(taskDate),
                is_recurring_instance: false
              })
            }
          }
        })

        // Process subtasks
        ;(subtasks || []).forEach(subtask => {
          if (isRecurring(subtask)) {
            const subtaskStartDate = parseDateString(subtask.scheduled_date) || rangeStart
            const occurrences = generateOccurrences(
              subtask.recurrence_rule,
              subtaskStartDate,
              rangeEnd
            ).filter(d => d >= rangeStart)

            occurrences.forEach(occDate => {
              calendarItems.push({
                ...subtask,
                type: 'subtask',
                original_id: subtask.id,
                instance_date: formatDateString(occDate),
                is_recurring_instance: true,
                goal: subtask.task?.goal || null
              })
            })
          } else if (subtask.scheduled_date) {
            const subtaskDate = parseDateString(subtask.scheduled_date)
            if (subtaskDate && subtaskDate >= rangeStart && subtaskDate <= rangeEnd) {
              calendarItems.push({
                ...subtask,
                type: 'subtask',
                original_id: subtask.id,
                instance_date: formatDateString(subtaskDate),
                is_recurring_instance: false,
                goal: subtask.task?.goal || null
              })
            }
          }
        })

        calendarItems.sort((a, b) => 
          new Date(a.instance_date) - new Date(b.instance_date)
        )

        if (!cancelled) {
          setItems(calendarItems)
          setLoading(false)
        }
      } catch (err) {
        if (err.name === 'AbortError') return
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
  }, [dateKey, optionsKey, refreshTrigger]) // ⭐ ADD: refreshTrigger vào dependencies

  // ✅ FIX: refetch function trigger lại useEffect
  const refetch = useCallback(() => {
    console.log('🔄 Manual refetch triggered')
    setRefreshTrigger(prev => prev + 1) // Increment trigger để useEffect chạy lại
  }, [])

  return {
    items,
    loading,
    error,
    refetch
  }
}

export function useCalendarItemsByDate(date, options = {}) {
  const startOfDay = normalizeToMidnight(date)
  const endOfDay = new Date(startOfDay)
  endOfDay.setHours(23, 59, 59, 999)

  return useCalendarItems(startOfDay, endOfDay, options)
}

export function useCalendarItemsForMonth(year, month, options = {}) {
  const startDate = new Date(year, month, 1, 0, 0, 0, 0)
  const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999)

  return useCalendarItems(startDate, endDate, options)
}