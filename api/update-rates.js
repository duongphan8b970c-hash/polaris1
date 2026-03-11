import { supabase } from '../lib/supabase'

/**
 * Get exchange rate between two currencies
 * @param {string} fromCurrency - Source currency (e.g., 'USD')
 * @param {string} toCurrency - Target currency (e.g., 'VND')
 * @returns {Promise<number>} - Exchange rate
 */
export async function getExchangeRate(fromCurrency, toCurrency) {
  // Same currency, no conversion needed
  if (fromCurrency === toCurrency) {
    return 1
  }

  try {
    console.log(`🔍 Looking for exchange rate: ${fromCurrency} → ${toCurrency}`)

    // ✅ FIX: Remove .single(), use array check instead
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('rate')
      .eq('from_currency', fromCurrency)
      .eq('to_currency', toCurrency)
      .maybeSingle() // ✅ Use maybeSingle() instead of single()

    if (data && !error) {
      console.log(`✅ Found direct rate: ${data.rate}`)
      return parseFloat(data.rate)
    }

    // If direct rate not found, try reverse rate
    console.log(`⚠️ Direct rate not found, trying reverse: ${toCurrency} → ${fromCurrency}`)
    
    const { data: reverseData, error: reverseError } = await supabase
      .from('exchange_rates')
      .select('rate')
      .eq('from_currency', toCurrency)
      .eq('to_currency', fromCurrency)
      .maybeSingle() // ✅ Use maybeSingle()

    if (reverseData && !reverseError) {
      const inverseRate = 1 / parseFloat(reverseData.rate)
      console.log(`✅ Found reverse rate: ${reverseData.rate}, inverse: ${inverseRate}`)
      return inverseRate
    }

    // If both failed, throw error
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
 * @returns {Promise<number>} - Converted amount
 */
export async function convertCurrency(amount, fromCurrency, toCurrency) {
  const rate = await getExchangeRate(fromCurrency, toCurrency)
  return amount * rate
}

/**
 * Get all exchange rates for a currency
 * @param {string} currency - Currency code
 * @returns {Promise<Object>} - Map of currency -> rate
 */
export async function getAllRatesForCurrency(currency) {
  const { data, error } = await supabase
    .from('exchange_rates')
    .select('to_currency, rate')
    .eq('from_currency', currency)

  if (error) {
    console.error('Error getting rates:', error)
    return {}
  }

  const ratesMap = {}
  data.forEach(r => {
    ratesMap[r.to_currency] = parseFloat(r.rate)
  })
  return ratesMap
}