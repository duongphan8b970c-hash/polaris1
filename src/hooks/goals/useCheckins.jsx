import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export function useCheckins(goalId = null, dateRange = {}) {
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCheckins = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      let query = supabase
        .from('checkin_calendar')
        .select(`
          *,
          goal:goals(id, name, icon, color),
          task:tasks(id, title),
          subtask:subtasks(id, title)
        `)
        .is('deleted_at', null)
        .order('date', { ascending: false })

      if (goalId) {
        query = query.eq('goal_id', goalId)
      }

      if (dateRange.from) {
        query = query.gte('date', dateRange.from)
      }

      if (dateRange.to) {
        query = query.lte('date', dateRange.to)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setCheckins(data || [])
    } catch (err) {
      console.error('Error fetching checkins:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createCheckin = async (checkinData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error: createError } = await supabase
        .from('checkin_calendar')
        .insert([{
          user_id: user.id,
          goal_id: checkinData.goal_id,
          task_id: checkinData.task_id || null,
          subtask_id: checkinData.subtask_id || null,
          date: checkinData.date,
          is_completed: checkinData.is_completed || false,
          notes: checkinData.notes || ''
        }])
        .select()
        .single()

      if (createError) throw createError

      await fetchCheckins()
      return { success: true, data }
    } catch (err) {
      console.error('Error creating checkin:', err)
      return { success: false, error: err.message }
    }
  }

  const updateCheckin = async (id, checkinData) => {
    try {
      const { data, error: updateError } = await supabase
        .from('checkin_calendar')
        .update({
          is_completed: checkinData.is_completed,
          notes: checkinData.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      await fetchCheckins()
      return { success: true, data }
    } catch (err) {
      console.error('Error updating checkin:', err)
      return { success: false, error: err.message }
    }
  }

  const toggleCheckin = async (id, currentStatus) => {
    return updateCheckin(id, { is_completed: !currentStatus })
  }

  const deleteCheckin = async (id) => {
    try {
      const { error: deleteError } = await supabase
        .from('checkin_calendar')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (deleteError) throw deleteError

      await fetchCheckins()
      return { success: true }
    } catch (err) {
      console.error('Error deleting checkin:', err)
      return { success: false, error: err.message }
    }
  }

  // Get checkin stats for a goal
  const getCheckinStats = async (goalId, startDate, endDate) => {
    try {
      const { data, error } = await supabase
        .from('checkin_calendar')
        .select('is_completed')
        .eq('goal_id', goalId)
        .gte('date', startDate)
        .lte('date', endDate)
        .is('deleted_at', null)

      if (error) throw error

      const total = data.length
      const completed = data.filter(c => c.is_completed).length
      const streak = calculateStreak(data)

      return {
        total,
        completed,
        completion_rate: total > 0 ? (completed / total) * 100 : 0,
        streak
      }
    } catch (err) {
      console.error('Error getting checkin stats:', err)
      return null
    }
  }

  const calculateStreak = (checkins) => {
    // Calculate current streak (consecutive days)
    let streak = 0
    const today = new Date().toISOString().split('T')[0]
    
    const sortedCheckins = [...checkins]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
    
    for (let i = 0; i < sortedCheckins.length; i++) {
      const checkin = sortedCheckins[i]
      if (!checkin.is_completed) break
      streak++
    }
    
    return streak
  }

  useEffect(() => {
    fetchCheckins()
  }, [goalId, dateRange.from, dateRange.to])

  return {
    checkins,
    loading,
    error,
    createCheckin,
    updateCheckin,
    toggleCheckin,
    deleteCheckin,
    getCheckinStats,
    refetch: fetchCheckins
  }
}