/**
 * Format number as Vietnamese currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: VND)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'VND') => {
  if (amount == null || isNaN(amount)) return '0 ₫'
  
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Format number with thousand separators
 * @param {number} number - Number to format
 * @returns {string} Formatted number string
 */
export const formatNumber = (number) => {
  if (number == null || isNaN(number)) return '0'
  
  return new Intl.NumberFormat('vi-VN').format(number)
}

/**
 * Parse currency string to number
 * @param {string} currencyString - Currency string to parse
 * @returns {number} Parsed number
 */
export const parseCurrency = (currencyString) => {
  if (!currencyString) return 0
  
  // Remove all non-digit characters except minus sign
  const cleaned = currencyString.replace(/[^\d-]/g, '')
  return parseInt(cleaned) || 0
}

/**
 * Format number as compact (e.g., 1.2K, 3.4M)
 * @param {number} number - Number to format
 * @returns {string} Compact formatted number
 */
export const formatCompactNumber = (number) => {
  if (number == null || isNaN(number)) return '0'
  
  return new Intl.NumberFormat('vi-VN', {
    notation: 'compact',
    compactDisplay: 'short'
  }).format(number)
}

/**
 * Format percentage
 * @param {number} value - Value to format
 * @param {number} total - Total value
 * @param {number} decimals - Decimal places (default: 1)
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (value, total, decimals = 1) => {
  if (!total || total === 0) return '0%'
  
  const percentage = (value / total) * 100
  return `${percentage.toFixed(decimals)}%`
}

/**
 * Calculate percentage
 * @param {number} value - Value
 * @param {number} total - Total value
 * @returns {number} Percentage
 */
export const calculatePercentage = (value, total) => {
  if (!total || total === 0) return 0
  return (value / total) * 100
}