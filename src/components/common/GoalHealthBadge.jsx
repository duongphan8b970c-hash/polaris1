/**
 * On Track / At Risk / Off Track chip for a goal.
 *
 * @param health  result of computeGoalHealth()
 * @param detail  render the reasons + the tasks that are actually late
 */
export default function GoalHealthBadge({ health, detail = false, className = '' }) {
  if (!health) return null

  const { meta, reasons, lateTasks = [] } = health

  const tooltip = [
    meta.label,
    ...reasons.map((reason) => `• ${reason}`),
    ...lateTasks.map((task) => `⚠️ ${task.title} — trễ ${task.daysOverdue} ngày`),
  ].join('\n')

  return (
    <div className={className}>
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${meta.chip}`}
        title={tooltip}
      >
        <span aria-hidden="true">{meta.icon}</span>
        {meta.label}
      </span>

      {detail && (
        <div className="mt-1.5 space-y-0.5">
          {reasons.map((reason) => (
            <p key={reason} className="text-xs text-gray-600">
              • {reason}
            </p>
          ))}
          <LateTaskList lateTasks={lateTasks} />
        </div>
      )}
    </div>
  )
}

/** The tasks that are currently overdue — shown only when there are any. */
export function LateTaskList({ lateTasks = [], className = '' }) {
  if (lateTasks.length === 0) return null

  return (
    <div className={className}>
      <p className="text-xs font-semibold text-red-700">⚠️ Task đang trễ ({lateTasks.length})</p>
      <ul className="mt-0.5 space-y-0.5">
        {lateTasks.map((task) => (
          <li key={task.id} className="text-xs text-red-600">
            • {task.title} — trễ <strong>{task.daysOverdue} ngày</strong>
          </li>
        ))}
      </ul>
    </div>
  )
}
