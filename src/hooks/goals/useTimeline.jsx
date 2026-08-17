import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { dependencySelectFragment, disableTaskDependency, isUnknownColumnError } from '../../lib/taskColumns'
import { computeGoalHealth, decorateTasks, getTaskWindow, toLocalDate } from '../../utils/taskHealth'

/**
 * Goal → Task → Subtask data for the timeline / Gantt view.
 *
 * Loads everything in three flat queries and stitches the hierarchy client-side,
 * then annotates tasks (blocked / overdue / urgency) and goals (health).
 */
export function useTimeline({ includeTeam = true } = {}) {
  const [data, setData] = useState({ goals: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    let cancelled = false

    const fetchAll = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        const runTasksQuery = () =>
          supabase
            .from('tasks')
            .select(
              `id, goal_id, title, description, status, priority, start_date, due_date,
               scheduled_date, assigned_to, total_subtasks, completed_subtasks,
               is_calendar_visible${dependencySelectFragment()}`
            )
            .is('deleted_at', null)

        const [goalsResult, subtasksResult] = await Promise.all([
          supabase
            .from('goals')
            .select(
              'id, name, icon, color, status, priority, category, progress, start_date, target_date, end_date, assigned_to'
            )
            .is('deleted_at', null)
            .order('created_at', { ascending: false }),
          supabase
            .from('subtasks')
            .select('id, task_id, title, is_completed, scheduled_date, assigned_to, display_order')
            .is('deleted_at', null)
            .order('display_order', { ascending: true }),
        ])

        let tasksResult = await runTasksQuery()
        if (tasksResult.error && isUnknownColumnError(tasksResult.error)) {
          disableTaskDependency()
          tasksResult = await runTasksQuery()
        }

        if (goalsResult.error) throw goalsResult.error
        if (tasksResult.error) throw tasksResult.error
        if (subtasksResult.error) throw subtasksResult.error
        if (cancelled) return

        // Decorate across all goals at once so dependency lookups resolve even
        // when the prerequisite belongs to a task we would otherwise filter out.
        const allTasks = decorateTasks(tasksResult.data || [])

        const ownedBy = (row) =>
          Array.isArray(row.assigned_to) && row.assigned_to.includes(user.id)

        const visibleTasks = includeTeam ? allTasks : allTasks.filter(ownedBy)
        const visibleTaskIds = new Set(visibleTasks.map((t) => t.id))
        const visibleSubtasks = (subtasksResult.data || []).filter(
          (subtask) =>
            visibleTaskIds.has(subtask.task_id) && (includeTeam || ownedBy(subtask))
        )

        const subtasksByTask = new Map()
        visibleSubtasks.forEach((subtask) => {
          if (!subtasksByTask.has(subtask.task_id)) subtasksByTask.set(subtask.task_id, [])
          subtasksByTask.get(subtask.task_id).push(subtask)
        })

        const tasksByGoal = new Map()
        visibleTasks.forEach((task) => {
          if (!tasksByGoal.has(task.goal_id)) tasksByGoal.set(task.goal_id, [])
          tasksByGoal.get(task.goal_id).push({
            ...task,
            window: getTaskWindow(task),
            subtasks: (subtasksByTask.get(task.id) || []).map((subtask) => ({
              ...subtask,
              date: toLocalDate(subtask.scheduled_date),
            })),
          })
        })

        const goals = (goalsResult.data || []).map((goal) => {
          const goalTasks = tasksByGoal.get(goal.id) || []
          return {
            ...goal,
            tasks: goalTasks,
            health: computeGoalHealth(goal, goalTasks),
            window: computeGoalWindow(goal, goalTasks),
          }
        })

        if (!cancelled) setData({ goals })
      } catch (err) {
        if (cancelled) return
        console.error('Error loading timeline:', err)
        setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchAll()

    // Keep the timeline in sync with edits made from other screens (for
    // example GoalDetails or the calendar). A single event can update several
    // related rows, so debounce the reload to avoid issuing duplicate queries.
    let refreshTimer = null
    const scheduleRefresh = () => {
      if (cancelled || refreshTimer !== null) return

      refreshTimer = setTimeout(() => {
        refreshTimer = null
        fetchAll()
      }, 150)
    }

    const channel = supabase
      .channel(`goals-timeline-${includeTeam ? 'team' : 'personal'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'goals' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subtasks' }, scheduleRefresh)
      .subscribe()

    // Realtime may not be enabled for every table/environment. Refreshing when
    // the tab becomes active also covers updates made while the page was away.
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') scheduleRefresh()
    }
    const handleWindowFocus = () => scheduleRefresh()

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleWindowFocus)

    return () => {
      cancelled = true
      if (refreshTimer !== null) clearTimeout(refreshTimer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleWindowFocus)
      supabase.removeChannel(channel)
    }
  }, [includeTeam, refreshTrigger])

  const refetch = useCallback(() => setRefreshTrigger((n) => n + 1), [])

  /** Every distinct assignee id that appears on a visible task or subtask. */
  const ownerIds = useMemo(() => {
    const ids = new Set()
    data.goals.forEach((goal) => {
      ;(goal.assigned_to || []).forEach((id) => ids.add(id))
      goal.tasks.forEach((task) => {
        ;(task.assigned_to || []).forEach((id) => ids.add(id))
        task.subtasks.forEach((subtask) => (subtask.assigned_to || []).forEach((id) => ids.add(id)))
      })
    })
    return Array.from(ids)
  }, [data.goals])

  return { goals: data.goals, ownerIds, loading, error, refetch }
}

/**
 * A goal's timeline bar spans its own planned window plus every task inside it,
 * so the parent bar always covers the whole lifecycle.
 */
export function computeGoalWindow(goal, tasks = []) {
  const candidates = []

  const goalStart = toLocalDate(goal.start_date)
  const goalEnd = toLocalDate(goal.target_date) || toLocalDate(goal.end_date)
  if (goalStart) candidates.push(goalStart)
  if (goalEnd) candidates.push(goalEnd)

  tasks.forEach((task) => {
    const window = task.window || getTaskWindow(task)
    if (window) {
      candidates.push(window.start, window.end)
    }
    task.subtasks?.forEach((subtask) => {
      const date = subtask.date || toLocalDate(subtask.scheduled_date)
      if (date) candidates.push(date)
    })
  })

  if (candidates.length === 0) return null

  const times = candidates.map((date) => date.getTime())
  return {
    start: new Date(Math.min(...times)),
    end: new Date(Math.max(...times)),
    plannedEnd: goalEnd,
  }
}
