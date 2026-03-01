/**
 * Date utilities to handle timezone issues
 */

/**
 * Parse YYYY-MM-DD string to local date at midnight
 * ✅ CRITICAL: Always use this for database date strings
 */
export function parseDateString(dateStr) {
  if (!dateStr) return null
  
  // Split and parse as integers
  const parts = dateStr.split('-')
  if (parts.length !== 3) return null
  
  const year = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10) - 1 // Month is 0-indexed
  const day = parseInt(parts[2], 10)
  
  // Create date in LOCAL timezone
  return new Date(year, month, day, 0, 0, 0, 0)
}

/**
 * Format date to YYYY-MM-DD string
 */
export function formatDateString(date) {
  if (!date) return ''
  
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

/**
 * Check if two dates are the same day (ignoring time)
 */
export function isSameDay(date1, date2) {
  if (!date1 || !date2) return false
  
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

/**
 * Get date range for month (local timezone)
 */
export function getMonthRange(year, month) {
  const start = new Date(year, month, 1, 0, 0, 0, 0)
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999)
  
  return { start, end }
}

/**
 * Normalize date to midnight local time
 */
export function normalizeToMidnight(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}