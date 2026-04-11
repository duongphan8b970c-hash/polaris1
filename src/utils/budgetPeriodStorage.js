/**
 * localStorage helper for storing budget period settings (period_start_day, period_start_month).
 *
 * These settings cannot be stored in the database because the migration adding the columns
 * has not been applied yet. All settings are stored under a single localStorage key as a
 * plain object keyed by budget ID.
 *
 * Storage format:
 * {
 *   "<budgetId>": { period_start_day: number, period_start_month: number }
 * }
 */

const STORAGE_KEY = 'polaris1_budget_period_settings'

/**
 * Read all stored period settings.
 * @returns {Record<string, { period_start_day: number, period_start_month: number }>}
 */
function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

/**
 * Persist the settings map back to localStorage.
 * @param {Record<string, { period_start_day: number, period_start_month: number }>} settings
 */
function writeAll(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // quota exceeded or private browsing – silently ignore
  }
}

/**
 * Get the period settings for a single budget.
 * Returns defaults when no setting is stored.
 *
 * @param {string} budgetId
 * @returns {{ period_start_day: number, period_start_month: number }}
 */
export function getBudgetPeriodSettings(budgetId) {
  const all = readAll()
  return all[budgetId] || { period_start_day: 1, period_start_month: 1 }
}

/**
 * Save or update the period settings for a budget.
 *
 * @param {string} budgetId
 * @param {{ period_start_day: number, period_start_month: number }} settings
 */
export function setBudgetPeriodSettings(budgetId, settings) {
  const all = readAll()
  all[budgetId] = {
    period_start_day: settings.period_start_day || 1,
    period_start_month: settings.period_start_month || 1,
  }
  writeAll(all)
}

/**
 * Remove the period settings for a budget (call this when a budget is deleted).
 *
 * @param {string} budgetId
 */
export function removeBudgetPeriodSettings(budgetId) {
  const all = readAll()
  delete all[budgetId]
  writeAll(all)
}

/**
 * Merge saved localStorage period settings into an array of budget objects.
 * Budgets that have no stored settings get the defaults (day=1, month=1).
 *
 * @param {Array<Object>} budgets
 * @returns {Array<Object>}
 */
export function mergePeriodSettings(budgets) {
  const all = readAll()
  return budgets.map(b => {
    const saved = all[b.id] || { period_start_day: 1, period_start_month: 1 }
    return {
      ...b,
      period_start_day: saved.period_start_day,
      period_start_month: saved.period_start_month,
    }
  })
}
