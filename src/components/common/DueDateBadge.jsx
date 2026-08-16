import { DUE_TONE_CLASSES, getDueStatus, toLocalDate } from '../../utils/taskHealth'

const TONE_ICONS = {
  overdue: '⚠️',
  today: '🔥',
  soon: '⏳',
  normal: '',
  none: '',
}

/**
 * "3 days left / Due today / 2 days overdue" chip.
 *
 * Completed work gets no countdown chip at all — only its date, if requested.
 *
 * @param date        due date (YYYY-MM-DD, ISO string or Date)
 * @param isCompleted suppresses the countdown chip
 * @param showDate    also render the calendar date next to the countdown
 * @param compact     shorter wording, for dense table cells
 */
export default function DueDateBadge({
  date,
  isCompleted = false,
  showDate = false,
  compact = false,
  className = '',
}) {
  const status = getDueStatus(date, { isCompleted })
  const parsed = toLocalDate(date)

  if (status.days === null) {
    return <span className={`text-xs text-gray-400 ${className}`}>—</span>
  }

  // Nothing is "remaining" on finished work.
  if (isCompleted) {
    if (!showDate || !parsed) return <span className={`text-xs text-gray-400 ${className}`}>—</span>
    return (
      <span className={`text-xs text-gray-500 whitespace-nowrap ${className}`}>
        {parsed.toLocaleDateString('vi-VN')}
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {showDate && parsed && (
        <span className="text-xs text-gray-600 whitespace-nowrap">{parsed.toLocaleDateString('vi-VN')}</span>
      )}
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${DUE_TONE_CLASSES[status.tone]}`}
        title={status.label}
      >
        {TONE_ICONS[status.tone] && <span aria-hidden="true">{TONE_ICONS[status.tone]}</span>}
        {compact ? status.shortLabel : status.label}
      </span>
    </span>
  )
}
