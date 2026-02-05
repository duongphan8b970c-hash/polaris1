/**
 * Format date to Vietnamese locale
 * @param {Date|string} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  if (!date) return ''
  
  const defaultOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...options
  }
  
  return new Date(date).toLocaleDateString('vi-VN', defaultOptions)
}

/**
 * Format datetime to Vietnamese locale
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted datetime string
 */
export const formatDateTime = (date) => {
  if (!date) return ''
  
  return new Date(date).toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Format time only
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted time string
 */
export const formatTime = (date) => {
  if (!date) return ''
  
  return new Date(date).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Get relative time (e.g., "2 ngày trước", "Hôm nay")
 * @param {Date|string} date - Date to calculate
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date) => {
  if (!date) return ''
  
  const now = new Date()
  const targetDate = new Date(date)
  const diffMs = now - targetDate
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Hôm nay'
  if (diffDays === 1) return 'Hôm qua'
  if (diffDays === -1) return 'Ngày mai'
  if (diffDays < 7 && diffDays > 0) return `${diffDays} ngày trước`
  if (diffDays < 0 && diffDays > -7) return `${Math.abs(diffDays)} ngày nữa`
  if (diffDays < 30 && diffDays > 0) return `${Math.floor(diffDays / 7)} tuần trước`
  
  return formatDate(date)
}

/**
 * Check if date is today
 * @param {Date|string} date - Date to check
 * @returns {boolean}
 */
export const isToday = (date) => {
  if (!date) return false
  
  const today = new Date()
  const checkDate = new Date(date)
  
  return today.toDateString() === checkDate.toDateString()
}

/**
 * Check if date is in the past
 * @param {Date|string} date - Date to check
 * @returns {boolean}
 */
export const isPast = (date) => {
  if (!date) return false
  
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  
  return new Date(date) < now
}

/**
 * Check if date is in the future
 * @param {Date|string} date - Date to check
 * @returns {boolean}
 */
export const isFuture = (date) => {
  if (!date) return false
  
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  
  return new Date(date) > now
}

/**
 * Get start of day
 * @param {Date|string} date - Date
 * @returns {Date}
 */
export const startOfDay = (date = new Date()) => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Get end of day
 * @param {Date|string} date - Date
 * @returns {Date}
 */
export const endOfDay = (date = new Date()) => {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

/**
 * Get date range for common periods
 * @param {string} period - Period type (today, this_week, this_month, etc.)
 * @returns {Object} { from, to }
 */
export const getDateRange = (period) => {
  const now = new Date()
  let from, to
  
  switch (period) {
    case 'today':
      from = startOfDay(now)
      to = endOfDay(now)
      break
      
    case 'yesterday':
      from = startOfDay(new Date(now.setDate(now.getDate() - 1)))
      to = endOfDay(from)
      break
      
    case 'this_week':
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
      from = startOfDay(startOfWeek)
      to = endOfDay(new Date())
      break
      
    case 'last_week':
      const lastWeekStart = new Date(now.setDate(now.getDate() - now.getDay() - 7))
      from = startOfDay(lastWeekStart)
      to = endOfDay(new Date(lastWeekStart.setDate(lastWeekStart.getDate() + 6)))
      break
      
    case 'this_month':
      from = new Date(now.getFullYear(), now.getMonth(), 1)
      to = endOfDay(new Date())
      break
      
    case 'last_month':
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      from = lastMonth
      to = new Date(now.getFullYear(), now.getMonth(), 0)
      break
      
    case 'this_year':
      from = new Date(now.getFullYear(), 0, 1)
      to = endOfDay(new Date())
      break
      
    default:
      from = startOfDay(now)
      to = endOfDay(now)
  }
  
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0]
  }
}

/**
 * Format duration in minutes to human readable
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration
 */
export const formatDuration = (minutes) => {
  if (!minutes) return '0 phút'
  
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours === 0) return `${mins} phút`
  if (mins === 0) return `${hours} giờ`
  return `${hours} giờ ${mins} phút`
}

/**
 * Calculate days between two dates
 * @param {Date|string} from - Start date
 * @param {Date|string} to - End date
 * @returns {number} Number of days
 */
export const daysBetween = (from, to) => {
  const fromDate = new Date(from)
  const toDate = new Date(to)
  const diffTime = Math.abs(toDate - fromDate)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}