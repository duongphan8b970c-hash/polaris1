import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTimeline } from '../../hooks/goals/useTimeline'
import { useUsers } from '../../hooks/useUsers'
import TimelineChart from '../../components/timeline/TimelineChart'
import TimelineToolbar from '../../components/timeline/TimelineToolbar'
import PageHeader from '../../components/layout/PageHeader'
import Loading from '../../components/common/Loading'
import ErrorMessage from '../../components/common/ErrorMessage'
import GoalHealthBadge from '../../components/common/GoalHealthBadge'
import {
  GOAL_HEALTH_ORDER,
  PRIORITY_WEIGHT,
  addDays,
  getTaskDeadline,
  getTaskUrgencyScore,
  toLocalDate,
} from '../../utils/taskHealth'

const DEFAULT_FILTERS = {
  goalId: 'all',
  priority: 'all',
  status: 'all',
  ownerId: 'all',
  health: 'all',
  range: 'quarter',
}

/** Visible date window for a range preset, padded so bars are not flush to the edge. */
function resolveRange(preset, goals, today) {
  if (preset !== 'all') {
    const monthsByPreset = { month: 1, quarter: 3, half: 6 }
    const months = monthsByPreset[preset] ?? 3
    const start = new Date(today.getFullYear(), today.getMonth(), 1)
    const end = new Date(today.getFullYear(), today.getMonth() + months, 0)
    return { start, end }
  }

  const times = []
  goals.forEach((goal) => {
    if (goal.window) times.push(goal.window.start.getTime(), goal.window.end.getTime())
  })

  if (times.length === 0) {
    return { start: addDays(today, -14), end: addDays(today, 45) }
  }

  return {
    start: addDays(new Date(Math.min(...times)), -3),
    end: addDays(new Date(Math.max(...times)), 3),
  }
}

function matchesOwner(item, ownerId) {
  if (ownerId === 'all') return true
  const assigned = Array.isArray(item.assigned_to) ? item.assigned_to : []
  if (ownerId === 'unassigned') return assigned.length === 0
  return assigned.includes(ownerId)
}

function matchesStatus(task, status) {
  switch (status) {
    case 'all':
      return true
    case 'open':
      return task.status !== 'completed'
    case 'overdue':
      return !!task.is_overdue
    case 'blocked':
      return task.is_blocked || task.status === 'blocked'
    default:
      return task.status === status
  }
}

function compareTasks(a, b, sort) {
  switch (sort) {
    case 'start': {
      const aStart = a.window?.start?.getTime() ?? Infinity
      const bStart = b.window?.start?.getTime() ?? Infinity
      return aStart - bStart
    }
    case 'due': {
      const aDue = toLocalDate(getTaskDeadline(a))?.getTime() ?? Infinity
      const bDue = toLocalDate(getTaskDeadline(b))?.getTime() ?? Infinity
      return aDue - bDue
    }
    case 'priority':
      return (PRIORITY_WEIGHT[b.priority] ?? 2) - (PRIORITY_WEIGHT[a.priority] ?? 2)
    case 'title':
      return (a.title || '').localeCompare(b.title || '', 'vi')
    case 'urgency':
    default:
      return getTaskUrgencyScore(b) - getTaskUrgencyScore(a)
  }
}

function compareGoals(a, b, sort) {
  switch (sort) {
    case 'start': {
      const aStart = a.window?.start?.getTime() ?? Infinity
      const bStart = b.window?.start?.getTime() ?? Infinity
      return aStart - bStart
    }
    case 'due': {
      const aDue = toLocalDate(a.target_date)?.getTime() ?? Infinity
      const bDue = toLocalDate(b.target_date)?.getTime() ?? Infinity
      return aDue - bDue
    }
    case 'priority':
      return (PRIORITY_WEIGHT[b.priority] ?? 2) - (PRIORITY_WEIGHT[a.priority] ?? 2)
    case 'name':
      return (a.name || '').localeCompare(b.name || '', 'vi')
    case 'health':
    default:
      return GOAL_HEALTH_ORDER.indexOf(a.health.key) - GOAL_HEALTH_ORDER.indexOf(b.health.key)
  }
}

export default function GoalsTimeline() {
  const navigate = useNavigate()
  const today = useMemo(() => new Date(), [])

  const [viewMode, setViewMode] = useState('team')
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [sort, setSort] = useState('urgency')
  const [goalSort, setGoalSort] = useState('health')
  const [zoom, setZoom] = useState('week')
  const [collapsedGoals, setCollapsedGoals] = useState(() => new Set())
  const [showSubtasks, setShowSubtasks] = useState(true)

  const { goals, ownerIds, loading, error } = useTimeline({ includeTeam: viewMode === 'team' })
  const { users } = useUsers()

  const owners = useMemo(
    () => users.filter((user) => ownerIds.includes(user.id)),
    [users, ownerIds]
  )

  const range = useMemo(() => resolveRange(filters.range, goals, today), [filters.range, goals, today])

  /** Filter + sort, then flatten into the row list the chart renders. */
  const { rows, counts } = useMemo(() => {
    const rangeStartTime = range.start.getTime()
    const rangeEndTime = range.end.getTime()

    const visibleGoals = goals
      .filter((goal) => filters.goalId === 'all' || goal.id === filters.goalId)
      .filter((goal) => filters.health === 'all' || goal.health.key === filters.health)
      .map((goal) => {
        const tasks = goal.tasks
          .filter((task) => filters.priority === 'all' || task.priority === filters.priority)
          .filter((task) => matchesStatus(task, filters.status))
          .filter((task) => matchesOwner(task, filters.ownerId))

        // Only dated tasks can be placed on a time axis.
        const datedTasks = tasks.filter((task) => task.window)
        const inRange = datedTasks.filter(
          (task) =>
            task.window.end.getTime() >= rangeStartTime && task.window.start.getTime() <= rangeEndTime
        )

        return {
          ...goal,
          visibleTasks: [...inRange].sort((a, b) => compareTasks(a, b, sort)),
          undatedCount: tasks.length - datedTasks.length,
        }
      })
      // Hide goals that have nothing to draw in this window.
      .filter((goal) => goal.visibleTasks.length > 0 || filters.goalId === goal.id)
      .sort((a, b) => compareGoals(a, b, goalSort))

    const flattened = []
    let taskCount = 0
    let subtaskCount = 0
    let undated = 0

    visibleGoals.forEach((goal) => {
      const expanded = !collapsedGoals.has(goal.id)
      undated += goal.undatedCount

      flattened.push({
        key: `goal-${goal.id}`,
        kind: 'goal',
        depth: 0,
        goal,
        goalColor: goal.color,
        expanded,
      })

      if (!expanded) return

      goal.visibleTasks.forEach((task) => {
        taskCount += 1
        flattened.push({
          key: `task-${task.id}`,
          kind: 'task',
          depth: 1,
          task,
          goal,
          goalColor: goal.color,
        })

        if (!showSubtasks) return

        task.subtasks
          .filter((subtask) => subtask.date)
          .filter((subtask) => matchesOwner(subtask, filters.ownerId))
          .filter(
            (subtask) =>
              subtask.date.getTime() >= rangeStartTime && subtask.date.getTime() <= rangeEndTime
          )
          .sort((a, b) => a.date - b.date)
          .forEach((subtask) => {
            subtaskCount += 1
            flattened.push({
              key: `subtask-${subtask.id}`,
              kind: 'subtask',
              depth: 2,
              subtask,
              task,
              goal,
              goalColor: goal.color,
            })
          })
      })
    })

    return {
      rows: flattened,
      counts: {
        goals: visibleGoals.length,
        tasks: taskCount,
        subtasks: subtaskCount,
        undated,
      },
    }
  }, [goals, filters, sort, goalSort, collapsedGoals, showSubtasks, range])

  const riskyGoals = useMemo(
    () => goals.filter((goal) => goal.health.key === 'off_track' || goal.health.key === 'at_risk'),
    [goals]
  )

  const toggleGoal = (goalId) => {
    setCollapsedGoals((prev) => {
      const next = new Set(prev)
      if (next.has(goalId)) next.delete(goalId)
      else next.add(goalId)
      return next
    })
  }

  if (loading) return <Loading message="Đang tải timeline..." />
  if (error) return <ErrorMessage message={error} />

  return (
    <div className="space-y-4">
      <PageHeader
        title="Timeline"
        action={
          <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('personal')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'personal' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                👤 Cá nhân
              </button>
              <button
                onClick={() => setViewMode('team')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'team' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                👥 Team
              </button>
            </div>
            <label className="flex items-center gap-1.5 text-sm text-gray-600 whitespace-nowrap">
              <input
                type="checkbox"
                checked={showSubtasks}
                onChange={(event) => setShowSubtasks(event.target.checked)}
                className="w-4 h-4 rounded text-blue-600"
              />
              Subtask
            </label>
          </div>
        }
      />

      {/* Goals that need attention */}
      {riskyGoals.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-amber-200 p-3">
          <p className="text-xs font-semibold text-gray-700 mb-2">⚠️ Mục tiêu cần chú ý</p>
          <div className="flex flex-wrap gap-2">
            {riskyGoals.map((goal) => (
              <button
                key={goal.id}
                onClick={() => navigate(`/goals/${goal.id}`)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <span>{goal.icon}</span>
                <span className="text-xs font-medium text-gray-800 max-w-[160px] truncate">{goal.name}</span>
                <GoalHealthBadge health={goal.health} />
              </button>
            ))}
          </div>
        </div>
      )}

      <TimelineToolbar
        filters={filters}
        onFiltersChange={setFilters}
        sort={sort}
        onSortChange={setSort}
        goalSort={goalSort}
        onGoalSortChange={setGoalSort}
        zoom={zoom}
        onZoomChange={setZoom}
        goals={goals}
        owners={owners}
        visibleCounts={counts}
      />

      <TimelineChart
        rows={rows}
        scale={range}
        zoom={zoom}
        today={today}
        onToggleGoal={toggleGoal}
        onSelectTask={(task) => navigate(`/goals/${task.goal_id}/tasks/${task.id}`)}
      />
    </div>
  )
}
