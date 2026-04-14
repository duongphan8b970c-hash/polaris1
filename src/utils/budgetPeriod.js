/**
 * Calculate the current budget period date range based on period type and start settings.
 *
 * For monthly budgets:
 *   - Period runs from `period_start_day` of one month to (period_start_day - 1) of the next month.
 *   - Example: period_start_day = 25 → period is 25th of current/previous month to 24th of next/current month.
 *
 * For yearly budgets:
 *   - Period runs from `period_start_month`/`period_start_day` of one year to the day before that date the next year.
 *
 * @param {Object} budget - Budget object
 * @param {string} budget.period - 'monthly' or 'yearly'
 * @param {number} [budget.period_start_day=1] - Day of month when period starts (1-28)
 * @param {number} [budget.period_start_month=1] - Month when period starts for yearly budgets (1-12)
 * @param {Date} [referenceDate] - Reference date to calculate against (defaults to now)
 * @returns {{ periodStart: string, periodEnd: string }} ISO date strings (YYYY-MM-DD)
 */
export function getBudgetPeriodRange(budget, referenceDate = new Date()) {
  const startDay = budget.period_start_day || 1
  const startMonth = budget.period_start_month || 1

  if (budget.period === 'monthly') {
    return getMonthlyPeriod(startDay, referenceDate)
  }

  return getYearlyPeriod(startDay, startMonth, referenceDate)
}

/**
 * Get current monthly period boundaries.
 * @param {number} startDay - Day of month when period starts (1-28)
 * @param {Date} ref - Reference date
 * @returns {{ periodStart: string, periodEnd: string }}
 */
function getMonthlyPeriod(startDay, ref) {
  const year = ref.getFullYear()
  const month = ref.getMonth() // 0-indexed
  const day = ref.getDate()

  let periodStart
  let periodEnd

  if (day >= startDay) {
    // We are in the period that started this month
    periodStart = new Date(year, month, startDay)
    periodEnd = new Date(year, month + 1, startDay - 1)
  } else {
    // We are in the period that started last month
    periodStart = new Date(year, month - 1, startDay)
    periodEnd = new Date(year, month, startDay - 1)
  }

  return {
    periodStart: formatDate(periodStart),
    periodEnd: formatDate(periodEnd),
  }
}

/**
 * Get current yearly period boundaries.
 * @param {number} startDay - Day of month when period starts (1-28)
 * @param {number} startMonth - Month when period starts (1-12)
 * @param {Date} ref - Reference date
 * @returns {{ periodStart: string, periodEnd: string }}
 */
function getYearlyPeriod(startDay, startMonth, ref) {
  const year = ref.getFullYear()
  // startMonth is 1-indexed, JS Date month is 0-indexed
  const periodStartThisYear = new Date(year, startMonth - 1, startDay)

  let periodStart
  let periodEnd

  if (ref >= periodStartThisYear) {
    periodStart = periodStartThisYear
    periodEnd = new Date(year + 1, startMonth - 1, startDay - 1)
  } else {
    periodStart = new Date(year - 1, startMonth - 1, startDay)
    periodEnd = new Date(year, startMonth - 1, startDay - 1)
  }

  return {
    periodStart: formatDate(periodStart),
    periodEnd: formatDate(periodEnd),
  }
}

/**
 * Format a Date as YYYY-MM-DD.
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Get a human-readable label for the current budget period.
 * @param {Object} budget
 * @param {Date} [referenceDate]
 * @returns {string}
 */
export function getBudgetPeriodLabel(budget, referenceDate = new Date()) {
  const { periodStart, periodEnd } = getBudgetPeriodRange(budget, referenceDate)
  const start = new Date(periodStart)
  const end = new Date(periodEnd)

  const fmt = (d) => {
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }

  return `${fmt(start)} – ${fmt(end)}`
}
