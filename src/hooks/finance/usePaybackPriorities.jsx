import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export function usePaybackPriorities() {
  const [priorities, setPriorities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchPriorities()
  }, [])

  const fetchPriorities = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('payback_priorities')
        .select('*')
        .order('sort_order', { ascending: true })

      if (fetchError) throw fetchError

      setPriorities(data || [])
    } catch (err) {
      console.error('Error fetching priorities:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createPriority = async (priorityData) => {
    try {
      const { data, error: createError } = await supabase
        .from('payback_priorities')
        .insert([{
          name: priorityData.name,
          description: priorityData.description || null,
          color: priorityData.color || '#6B7280',
          icon: priorityData.icon || '📌',
          sort_order: priorityData.sort_order || 999
        }])
        .select()
        .single()

      if (createError) throw createError

      await fetchPriorities()
      return { success: true, data }
    } catch (err) {
      console.error('Error creating priority:', err)
      return { success: false, error: err.message }
    }
  }

  const updatePriority = async (id, priorityData) => {
    try {
      const { data, error: updateError } = await supabase
        .from('payback_priorities')
        .update({
          name: priorityData.name,
          description: priorityData.description || null,
          color: priorityData.color || '#6B7280',
          icon: priorityData.icon || '📌',
          sort_order: priorityData.sort_order || 999,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      await fetchPriorities()
      return { success: true, data }
    } catch (err) {
      console.error('Error updating priority:', err)
      return { success: false, error: err.message }
    }
  }

  const deletePriority = async (id) => {
    try {
      // Check if priority is in use
      const { count } = await supabase
        .from('payback_goals')
        .select('id', { count: 'exact', head: true })
        .eq('priority_id', id)

      if (count > 0) {
        return { 
          success: false, 
          error: `Không thể xóa priority đang được sử dụng bởi ${count} mục tiêu` 
        }
      }

      const { error: deleteError } = await supabase
        .from('payback_priorities')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      await fetchPriorities()
      return { success: true }
    } catch (err) {
      console.error('Error deleting priority:', err)
      return { success: false, error: err.message }
    }
  }

  return {
    priorities,
    loading,
    error,
    createPriority,
    updatePriority,
    deletePriority,
    refetch: fetchPriorities
  }
}