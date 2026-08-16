import { formatDateString, normalizeToMidnight, isSameDay as dateUtilsIsSameDay } from './dateUtils'

/**
 * Calendar Utilities
 */

/**
 * Get all days in a month as array of Date objects
 */
export function getDaysInMonth(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const days = []

  // Add empty slots for days before month starts
  const firstDayOfWeek = firstDay.getDay()
  for (let i = 0; i < firstDayOfWeek; i++) {
    const emptyDate = new Date(year, month, -(firstDayOfWeek - i - 1))
    days.push({ date: emptyDate, isCurrentMonth: false })
  }

  // Add all days in month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    days.push({ 
      date: new Date(year, month, day), 
      isCurrentMonth: true 
    })
  }

  // Add empty slots to complete the last week
  const lastDayOfWeek = lastDay.getDay()
  const remainingDays = 6 - lastDayOfWeek
  for (let i = 1; i <= remainingDays; i++) {
    const emptyDate = new Date(year, month + 1, i)
    days.push({ date: emptyDate, isCurrentMonth: false })
  }

  return days
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1, date2) {
  return dateUtilsIsSameDay(date1, date2)
}

/**
 * Check if date is today
 */
export function isToday(date) {
  return isSameDay(date, new Date())
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDateKey(date) {
  return formatDateString(date)
}

/**
 * Get items for a specific date
 */
export function getItemsForDate(items, date) {
  const targetDateKey = formatDateString(normalizeToMidnight(date))
  
  return items.filter(item => {
    if (!item.instance_date) return false
    return item.instance_date === targetDateKey
  })
}

/**
 * Calculate completion stats for date
 */
export function getDateStats(items, date) {
  const dateItems = getItemsForDate(items, date)
  const total = dateItems.length
  const completed = dateItems.filter(item => 
    item.type === 'task' 
      ? item.status === 'completed' 
      : item.is_completed === true
  ).length

  return {
    total,
    completed,
    percentage: total > 0 ? (completed / total) * 100 : 0
  }
}

/**
 * Get color for date based on completion
 */
export function getDateColor(stats) {
  if (stats.total === 0) return 'gray' // No items
  if (stats.percentage === 100) return 'green' // All done
  if (stats.percentage > 0) return 'yellow' // Partial
  return 'red' // None done
}

/**
 * Get month name in Vietnamese
 */
export function getMonthName(month) {
  const months = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
    'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
    'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ]
  return months[month]
}

/**
 * Get day name in Vietnamese
 */
export function getDayName(dayOfWeek) {
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
  return days[dayOfWeek]
}

/**
 * The 7 days of the week containing `date` (weeks start on Sunday, matching the
 * month grid).
 */
export function getWeekDays(date) {
  const start = normalizeToMidnight(date)
  start.setDate(start.getDate() - start.getDay())

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start)
    day.setDate(start.getDate() + index)
    return day
  })
}

/** Inclusive first/last day of the week containing `date`. */
export function getWeekRange(date) {
  const days = getWeekDays(date)
  return { start: days[0], end: days[6] }
}

/** `Tuần 12/8 – 18/8/2026` style label. */
export function getWeekLabel(date) {
  const { start, end } = getWeekRange(date)
  const sameMonth = start.getMonth() === end.getMonth()
  const startLabel = sameMonth
    ? `${start.getDate()}`
    : `${start.getDate()}/${start.getMonth() + 1}`
  return `Tuần ${startLabel} – ${end.getDate()}/${end.getMonth() + 1}/${end.getFullYear()}`
}

/** Items for a date, ordered so unfinished and higher-priority work comes first. */
export function sortCalendarItems(items) {
  const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 }
  const isDone = (item) => (item.type === 'task' ? item.status === 'completed' : item.is_completed === true)

  return [...items].sort((a, b) => {
    if (isDone(a) !== isDone(b)) return isDone(a) ? 1 : -1

    const aBlocked = a.type === 'task' && (a.is_blocked || a.status === 'blocked')
    const bBlocked = b.type === 'task' && (b.is_blocked || b.status === 'blocked')
    if (aBlocked !== bBlocked) return aBlocked ? 1 : -1

    const aPriority = priorityWeight[a.priority ?? a.task?.priority] ?? 0
    const bPriority = priorityWeight[b.priority ?? b.task?.priority] ?? 0
    if (aPriority !== bPriority) return bPriority - aPriority

    // Tasks above their own subtasks, then alphabetical for a stable order.
    if (a.type !== b.type) return a.type === 'task' ? -1 : 1
    return (a.title || '').localeCompare(b.title || '', 'vi')
  })
}