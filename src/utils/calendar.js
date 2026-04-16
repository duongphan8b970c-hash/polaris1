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