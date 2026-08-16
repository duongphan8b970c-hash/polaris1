import { formatForecastDate } from '../../utils/taskHealth'

/**
 * On Track / At Risk / Off Track chip for a goal.
 *
 * @param health  result of computeGoalHealth()
 * @param detail  render the reasons + forecast underneath the chip
 */
export default function GoalHealthBadge({ health, detail = false, className = '' }) {
  if (!health) return null

  const { meta, reasons, forecastDate, forecastSlipDays } = health

  const tooltip = [
    `${meta.label}`,
    ...reasons.map((reason) => `• ${reason}`),
    forecastDate ? `Dự báo hoàn thành: ${formatForecastDate(forecastDate)}` : null,
  ]
    .filter(Boolean)
    .join('\n')

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
          {forecastDate && (
            <p className="text-xs text-gray-600">
              📈 Dự báo hoàn thành: <strong>{formatForecastDate(forecastDate)}</strong>
              {forecastSlipDays !== null && forecastSlipDays > 0 && (
                <span className="text-red-600"> (trễ {forecastSlipDays} ngày)</span>
              )}
              {forecastSlipDays !== null && forecastSlipDays <= 0 && (
                <span className="text-green-600"> (sớm {Math.abs(forecastSlipDays)} ngày)</span>
              )}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
