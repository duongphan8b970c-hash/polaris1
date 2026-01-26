import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useBudgets() {
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchBudgets = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('budgets')
        .select(`
          *,
          category:categories(id, name, type, icon)
        `)
        .is('deleted_at', null)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      
      if (fetchError) throw fetchError
      setBudgets(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createBudget = async (budgetData) => {
    try {
      const { data, error: createError } = await supabase
        .from('budgets')
        .insert([{
          category_id: budgetData.category_id,
          amount: parseFloat(budgetData.amount),
          period: budgetData.period,
          start_date: budgetData.start_date,
        }])
        .select(`
          *,
          category:categories(id, name, type, icon)
        `)
        .single()
      
      if (createError) throw createError
      
      setBudgets(prev => [data, ...prev])
      return { success: true, data }
    } catch (err) {
      console.error('Error creating budget:', err)
      return { success: false, error: err.message }
    }
  }

  const updateBudget = async (id, budgetData) => {
    try {
      const { data, error: updateError } = await supabase
        .from('budgets')
        .update({
          amount: parseFloat(budgetData.amount),
          period: budgetData.period,
        })
        .eq('id', id)
        .select(`
          *,
          category:categories(id, name, type, icon)
        `)
        .single()
      
      if (updateError) throw updateError
      
      setBudgets(prev => prev.map(b => b.id === id ? data : b))
      return { success: true, data }
    } catch (err) {
      console.error('Error updating budget:', err)
      return { success: false, error: err.message }
    }
  }

  const deleteBudget = async (id) => {
    try {
      const { error: deleteError } = await supabase
        .from('budgets')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      
      if (deleteError) throw deleteError
      
      setBudgets(prev => prev.filter(b => b.id !== id))
      return { success: true }
    } catch (err) {
      console.error('Error deleting budget:', err)
      return { success: false, error: err.message }
    }
  }

  useEffect(() => {
    fetchBudgets()
  }, [])

  return {
    budgets,
    loading,
    error,
    createBudget,
    updateBudget,
    deleteBudget,
    refetch: fetchBudgets,
  }
}