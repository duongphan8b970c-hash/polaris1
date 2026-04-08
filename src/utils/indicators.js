/**
 * Technical indicators for trading charts
 */

/**
 * Calculate Simple Moving Average (SMA)
 * @param {Array} data - Array of {time, close} objects
 * @param {number} period - MA period (e.g., 7, 25)
 * @returns {Array} Array of {time, value} objects
 */
export function calculateMA(data, period) {
  const result = []
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) continue
    let sum = 0
    for (let j = i - period + 1; j <= i; j++) {
      sum += data[j].close
    }
    result.push({
      time: data[i].time,
      value: sum / period,
    })
  }
  return result
}

/**
 * Calculate Relative Strength Index (RSI)
 * @param {Array} data - Array of {time, close} objects
 * @param {number} period - RSI period (default: 14)
 * @returns {Array} Array of {time, value} objects
 */
export function calculateRSI(data, period = 14) {
  const result = []
  if (data.length < period + 1) return result

  // Calculate initial average gain/loss
  let avgGain = 0
  let avgLoss = 0
  for (let i = 1; i <= period; i++) {
    const change = data[i].close - data[i - 1].close
    if (change >= 0) avgGain += change
    else avgLoss += Math.abs(change)
  }
  avgGain /= period
  avgLoss /= period

  const rsi = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss))
  result.push({ time: data[period].time, value: rsi })

  // Calculate subsequent RSI using smoothed averages
  for (let i = period + 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close
    const gain = change >= 0 ? change : 0
    const loss = change < 0 ? Math.abs(change) : 0

    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period

    const val = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss))
    result.push({ time: data[i].time, value: val })
  }

  return result
}
