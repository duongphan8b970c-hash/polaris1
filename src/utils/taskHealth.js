/**
 * Goal health, task urgency & deadline helpers.
 *
 * Everything here is a pure function over plain goal/task objects so the same
 * logic can drive the goal list, the timeline and the calendar.
 */

import { parseDateString, normalizeToMidnight } from './dateUtils'

const MS_PER_DAY = 24 * 60 * 60 * 1000

/** Tasks/goals due within this many days count as "sắp đến hạn". */
export const DUE_SOON_THRESHOLD_DAYS = 3

/** Higher = more important. Extra levels are tolerated, unknown falls back to medium. */
export const PRIORITY_WEIGHT = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
}

export const PRIORITY_META = {
  urgent: { label: 'Khẩn cấp', short: 'Khẩn', icon: '🔴', bg: 'bg-red-100', text: 'text-red-700', bar: 'bg-red-500' },
  high: { label: 'Cao', short: 'Cao', icon: '🟠', bg: 'bg-orange-100', text: 'text-orange-700', bar: 'bg-orange-500' },
  medium: { label: 'Trung bình', short: 'TB', icon: '🟡', bg: 'bg-yellow-100', text: 'text-yellow-700', bar: 'bg-yellow-500' },
  low: { label: 'Thấp', short: 'Thấp', icon: '🔵', bg: 'bg-blue-100', text: 'text-blue-700', bar: 'bg-blue-500' },
}

/**
 * Parse anything date-ish (Date, `YYYY-MM-DD`, ISO timestamp) into a local
 * midnight Date. Returns null when there is nothing usable.
 */
export function toLocalDate(value) {
  if (!value) return null
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : normalizeToMidnight(value)
  }
  if (typeof value === 'string') {
    const parsed = parseDateString(value.slice(0, 10))
    return parsed && !Number.isNaN(parsed.getTime()) ? parsed : null
  }
  return null
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function diffInDays(from, to) {
  const a = toLocalDate(from)
  const b = toLocalDate(to)
  if (!a || !b) return null
  return Math.round((b - a) / MS_PER_DAY)
}

export function addDays(date, days) {
  const base = toLocalDate(date) || normalizeToMidnight(new Date())
  const next = new Date(base)
  next.setDate(next.getDate() + days)
  return next
}

/**
 * Days left until `dueDate`. Negative = overdue, 0 = due today, null = no date.
 */
export function getDaysRemaining(dueDate, today = new Date()) {
  return diffInDays(today, dueDate)
}

export const DUE_TONE_CLASSES = {
  overdue: 'bg-red-100 text-red-700 border border-red-200',
  today: 'bg-orange-100 text-orange-700 border border-orange-200',
  soon: 'bg-amber-50 text-amber-700 border border-amber-200',
  normal: 'bg-gray-100 text-gray-700 border border-gray-200',
  done: 'bg-gray-50 text-gray-500 border border-gray-200',
  none: 'bg-transparent text-gray-400',
}

/**
 * Human readable "3 days left / due today / 2 days overdue" descriptor.
 *
 * @returns {{days: number|null, tone: string, label: string, shortLabel: string, isOverdue: boolean, isDueSoon: boolean}}
 */
export function getDueStatus(dueDate, { isCompleted = false, today } = {}) {
  const days = getDaysRemaining(dueDate, today)

  if (days === null) {
    return { days: null, tone: 'none', label: 'Chưa có hạn', shortLabel: '—', isOverdue: false, isDueSoon: false }
  }

  if (isCompleted) {
    return { days, tone: 'done', label: 'Đã hoàn thành', shortLabel: '✓ Xong', isOverdue: false, isDueSoon: false }
  }

  if (days < 0) {
    const late = Math.abs(days)
    return {
      days,
      tone: 'overdue',
      label: `Quá hạn ${late} ngày`,
      shortLabel: `Quá ${late} ngày`,
      isOverdue: true,
      isDueSoon: false,
    }
  }

  if (days === 0) {
    return { days, tone: 'today', label: 'Đến hạn hôm nay', shortLabel: 'Hôm nay', isOverdue: false, isDueSoon: true }
  }

  const isDueSoon = days <= DUE_SOON_THRESHOLD_DAYS
  return {
    days,
    tone: isDueSoon ? 'soon' : 'normal',
    label: `Còn ${days} ngày`,
    shortLabel: `${days} ngày`,
    isOverdue: false,
    isDueSoon,
  }
}

/** The date a task should be judged against: explicit due date, else its scheduled day. */
export function getTaskDeadline(task) {
  return task?.due_date || task?.scheduled_date || null
}

/** Best-effort start/end window for a task, used by the timeline. */
export function getTaskWindow(task) {
  const start = toLocalDate(task?.start_date) || toLocalDate(task?.scheduled_date) || toLocalDate(task?.due_date)
  const end = toLocalDate(task?.due_date) || toLocalDate(task?.scheduled_date) || start
  if (!start || !end) return null
  return end < start ? { start: end, end: start } : { start, end }
}

/**
 * Resolve a task's Blocked / Waiting state from its prerequisite.
 *
 * @param task           the task being evaluated
 * @param taskIndex      Map<id, task> of tasks we know about
 */
export function resolveTaskBlocking(task, taskIndex) {
  const prerequisiteId = task?.depends_on_task_id || null
  if (!prerequisiteId) {
    return { isBlocked: false, prerequisiteId: null, prerequisite: null, prerequisiteDone: null }
  }

  const prerequisite = taskIndex?.get?.(prerequisiteId) ?? null
  // Unknown prerequisite (filtered out of the current query) — don't guess.
  if (!prerequisite) {
    return { isBlocked: false, prerequisiteId, prerequisite: null, prerequisiteDone: null }
  }

  const prerequisiteDone = prerequisite.status === 'completed'
  return {
    isBlocked: task.status !== 'completed' && !prerequisiteDone,
    prerequisiteId,
    prerequisite,
    prerequisiteDone,
  }
}

/** Build a Map<id, task> for dependency lookups. */
export function indexTasksById(tasks = []) {
  return new Map(tasks.filter(Boolean).map((task) => [task.id, task]))
}

/**
 * Annotate a list of tasks with `is_blocked`, `blocked_by`, deadline info and an
 * urgency score. Safe to call on already-annotated tasks.
 */
export function decorateTasks(tasks = [], today = new Date()) {
  const index = indexTasksById(tasks)

  return tasks.map((task) => {
    const blocking = resolveTaskBlocking(task, index)
    const isCompleted = task.status === 'completed'
    const due = getDueStatus(getTaskDeadline(task), { isCompleted, today })
    const decorated = {
      ...task,
      is_blocked: blocking.isBlocked,
      blocked_by: blocking.prerequisite
        ? { id: blocking.prerequisite.id, title: blocking.prerequisite.title, status: blocking.prerequisite.status }
        : null,
      is_overdue: due.isOverdue,
      is_due_soon: due.isDueSoon,
      days_remaining: due.days,
      due_status: due,
    }
    decorated.urgency_score = getTaskUrgencyScore(decorated, today)
    return decorated
  })
}

/**
 * Ranking used by every tracking list: high priority + near deadline floats to
 * the top, completed sinks to the bottom, blocked work is de-prioritised because
 * it cannot be started yet.
 */
export function getTaskUrgencyScore(task, today = new Date()) {
  if (!task) return -Infinity
  if (task.status === 'completed') return -1000

  let score = (PRIORITY_WEIGHT[task.priority] ?? PRIORITY_WEIGHT.medium) * 100

  const days = getDaysRemaining(getTaskDeadline(task), today)
  if (days === null) {
    score -= 40 // no deadline → less actionable than a dated task
  } else if (days < 0) {
    score += 400 + Math.min(Math.abs(days), 30) * 5
  } else {
    score += Math.max(0, 150 - days * 5)
  }

  if (task.is_blocked || task.status === 'blocked') score -= 120
  if (task.status === 'in_progress') score += 30

  return score
}

/** Sort by urgency (desc), tie-broken by deadline then title. Does not mutate. */
export function sortTasksByUrgency(tasks = [], today = new Date()) {
  return [...tasks].sort((a, b) => {
    const diff = getTaskUrgencyScore(b, today) - getTaskUrgencyScore(a, today)
    if (diff !== 0) return diff

    const aDue = toLocalDate(getTaskDeadline(a))
    const bDue = toLocalDate(getTaskDeadline(b))
    if (aDue && bDue && aDue - bDue !== 0) return aDue - bDue
    if (aDue && !bDue) return -1
    if (!aDue && bDue) return 1

    return (a.title || '').localeCompare(b.title || '', 'vi')
  })
}

/* ────────────────────────────── Goal health ────────────────────────────── */

export const GOAL_HEALTH_META = {
  on_track: {
    key: 'on_track',
    label: 'Đúng tiến độ',
    short: 'On Track',
    icon: '🟢',
    chip: 'bg-green-100 text-green-700 border border-green-200',
    dot: 'bg-green-500',
  },
  at_risk: {
    key: 'at_risk',
    label: 'Có rủi ro',
    short: 'At Risk',
    icon: '🟡',
    chip: 'bg-amber-100 text-amber-800 border border-amber-200',
    dot: 'bg-amber-500',
  },
  off_track: {
    key: 'off_track',
    label: 'Chậm tiến độ',
    short: 'Off Track',
    icon: '🔴',
    chip: 'bg-red-100 text-red-700 border border-red-200',
    dot: 'bg-red-500',
  },
  completed: {
    key: 'completed',
    label: 'Đã hoàn thành',
    short: 'Completed',
    icon: '🏁',
    chip: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    dot: 'bg-emerald-500',
  },
  no_data: {
    key: 'no_data',
    label: 'Chưa đủ dữ liệu',
    short: 'No Data',
    icon: '⚪',
    chip: 'bg-gray-100 text-gray-600 border border-gray-200',
    dot: 'bg-gray-400',
  },
}

export const GOAL_HEALTH_ORDER = ['off_track', 'at_risk', 'on_track', 'completed', 'no_data']

/**
 * Overall health of a goal, derived from progress vs. elapsed time plus the
 * overdue and blocked tasks inside it.
 *
 * @param goal   goal row (needs progress, start_date, target_date, status)
 * @param tasks  the goal's tasks (already decorated by `decorateTasks`, ideally)
 * @returns {{
 *   key: string, meta: object, progress: number, expectedProgress: number|null,
 *   progressGap: number|null, daysRemaining: number|null,
 *   overdueTasks: number, blockedTasks: number, dueSoonTasks: number,
 *   lateTasks: Array<{id, title, daysOverdue}>, reasons: string[]
 * }}
 */
export function computeGoalHealth(goal, tasks = [], today = new Date()) {
  const now = normalizeToMidnight(today)
  const progress = Math.max(0, Math.min(100, Number(goal?.progress) || 0))

  const startDate = toLocalDate(goal?.start_date)
  const targetDate = toLocalDate(goal?.target_date)
  const daysRemaining = targetDate ? diffInDays(now, targetDate) : null

  const openTasks = tasks.filter((task) => task.status !== 'completed')

  // The tasks that are actually late — this is what we surface to the user.
  const lateTasks = openTasks
    .map((task) => {
      const due = task.due_status ?? getDueStatus(getTaskDeadline(task), { today: now })
      return due.isOverdue ? { id: task.id, title: task.title, daysOverdue: Math.abs(due.days) } : null
    })
    .filter(Boolean)
    .sort((a, b) => b.daysOverdue - a.daysOverdue)

  const overdueTasks = lateTasks.length
  const blockedTasks = openTasks.filter((task) => task.is_blocked || task.status === 'blocked').length
  const dueSoonTasks = openTasks.filter(
    (task) => (task.due_status ?? getDueStatus(getTaskDeadline(task), { today: now })).isDueSoon
  ).length

  // Time-based expectation
  let expectedProgress = null
  let progressGap = null

  if (targetDate) {
    const effectiveStart = startDate && startDate <= targetDate ? startDate : null
    const totalDays = effectiveStart ? Math.max(1, diffInDays(effectiveStart, targetDate)) : null
    if (totalDays !== null) {
      const elapsed = Math.max(0, Math.min(totalDays, diffInDays(effectiveStart, now)))
      expectedProgress = (elapsed / totalDays) * 100
      progressGap = progress - expectedProgress
    }
  }

  const base = {
    progress,
    expectedProgress,
    progressGap,
    daysRemaining,
    overdueTasks,
    blockedTasks,
    dueSoonTasks,
    lateTasks,
  }

  // ── Classification ──
  if (goal?.status === 'completed') {
    return {
      ...base,
      key: 'completed',
      meta: GOAL_HEALTH_META.completed,
      overdueTasks: 0,
      blockedTasks: 0,
      dueSoonTasks: 0,
      lateTasks: [],
      reasons: ['Mục tiêu đã được đánh dấu hoàn thành'],
    }
  }

  if (!targetDate && tasks.length === 0) {
    return {
      ...base,
      key: 'no_data',
      meta: GOAL_HEALTH_META.no_data,
      reasons: ['Chưa có ngày hoàn thành dự kiến và chưa có task nào'],
    }
  }

  const offTrack = []
  if (daysRemaining !== null && daysRemaining < 0 && progress < 100) {
    offTrack.push(`Đã quá ngày hoàn thành dự kiến ${Math.abs(daysRemaining)} ngày`)
  }
  if (progressGap !== null && progressGap <= -25) {
    offTrack.push(`Tiến độ chậm ${Math.abs(progressGap).toFixed(0)}% so với kế hoạch`)
  }
  if (overdueTasks >= 3) {
    offTrack.push(`${overdueTasks} task đã quá hạn`)
  }

  if (offTrack.length > 0) {
    return { ...base, key: 'off_track', meta: GOAL_HEALTH_META.off_track, reasons: offTrack }
  }

  const atRisk = []
  if (progressGap !== null && progressGap <= -10) {
    atRisk.push(`Tiến độ chậm ${Math.abs(progressGap).toFixed(0)}% so với kế hoạch`)
  }
  if (overdueTasks > 0) atRisk.push(`${overdueTasks} task quá hạn`)
  if (blockedTasks > 0) atRisk.push(`${blockedTasks} task đang bị chặn`)
  if (daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= DUE_SOON_THRESHOLD_DAYS && progress < 90) {
    atRisk.push(`Còn ${daysRemaining} ngày nhưng tiến độ mới ${progress.toFixed(0)}%`)
  }

  if (atRisk.length > 0) {
    return { ...base, key: 'at_risk', meta: GOAL_HEALTH_META.at_risk, reasons: atRisk }
  }

  const reasons = []
  if (dueSoonTasks > 0) reasons.push(`${dueSoonTasks} task sắp đến hạn`)
  if (expectedProgress !== null) {
    reasons.push(`Tiến độ ${progress.toFixed(0)}% (kế hoạch ${expectedProgress.toFixed(0)}%)`)
  }
  if (reasons.length === 0) reasons.push('Không phát hiện rủi ro')

  return { ...base, key: 'on_track', meta: GOAL_HEALTH_META.on_track, reasons }
}

/**
 * Same On Track / At Risk / Off Track vocabulary, applied to a single task so
 * task rows read consistently with their goal.
 */
export function computeTaskHealth(task, today = new Date()) {
  if (!task) return { key: 'no_data', meta: GOAL_HEALTH_META.no_data, label: GOAL_HEALTH_META.no_data.label }

  if (task.status === 'completed') {
    return { key: 'completed', meta: GOAL_HEALTH_META.completed, label: 'Hoàn thành' }
  }

  const due = task.due_status ?? getDueStatus(getTaskDeadline(task), { today })

  if (due.isOverdue) {
    return {
      key: 'off_track',
      meta: GOAL_HEALTH_META.off_track,
      label: `Trễ ${Math.abs(due.days)} ngày`,
    }
  }

  if (task.is_blocked || task.status === 'blocked') {
    return { key: 'at_risk', meta: GOAL_HEALTH_META.at_risk, label: 'Đang chờ' }
  }

  if (due.isDueSoon) {
    return {
      key: 'at_risk',
      meta: GOAL_HEALTH_META.at_risk,
      label: due.days === 0 ? 'Đến hạn hôm nay' : `Sắp đến hạn (${due.days} ngày)`,
    }
  }

  if (due.days === null) {
    return { key: 'no_data', meta: GOAL_HEALTH_META.no_data, label: 'Chưa có hạn' }
  }

  return { key: 'on_track', meta: GOAL_HEALTH_META.on_track, label: 'Đúng tiến độ' }
}
