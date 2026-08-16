/**
 * "Waiting on <prerequisite>" chip, shown when a task's prerequisite is not done.
 *
 * @param blockedBy { id, title, status } of the prerequisite task
 */
export default function BlockedBadge({ blockedBy, compact = false, className = '' }) {
  if (!blockedBy) return null

  const title = `Đang chờ task "${blockedBy.title}" hoàn thành`

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200 max-w-[220px] ${className}`}
      title={title}
    >
      <span aria-hidden="true">🚫</span>
      {compact ? (
        'Bị chặn'
      ) : (
        <>
          <span className="shrink-0">Chờ:</span>
          <span className="truncate">{blockedBy.title}</span>
        </>
      )}
    </span>
  )
}
