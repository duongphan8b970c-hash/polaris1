import { useMemo } from 'react'
import { formatDateKey } from '../../utils/calendar'

/**
 * Calculate calendar statistics
 * @param {Array} items - Calendar items for the month
 * @param {Number} year - Current year
 * @param {Number} month - Current month
 */
export function useCalendarStats(items, year, month) {
  const stats = useMemo(() => {
    if (!items || items.length === 0) {
      return {
        totalScheduled: 0,
        totalCompleted: 0,
        completionRate: 0,
        currentStreak: 0,
        longestStreak: 0,
        daysWithItems: 0
      }
    }

    // Group items by date
    const itemsByDate = {}
    items.forEach(item => {
      const dateKey = item.instance_date
      if (!itemsByDate[dateKey]) {
        itemsByDate[dateKey] = []
      }
      itemsByDate[dateKey].push(item)
    })

    // Calculate total & completed
    let totalScheduled = 0
    let totalCompleted = 0

    Object.values(itemsByDate).forEach(dateItems => {
      totalScheduled += dateItems.length
      totalCompleted += dateItems.filter(item => 
        item.type === 'task' 
          ? item.status === 'completed' 
          : item.is_completed === true
      ).length
    })

    // Calculate completion rate
    const completionRate = totalScheduled > 0 
      ? Math.round((totalCompleted / totalScheduled) * 100) 
      : 0

    // Calculate streak (consecutive days with 100% completion)
    const calculateStreak = () => {
      const dates = Object.keys(itemsByDate).sort()
      let currentStreak = 0
      let longestStreak = 0
      let tempStreak = 0

      const today = formatDateKey(new Date())
      let checkingCurrent = true

      // Check from most recent to oldest
      for (let i = dates.length - 1; i >= 0; i--) {
        const dateKey = dates[i]
        const dateItems = itemsByDate[dateKey]
        const completed = dateItems.filter(item => 
          item.type === 'task' 
            ? item.status === 'completed' 
            : item.is_completed === true
        ).length

        const allCompleted = completed === dateItems.length

        if (allCompleted) {
          tempStreak++
          if (checkingCurrent && dateKey <= today) {
            currentStreak = tempStreak
          }
        } else {
          if (checkingCurrent) {
            checkingCurrent = false
          }
          longestStreak = Math.max(longestStreak, tempStreak)
          tempStreak = 0
        }
      }

      longestStreak = Math.max(longestStreak, tempStreak)

      return { currentStreak, longestStreak }
    }

    const streaks = calculateStreak()

    return {
      totalScheduled,
      totalCompleted,
      completionRate,
      currentStreak: streaks.currentStreak,
      longestStreak: streaks.longestStreak,
      daysWithItems: Object.keys(itemsByDate).length
    }
  }, [items, year, month])

  return stats
}