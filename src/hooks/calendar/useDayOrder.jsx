import { useCallback, useState } from 'react'

/**
 * User-defined ordering of the tasks/subtasks planned on each calendar day.
 *
 * Stored in localStorage as `{ 'YYYY-MM-DD': ['task-12', 'subtask-40', ...] }`.
 * Entries older than KEEP_DAYS are pruned on every save so the blob stays small.
 */

const STORAGE_KEY = 'polaris:calendar-day-order'
const KEEP_DAYS = 90

export function dayItemKey(item) {
  return `${item.type}-${item.original_id}`
}

function isItemDone(item) {
  return item.type === 'task' ? item.status === 'completed' : item.is_completed === true
}

function loadOrders() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
  } catch {
    return {}
  }
}

function pruneOrders(orders) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - KEEP_DAYS)
  const cutoffKey = cutoff.toISOString().slice(0, 10)
  return Object.fromEntries(Object.entries(orders).filter(([dateKey]) => dateKey >= cutoffKey))
}

/**
 * Re-sort already default-sorted items by the saved order. Done items always stay
 * below pending ones; items without a saved position keep their default order
 * after the ones that have one.
 */
export function applyDayOrder(items, order) {
  if (!order?.length) return items
  const position = new Map(order.map((key, index) => [key, index]))
  const rank = (item) => position.get(dayItemKey(item)) ?? Infinity

  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const aDone = isItemDone(a.item)
      const bDone = isItemDone(b.item)
      if (aDone !== bDone) return aDone ? 1 : -1
      const diff = rank(a.item) - rank(b.item)
      if (diff !== 0 && !Number.isNaN(diff)) return diff
      return a.index - b.index
    })
    .map(({ item }) => item)
}

export function useDayOrder() {
  const [orders, setOrders] = useState(loadOrders)

  const saveOrder = useCallback((dateKey, items) => {
    setOrders((prev) => {
      const next = pruneOrders({ ...prev, [dateKey]: items.map(dayItemKey) })
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // Storage full / disabled — keep the order for this session only.
      }
      return next
    })
  }, [])

  return { orders, saveOrder }
}
