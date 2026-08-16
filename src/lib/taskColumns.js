/**
 * Feature detection for the `tasks.depends_on_task_id` column.
 *
 * The column ships in supabase/migrations/20260816_add_task_dependency.sql. Until
 * that migration is applied the app must keep working, so every query that wants
 * the column asks here first and calls `disableTaskDependency()` if Postgres says
 * the column is unknown.
 */

export const TASK_DEPENDENCY_COLUMN = 'depends_on_task_id'

let dependencySupported = true

export function isTaskDependencySupported() {
  return dependencySupported
}

/** True when the error is "column/field does not exist" rather than a real failure. */
export function isUnknownColumnError(error, column = TASK_DEPENDENCY_COLUMN) {
  if (!error) return false
  // 42703 = undefined_column (SQL), PGRST204 = column missing from PostgREST cache
  if (error.code === '42703' || error.code === 'PGRST204') return true
  const message = `${error.message || ''} ${error.details || ''}`
  return message.includes(column) && /does not exist|could not find|unknown/i.test(message)
}

export function disableTaskDependency() {
  if (dependencySupported) {
    console.warn(
      `[polaris] tasks.${TASK_DEPENDENCY_COLUMN} not found — task dependencies are disabled. ` +
        'Apply supabase/migrations/20260816_add_task_dependency.sql to enable them.'
    )
  }
  dependencySupported = false
}

/** `', depends_on_task_id'` when supported, otherwise an empty string. */
export function dependencySelectFragment() {
  return dependencySupported ? `, ${TASK_DEPENDENCY_COLUMN}` : ''
}

/** Strip the dependency key from a write payload once we know it is unsupported. */
export function stripDependencyField(payload) {
  if (dependencySupported || !payload || !(TASK_DEPENDENCY_COLUMN in payload)) return payload
  const next = { ...payload }
  delete next[TASK_DEPENDENCY_COLUMN]
  return next
}
