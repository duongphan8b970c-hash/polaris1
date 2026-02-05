import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export function useSubtasks(taskId) {
  const [subtasks, setSubtasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchSubtasks = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!taskId) {
        setSubtasks([])
        setLoading(false)
        return
      }

      const { data, error: fetchError } = await supabase
        .from('subtasks')
        .select('*')
        .eq('task_id', taskId)
        .is('deleted_at', null)
        .order('display_order', { ascending: true })

      if (fetchError) throw fetchError

      setSubtasks(data || [])
    } catch (err) {
      console.error('Error fetching subtasks:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ✅ FIXED: createSubtask
  const createSubtask = async (subtaskData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Get current max display_order
      const { data: existingSubtasks, error: fetchError } = await supabase
        .from('subtasks')
        .select('display_order')
        .eq('task_id', taskId)
        .is('deleted_at', null)
        .order('display_order', { ascending: false })
        .limit(1)

      let nextOrder = 0
      if (!fetchError && existingSubtasks && existingSubtasks.length > 0) {
        nextOrder = existingSubtasks[0].display_order + 1
      }

      const { data, error: createError } = await supabase
        .from('subtasks')
        .insert([{
          user_id: user.id,
          task_id: taskId,
          title: subtaskData.title,
          description: subtaskData.description || null,
          display_order: nextOrder
        }])
        .select()
        .single()

      if (createError) {
        console.error('❌ Create subtask error:', createError)
        throw createError
      }

      await fetchSubtasks()
      return { success: true, data }
    } catch (err) {
      console.error('❌ Error creating subtask:', err)
      return { success: false, error: err.message }
    }
  }

  const updateSubtask = async (id, subtaskData) => {
    try {
      const { data, error: updateError } = await supabase
        .from('subtasks')
        .update({
          title: subtaskData.title,
          description: subtaskData.description,
          is_completed: subtaskData.is_completed
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      await fetchSubtasks()
      return { success: true, data }
    } catch (err) {
      console.error('Error updating subtask:', err)
      return { success: false, error: err.message }
    }
  }

  // ✅ FIXED: toggleSubtask
  const toggleSubtask = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === true ? false : true
      
      const updateData = {
        is_completed: newStatus
      }

      if (newStatus === true) {
        updateData.completed_date = new Date().toISOString()
      } else {
        updateData.completed_date = null
      }

      console.log('🔄 Toggling subtask:', { id, currentStatus, newStatus })

      const { data, error: updateError } = await supabase
        .from('subtasks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        console.error('❌ Toggle error:', updateError)
        throw updateError
      }

      console.log('✅ Subtask toggled successfully')
      await fetchSubtasks()
      return { success: true, data }
    } catch (err) {
      console.error('❌ Error toggling subtask:', err)
      return { success: false, error: err.message }
    }
  }

  const deleteSubtask = async (id) => {
    try {
      const { error: deleteError } = await supabase
        .from('subtasks')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (deleteError) throw deleteError

      await fetchSubtasks()
      return { success: true }
    } catch (err) {
      console.error('Error deleting subtask:', err)
      return { success: false, error: err.message }
    }
  }

  const reorderSubtasks = async (reorderedSubtasks) => {
    try {
      const updates = reorderedSubtasks.map((subtask, index) => 
        supabase
          .from('subtasks')
          .update({ display_order: index })
          .eq('id', subtask.id)
      )

      await Promise.all(updates)
      await fetchSubtasks()
      return { success: true }
    } catch (err) {
      console.error('Error reordering subtasks:', err)
      return { success: false, error: err.message }
    }
  }

  useEffect(() => {
    fetchSubtasks()
  }, [taskId])

  return {
    subtasks,
    loading,
    error,
    createSubtask,
    updateSubtask,
    toggleSubtask,
    deleteSubtask,
    reorderSubtasks,
    refetch: fetchSubtasks
  }
}