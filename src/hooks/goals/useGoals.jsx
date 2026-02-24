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
        .select(`
          *,
          assigned_to,
          created_by
        `)
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

      console.log('🔵 useGoals - createGoal called')
      console.log('🔵 Raw goalData:', goalData)
      console.log('🔵 goalData.assigned_to:', goalData.assigned_to)
      console.log('🔵 Type:', Array.isArray(goalData.assigned_to))
      console.log('🔵 Length:', goalData.assigned_to?.length)

      // ✅ CRITICAL: Ensure assigned_to is proper array
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
        target_value: goalData.target_value || null,
        current_value: goalData.current_value || 0,
        is_checkin_enabled: goalData.is_checkin_enabled || false,
        checkin_frequency: goalData.checkin_frequency || 'daily',
        checkin_days_per_week: goalData.checkin_days_per_week || 7,
        checkin_target_days: goalData.checkin_target_days || null,
        assigned_to: goalData.assigned_to || [], // ✅ CRITICAL
      }

      console.log('🔵 Insert payload:', insertPayload)
      console.log('🔵 Payload.assigned_to:', insertPayload.assigned_to)
      console.log('🔵 Payload.assigned_to type:', Array.isArray(insertPayload.assigned_to))
      console.log('🔵 Payload.assigned_to length:', insertPayload.assigned_to?.length)

      const { data, error: createError } = await supabase
        .from('goals')
        .insert([insertPayload])
        .select('*, assigned_to, created_by') // ✅ CRITICAL: Select back
        .single()

      if (createError) {
        console.error('❌ Create error:', createError)
        throw createError
      }

      console.log('✅ Goal created successfully!')
      console.log('✅ Returned data:', data)
      console.log('✅ data.assigned_to:', data.assigned_to)
      console.log('✅ data.assigned_to length:', data.assigned_to?.length)

      await fetchGoals()
      return { success: true, data }
    } catch (err) {
      console.error('❌ Error creating goal:', err)
      return { success: false, error: err.message }
    }
  }

  const updateGoal = async (id, goalData) => {
    try {
      console.log('🔵 useGoals - updateGoal called')
      console.log('🔵 Goal ID:', id)
      console.log('🔵 goalData:', goalData)

      const updatePayload = {
        name: goalData.name,
        description: goalData.description || null,
        icon: goalData.icon,
        color: goalData.color,
        category: goalData.category,
        priority: goalData.priority,
        start_date: goalData.start_date || null,
        target_date: goalData.target_date || null,
        end_date: goalData.end_date || null,
        target_value: goalData.target_value || null,
        current_value: goalData.current_value,
        is_checkin_enabled: goalData.is_checkin_enabled || false,
        checkin_frequency: goalData.checkin_frequency || 'daily',
        checkin_days_per_week: goalData.checkin_days_per_week || 7,
        checkin_target_days: goalData.checkin_target_days || null,
        assigned_to: goalData.assigned_to || [], // ✅ CRITICAL
      }

      console.log('🔵 Update payload:', updatePayload)

      const { data, error: updateError } = await supabase
        .from('goals')
        .update(updatePayload)
        .eq('id', id)
        .select('*, assigned_to, created_by')
        .single()

      if (updateError) {
        console.error('❌ Update error:', updateError)
        throw updateError
      }

      console.log('✅ Goal updated:', data)

      await fetchGoals()
      return { success: true, data }
    } catch (err) {
      console.error('❌ Error updating goal:', err)
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

  const updateGoalProgress = async (id, currentValue) => {
    try {
      const { error: updateError } = await supabase
        .from('goals')
        .update({ current_value: currentValue })
        .eq('id', id)

      if (updateError) throw updateError

      await fetchGoals()
      return { success: true }
    } catch (err) {
      console.error('Error updating progress:', err)
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
    updateGoal,
    deleteGoal,
    updateGoalProgress,
    refetch: fetchGoals,
  }
}