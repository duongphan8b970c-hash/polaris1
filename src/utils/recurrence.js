/**
 * Recurrence Utility
 * Handles recurring task/subtask logic
 */

/**
 * Recurrence Rule Structure:
 * {
 *   frequency: 'daily' | 'weekly' | 'monthly',
 *   interval: 1,                    // Every N days/weeks/months
 *   days_of_week: [0,1,2,3,4],     // 0=Sunday, 1=Monday, etc.
 *   end_date: '2024-12-31',         // Or null
 *   occurrences: 30                 // Or null (if end_date is set)
 * }
 */

/**
 * Check if task/subtask is recurring
 */
export function isRecurring(item) {
  return item?.recurrence_rule && Object.keys(item.recurrence_rule).length > 0
}

/**
 * Generate occurrence dates from recurrence rule
 * @param {Object} rule - Recurrence rule
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date (for range query)
 * @param {Number} maxOccurrences - Max number to generate (default 365)
 * @returns {Array<Date>} Array of dates
 */
export function generateOccurrences(rule, startDate, endDate, maxOccurrences = 365) {
  if (!rule || !startDate) return []

  const occurrences = []
  const start = new Date(startDate)
  const end = endDate ? new Date(endDate) : null
  const ruleEndDate = rule.end_date ? new Date(rule.end_date) : null
  
  let currentDate = new Date(start)
  let count = 0

  // Determine max iterations
  const maxCount = rule.occurrences || maxOccurrences

  while (count < maxCount) {
    // Check if we've passed the end date
    if (ruleEndDate && currentDate > ruleEndDate) break
    if (end && currentDate > end) break

    // Add current date if it matches the pattern
    if (matchesRecurrencePattern(currentDate, rule, start)) {
      occurrences.push(new Date(currentDate))
      count++
    }

    // Move to next potential date
    currentDate = getNextDate(currentDate, rule)

    // Safety check: prevent infinite loop
    if (count > 1000) {
      console.warn('Recurrence generation exceeded 1000 iterations')
      break
    }
  }

  return occurrences
}

/**
 * Check if date matches recurrence pattern
 */
function matchesRecurrencePattern(date, rule, startDate) {
  const { frequency, interval = 1, days_of_week } = rule

  switch (frequency) {
    case 'daily':
      // Check if date is N days after start
      const daysDiff = Math.floor((date - startDate) / (1000 * 60 * 60 * 24))
      return daysDiff % interval === 0

    case 'weekly':
      // Check if day of week matches
      if (!days_of_week || days_of_week.length === 0) {
        // If no days specified, use start date's day of week
        const startDay = startDate.getDay()
        const currentDay = date.getDay()
        if (currentDay !== startDay) return false
      } else {
        // Check if current day is in allowed days
        const currentDay = date.getDay()
        if (!days_of_week.includes(currentDay)) return false
      }

      // Check if it's the right week interval
      const weeksDiff = Math.floor((date - startDate) / (1000 * 60 * 60 * 24 * 7))
      return weeksDiff % interval === 0

    case 'monthly':
      // Check if same day of month
      if (date.getDate() !== startDate.getDate()) return false

      // Check if right month interval
      const monthsDiff = 
        (date.getFullYear() - startDate.getFullYear()) * 12 + 
        (date.getMonth() - startDate.getMonth())
      return monthsDiff % interval === 0

    default:
      return false
  }
}

/**
 * Get next date based on frequency
 */
function getNextDate(date, rule) {
  const { frequency, interval = 1 } = rule
  const next = new Date(date)

  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + interval)
      break

    case 'weekly':
      next.setDate(next.getDate() + 1) // Move day by day to check pattern
      break

    case 'monthly':
      next.setMonth(next.getMonth() + interval)
      break

    default:
      next.setDate(next.getDate() + 1)
  }

  return next
}

/**
 * Get next occurrence from a given date
 * @param {Object} rule - Recurrence rule
 * @param {Date} fromDate - Date to start from
 * @returns {Date|null} Next occurrence date
 */
export function getNextOccurrence(rule, fromDate) {
  if (!rule) return null

  const tomorrow = new Date(fromDate)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const nextMonth = new Date(fromDate)
  nextMonth.setMonth(nextMonth.getMonth() + 1)

  const occurrences = generateOccurrences(rule, tomorrow, nextMonth, 1)
  return occurrences.length > 0 ? occurrences[0] : null
}

/**
 * Format recurrence rule to human readable text
 * @param {Object} rule - Recurrence rule
 * @returns {String} Human readable text
 */
export function formatRecurrenceRule(rule) {
  if (!rule || !rule.frequency) return 'Không lặp lại'

  const { frequency, interval = 1, days_of_week, end_date, occurrences } = rule

  let text = ''

  // Frequency
  switch (frequency) {
    case 'daily':
      text = interval === 1 ? 'Hàng ngày' : `Mỗi ${interval} ngày`
      break

    case 'weekly':
      if (days_of_week && days_of_week.length > 0) {
        const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
        const days = days_of_week.map(d => dayNames[d]).join(', ')
        text = interval === 1 
          ? `Hàng tuần vào ${days}` 
          : `Mỗi ${interval} tuần vào ${days}`
      } else {
        text = interval === 1 ? 'Hàng tuần' : `Mỗi ${interval} tuần`
      }
      break

    case 'monthly':
      text = interval === 1 ? 'Hàng tháng' : `Mỗi ${interval} tháng`
      break

    default:
      text = 'Tùy chỉnh'
  }

  // End condition
  if (end_date) {
    const date = new Date(end_date).toLocaleDateString('vi-VN')
    text += `, đến ${date}`
  } else if (occurrences) {
    text += `, ${occurrences} lần`
  }

  return text
}

/**
 * Validate recurrence rule
 * @param {Object} rule - Recurrence rule
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateRecurrenceRule(rule) {
  const errors = []

  if (!rule) {
    return { valid: false, errors: ['Recurrence rule is required'] }
  }

  if (!['daily', 'weekly', 'monthly'].includes(rule.frequency)) {
    errors.push('Invalid frequency')
  }

  if (rule.interval && (rule.interval < 1 || rule.interval > 365)) {
    errors.push('Interval must be between 1 and 365')
  }

  if (rule.frequency === 'weekly' && rule.days_of_week) {
    if (!Array.isArray(rule.days_of_week)) {
      errors.push('days_of_week must be an array')
    } else if (rule.days_of_week.some(d => d < 0 || d > 6)) {
      errors.push('days_of_week must contain values 0-6')
    }
  }

  if (rule.end_date && rule.occurrences) {
    errors.push('Cannot set both end_date and occurrences')
  }

  if (rule.occurrences && rule.occurrences < 1) {
    errors.push('occurrences must be at least 1')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Create preset recurrence rules
 */
export const RECURRENCE_PRESETS = {
  daily: {
    frequency: 'daily',
    interval: 1,
    days_of_week: null,
    end_date: null,
    occurrences: null
  },
  
  weekdays: {
    frequency: 'weekly',
    interval: 1,
    days_of_week: [1, 2, 3, 4, 5], // Mon-Fri
    end_date: null,
    occurrences: null
  },
  
  weekly: {
    frequency: 'weekly',
    interval: 1,
    days_of_week: null,
    end_date: null,
    occurrences: null
  },
  
  biweekly: {
    frequency: 'weekly',
    interval: 2,
    days_of_week: null,
    end_date: null,
    occurrences: null
  },
  
  monthly: {
    frequency: 'monthly',
    interval: 1,
    days_of_week: null,
    end_date: null,
    occurrences: null
  }
}