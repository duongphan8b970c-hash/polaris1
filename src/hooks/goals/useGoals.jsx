import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export function useGoals() {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchGoals = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error: fetchError } = await supabase
        .from('goals')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setGoals(data || [])
    } catch (err) {
      console.error('Error fetching goals:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createGoal = async (goalData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const insertPayload = {
        user_id: user.id,
        name: goalData.name,
        description: goalData.description || null,
        icon: goalData.icon,
        color: goalData.color,
        category: goalData.category,
        priority: goalData.priority || 'medium',
        start_date: goalData.start_date || null,
        target_date: goalData.target_date || null,
        end_date: goalData.end_date || null,
        current_value: 0,
        is_checkin_enabled: goalData.is_checkin_enabled || false,
        checkin_frequency: goalData.checkin_frequency || 'daily',
        checkin_days_per_week: goalData.checkin_days_per_week || 7,
        checkin_target_days: goalData.checkin_target_days || null,
        assigned_to: goalData.assigned_to || [],
      }

      const { data, error: createError } = await supabase
        .from('goals')
        .insert([insertPayload])
        .select('*')
        .single()

      if (createError) throw createError

      await fetchGoals() // ✅ Refresh list
      return { success: true, data }
    } catch (err) {
      console.error('Error creating goal:', err)
      return { success: false, error: err.message }
    }
  }

  // ✅ ADD: updateGoal function
  const updateGoal = async (id, goalData) => {
    try {
      console.log('🔵 Updating goal:', id, goalData)

      const { data, error: updateError } = await supabase
        .from('goals')
        .update(goalData)
        .eq('id', id)
        .select('*')
        .single()

      if (updateError) throw updateError

      console.log('✅ Goal updated:', data)

      // ✅ CRITICAL: Immediately update local state
      setGoals(prevGoals => 
        prevGoals.map(g => g.id === id ? data : g)
      )

      return { success: true, data }
    } catch (err) {
      console.error('Error updating goal:', err)
      return { success: false, error: err.message }
    }
  }

  const deleteGoal = async (id) => {
    try {
      const { error: deleteError } = await supabase
        .from('goals')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (deleteError) throw deleteError

      await fetchGoals()
      return { success: true }
    } catch (err) {
      console.error('Error deleting goal:', err)
      return { success: false, error: err.message }
    }
  }

  useEffect(() => {
    fetchGoals()
  }, [])

  return {
    goals,
    loading,
    error,
    createGoal,
    updateGoal, // ✅ Export updateGoal
    deleteGoal,
    refetch: fetchGoals,
  }
}