/**
 * Analytics & Statistics Utilities
 */

/**
 * Calculate task completion rate
 */
export function calculateCompletionRate(tasks) {
  if (!tasks || tasks.length === 0) return 0
  const completed = tasks.filter(t => t.status === 'completed').length
  return Math.round((completed / tasks.length) * 100)
}

/**
 * Calculate goal progress
 */
export function calculateGoalProgress(goal, tasks) {
  if (!tasks || tasks.length === 0) return 0
  
  const goalTasks = tasks.filter(t => t.goal_id === goal.id)
  if (goalTasks.length === 0) return 0
  
  const completed = goalTasks.filter(t => t.status === 'completed').length
  return Math.round((completed / goalTasks.length) * 100)
}

/**
 * Get tasks completed in date range
 */
export function getCompletedInRange(tasks, startDate, endDate) {
  return tasks.filter(task => {
    if (!task.completed_date) return false
    const completedDate = new Date(task.completed_date)
    return completedDate >= startDate && completedDate <= endDate
  })
}

/**
 * Get task completion by date (for charts)
 */
export function getCompletionByDate(tasks, startDate, endDate) {
  const dateMap = {}
  
  // Initialize all dates in range with 0
  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    const dateKey = currentDate.toISOString().split('T')[0]
    dateMap[dateKey] = 0
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  // Count completions per date
  tasks.forEach(task => {
    if (task.completed_date) {
      const dateKey = new Date(task.completed_date).toISOString().split('T')[0]
      if (Object.hasOwn(dateMap, dateKey)) {
        dateMap[dateKey]++
      }
    }
  })
  
  return dateMap
}

/**
 * Get productivity score (0-100)
 */
export function getProductivityScore(tasks, goals) {
  let score = 0
  
  // 40% from task completion rate
  const completionRate = calculateCompletionRate(tasks)
  score += completionRate * 0.4
  
  // 30% from on-time completion
  const onTimeTasks = tasks.filter(t => {
    if (t.status !== 'completed' || !t.completed_date || !t.due_date) return false
    return new Date(t.completed_date) <= new Date(t.due_date)
  })
  const onTimeRate = tasks.length > 0 ? (onTimeTasks.length / tasks.length) * 100 : 0
  score += onTimeRate * 0.3
  
  // 30% from goal progress
  const activeGoals = goals.filter(g => g.status !== 'completed')
  if (activeGoals.length > 0) {
    const avgGoalProgress = activeGoals.reduce((sum, goal) => {
      return sum + calculateGoalProgress(goal, tasks)
    }, 0) / activeGoals.length
    score += avgGoalProgress * 0.3
  }
  
  return Math.round(score)
}

/**
 * Get streak (consecutive days with completed tasks)
 */
export function getCurrentStreak(tasks) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  let streak = 0
  let checkDate = new Date(today)
  
  while (true) {
    const dateKey = checkDate.toISOString().split('T')[0]
    const hasCompletion = tasks.some(task => {
      if (!task.completed_date) return false
      const completedDateKey = new Date(task.completed_date).toISOString().split('T')[0]
      return completedDateKey === dateKey
    })
    
    if (!hasCompletion) break
    
    streak++
    checkDate.setDate(checkDate.getDate() - 1)
  }
  
  return streak
}

/**
 * Get tasks by priority
 */
export function getTasksByPriority(tasks) {
  return {
    high: tasks.filter(t => t.priority === 'high').length,
    medium: tasks.filter(t => t.priority === 'medium').length,
    low: tasks.filter(t => t.priority === 'low').length
  }
}

/**
 * Get tasks by status
 */
export function getTasksByStatus(tasks) {
  return {
    todo: tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
    completed: tasks.filter(t => t.status === 'completed').length
  }
}

/**
 * Get average completion time (in days)
 */
export function getAverageCompletionTime(tasks) {
  const completedTasks = tasks.filter(t => 
    t.status === 'completed' && 
    t.completed_date &&
    (t.start_date || t.scheduled_date)
  ) 
  
  if (completedTasks.length === 0) return 0
  
  const totalDays = completedTasks.reduce((sum, task) => {
    const startDate = new Date(task.start_date || task.scheduled_date)
    const completedDate = new Date(task.completed_date)
    const days = Math.max(0, Math.floor((completedDate - startDate) / (1000 * 60 * 60 * 24)))
    return sum + days
  }, 0)
  
  return completedTasks.length > 0 ? Math.round(totalDays / completedTasks.length) : 0
}