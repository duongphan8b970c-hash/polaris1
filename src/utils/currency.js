import { supabase } from '../lib/supabase' // ✅ ADD THIS

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

/**
 * Get exchange rate between two currencies
 * @param {string} fromCurrency - Source currency (e.g., 'USD')
 * @param {string} toCurrency - Target currency (e.g., 'VND')
 * @returns {Promise<number>} - Exchange rate
 */
export const getExchangeRate = async (fromCurrency, toCurrency) => {
  // ✅ REMOVED supabase parameter, import it instead
  
  // Same currency, no conversion needed
  if (fromCurrency === toCurrency) {
    return 1
  }

  try {
    console.log(`🔍 Fetching rate: ${fromCurrency} → ${toCurrency}`)
    
    // Query exchange_rates table
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('rate')
      .eq('from_currency', fromCurrency)
      .eq('to_currency', toCurrency)
      .maybeSingle() // ✅ Changed from .single() to .maybeSingle()

    if (data && !error) {
      console.log(`✅ Direct rate found: ${data.rate}`)
      return parseFloat(data.rate)
    }

    // If direct rate not found, try reverse rate
    console.log(`⚠️ Direct rate not found, trying reverse...`)
    
    const { data: reverseData, error: reverseError } = await supabase
      .from('exchange_rates')
      .select('rate')
      .eq('from_currency', toCurrency)
      .eq('to_currency', fromCurrency)
      .maybeSingle() // ✅ Changed from .single() to .maybeSingle()

    if (reverseData && !reverseError) {
      const inverseRate = 1 / parseFloat(reverseData.rate)
      console.log(`✅ Reverse rate found: ${reverseData.rate}, inverse: ${inverseRate}`)
      return inverseRate
    }

    // Both failed
    throw new Error(`Không tìm thấy tỷ giá ${fromCurrency} → ${toCurrency}`)
  } catch (err) {
    console.error('❌ Error getting exchange rate:', err)
    throw err
  }
}

/**
 * Convert amount from one currency to another
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency
 * @param {string} toCurrency - Target currency
 * @returns {Promise<Object>} - { convertedAmount, rate }
 */
export const convertCurrency = async (amount, fromCurrency, toCurrency) => {
  // ✅ REMOVED supabase parameter
  const rate = await getExchangeRate(fromCurrency, toCurrency)
  const convertedAmount = amount * rate
  
  return {
    convertedAmount,
    rate
  }
}