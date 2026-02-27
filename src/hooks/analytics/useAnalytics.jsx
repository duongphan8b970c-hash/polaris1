import { useState, useEffect } from 'react'
import { useGoals } from '../goals/useGoals'
import { useTasks } from '../goals/useTasks'
import {
  calculateCompletionRate,
  getProductivityScore,
  getCurrentStreak,
  getTasksByPriority,
  getTasksByStatus,
  getCompletionByDate,
  getAverageCompletionTime
} from '../../utils/analytics'

/**
 * Hook to fetch and calculate analytics data
 */
export function useAnalytics(dateRange = 'month') {
  const { goals, loading: goalsLoading } = useGoals()
  const { tasks, loading: tasksLoading } = useTasks()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!goalsLoading && !tasksLoading) {
      calculateAnalytics()
    }
  }, [goals, tasks, goalsLoading, tasksLoading, dateRange])

  const calculateAnalytics = () => {
    setLoading(true)

    try {
      // Get date range
      const today = new Date()
      let startDate = new Date()
      
      switch (dateRange) {
        case 'week':
          startDate.setDate(today.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(today.getMonth() - 1)
          break
        case 'quarter':
          startDate.setMonth(today.getMonth() - 3)
          break
        case 'year':
          startDate.setFullYear(today.getFullYear() - 1)
          break
        default:
          startDate.setMonth(today.getMonth() - 1)
      }

      // Filter tasks in range
      const tasksInRange = tasks.filter(task => {
        const createdDate = new Date(task.created_at)
        return createdDate >= startDate && createdDate <= today
      })

      // Calculate stats
      const completionRate = calculateCompletionRate(tasksInRange)
      const productivityScore = getProductivityScore(tasksInRange, goals)
      const currentStreak = getCurrentStreak(tasks)
      const tasksByPriority = getTasksByPriority(tasksInRange)
      const tasksByStatus = getTasksByStatus(tasksInRange)
      const completionByDate = getCompletionByDate(tasksInRange, startDate, today)
      const avgCompletionTime = getAverageCompletionTime(tasksInRange)

      setAnalytics({
        totalTasks: tasksInRange.length,
        completedTasks: tasksInRange.filter(t => t.status === 'completed').length,
        completionRate,
        productivityScore,
        currentStreak,
        tasksByPriority,
        tasksByStatus,
        completionByDate,
        avgCompletionTime,
        activeGoals: goals.filter(g => g.status !== 'completed').length,
        completedGoals: goals.filter(g => g.status === 'completed').length
      })
    } catch (err) {
      console.error('Error calculating analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  return {
    analytics,
    loading,
    refetch: calculateAnalytics
  }
}