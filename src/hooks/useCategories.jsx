import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useCategories(type = null) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCategories = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('categories')
        .select('*')
        .is('deleted_at', null)
        .order('display_order', { ascending: true })
      
      if (type) {
        query = query.eq('type', type)
      }
      
      const { data, error: fetchError } = await query
      
      if (fetchError) throw fetchError
      setCategories(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createCategory = async (categoryData) => {
    try {
      const { data, error: createError } = await supabase
        .from('categories')
        .insert([{
          name: categoryData.name,
          type: categoryData.type,
          icon: categoryData.icon,
          is_active: categoryData.is_active,
          // color: removed
        }])
        .select()
        .single()
      
      if (createError) throw createError
      
      setCategories(prev => [data, ...prev])
      return { success: true, data }
    } catch (err) {
      console.error('Error creating category:', err)
      return { success: false, error: err.message }
    }
  }

  const updateCategory = async (id, categoryData) => {
    try {
      const { data, error: updateError } = await supabase
        .from('categories')
        .update({
          name: categoryData.name,
          type: categoryData.type,
          icon: categoryData.icon,
          is_active: categoryData.is_active,
          // color: removed
        })
        .eq('id', id)
        .select()
        .single()
      
      if (updateError) throw updateError
      
      setCategories(prev => prev.map(c => c.id === id ? data : c))
      return { success: true, data }
    } catch (err) {
      console.error('Error updating category:', err)
      return { success: false, error: err.message }
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [type])

  return {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    refetch: fetchCategories,
  }
}