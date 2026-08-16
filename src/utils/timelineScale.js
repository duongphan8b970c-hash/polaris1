import { normalizeToMidnight } from './dateUtils'
import { addDays, diffInDays, toLocalDate } from './taskHealth'

/** Pixels per day for each zoom level. */
export const ZOOM_LEVELS = {
  day: { key: 'day', label: 'Ngày', dayWidth: 44, showDayNumbers: true },
  week: { key: 'week', label: 'Tuần', dayWidth: 18, showDayNumbers: true },
  month: { key: 'month', label: 'Tháng', dayWidth: 6, showDayNumbers: false },
}

const MONTH_SHORT = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12']
const WEEKDAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

/**
 * Build the horizontal scale: the visible date range, plus helpers to map a date
 * to an x offset (in px) and a duration to a width.
 */
export function createTimelineScale(rangeStart, rangeEnd, dayWidth) {
  const start = normalizeToMidnight(rangeStart)
  const end = normalizeToMidnight(rangeEnd)
  const totalDays = Math.max(1, diffInDays(start, end) + 1)

  const offsetFor = (date) => {
    const parsed = toLocalDate(date)
    if (!parsed) return null
    return diffInDays(start, parsed) * dayWidth
  }

  /** Bar geometry clamped to the visible range; null when fully outside. */
  const barFor = (from, to) => {
    const barStart = toLocalDate(from)
    const barEnd = toLocalDate(to) || barStart
    if (!barStart || !barEnd) return null
    if (barEnd < start || barStart > end) return null

    const clampedStart = barStart < start ? start : barStart
    const clampedEnd = barEnd > end ? end : barEnd

    return {
      left: diffInDays(start, clampedStart) * dayWidth,
      width: Math.max(dayWidth * 0.75, (diffInDays(clampedStart, clampedEnd) + 1) * dayWidth),
      clippedStart: barStart < start,
      clippedEnd: barEnd > end,
    }
  }

  return {
    start,
    end,
    totalDays,
    dayWidth,
    width: totalDays * dayWidth,
    offsetFor,
    barFor,
  }
}

/** One entry per day in the range: `{ date, left, isToday, isWeekend }`. */
export function buildDayCells(scale, today = new Date()) {
  const todayKey = normalizeToMidnight(today).getTime()
  const cells = []
  for (let i = 0; i < scale.totalDays; i += 1) {
    const date = addDays(scale.start, i)
    const dow = date.getDay()
    cells.push({
      date,
      left: i * scale.dayWidth,
      label: String(date.getDate()),
      weekdayLabel: WEEKDAY_SHORT[dow],
      isToday: date.getTime() === todayKey,
      isWeekend: dow === 0 || dow === 6,
      isMonthStart: date.getDate() === 1,
    })
  }
  return cells
}

/** Month header segments: `{ label, left, width }`. */
export function buildMonthSegments(scale) {
  const segments = []
  let cursor = new Date(scale.start)

  while (cursor <= scale.end) {
    const monthStart = cursor > scale.start ? cursor : scale.start
    const lastOfMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0)
    const monthEnd = lastOfMonth > scale.end ? scale.end : lastOfMonth

    segments.push({
      key: `${cursor.getFullYear()}-${cursor.getMonth()}`,
      label: `${MONTH_SHORT[cursor.getMonth()]} ${cursor.getFullYear()}`,
      left: diffInDays(scale.start, monthStart) * scale.dayWidth,
      width: (diffInDays(monthStart, monthEnd) + 1) * scale.dayWidth,
    })

    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
  }

  return segments
}

/**
 * How many open tasks overlap each day — drives the workload strip so parallel
 * work is visible at a glance.
 */
export function buildWorkloadPerDay(scale, tasks) {
  const counts = new Array(scale.totalDays).fill(0)

  tasks.forEach((task) => {
    const window = task.window
    if (!window) return
    const from = Math.max(0, diffInDays(scale.start, window.start))
    const to = Math.min(scale.totalDays - 1, diffInDays(scale.start, window.end))
    for (let i = from; i <= to; i += 1) counts[i] += 1
  })

  const peak = counts.reduce((max, value) => Math.max(max, value), 0)
  return { counts, peak }
}
