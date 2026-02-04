import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export function useGoalCategories(goalId = null) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCategories = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      let query = supabase
        .from('goal_categories')
        .select(`
          *,
          goal:goals(
            id,
            name,
            icon
          )
        `)
        .is('deleted_at', null)
        .order('display_order', { ascending: true })

      if (goalId) {
        query = query.eq('goal_id', goalId)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setCategories(data || [])
    } catch (err) {
      console.error('Error fetching goal categories:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createCategory = async (categoryData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error: createError } = await supabase
        .from('goal_categories')
        .insert([{
          user_id: user.id,
          goal_id: categoryData.goal_id,
          name: categoryData.name,
          description: categoryData.description,
          icon: categoryData.icon || '📁',
          color: categoryData.color || '#6B7280',
          display_order: categories.length
        }])
        .select()
        .single()

      if (createError) throw createError

      await fetchCategories()
      return { success: true, data }
    } catch (err) {
      console.error('Error creating category:', err)
      return { success: false, error: err.message }
    }
  }

  const updateCategory = async (id, categoryData) => {
    try {
      const { data, error: updateError } = await supabase
        .from('goal_categories')
        .update({
          name: categoryData.name,
          description: categoryData.description,
          icon: categoryData.icon,
          color: categoryData.color,
          is_active: categoryData.is_active
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      await fetchCategories()
      return { success: true, data }
    } catch (err) {
      console.error('Error updating category:', err)
      return { success: false, error: err.message }
    }
  }

  const deleteCategory = async (id) => {
    try {
      const { error: deleteError } = await supabase
        .from('goal_categories')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (deleteError) throw deleteError

      await fetchCategories()
      return { success: true }
    } catch (err) {
      console.error('Error deleting category:', err)
      return { success: false, error: err.message }
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [goalId])

  return {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories
  }
}