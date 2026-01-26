import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useTransactions(filters = {}) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Create stable filter string to avoid infinite loop
  const filterKey = JSON.stringify(filters)

  useEffect(() => {
    fetchTransactions()
  }, [filterKey]) // ✅ Use string instead of object

  const fetchTransactions = async () => {
    try {
      console.log('🔄 Fetching transactions with filters:', filters)
      setLoading(true)
      setError(null)
      
      let query = supabase
        .from('financial_transactions')
        .select(`
          *,
          wallet:wallets(id, name, currency),
          category:categories(id, name, type, icon)
        `)
        .is('deleted_at', null)
        .order('date', { ascending: false })
        .limit(100)
      
      // Apply filters
      if (filters.wallet_id) {
        query = query.eq('wallet_id', filters.wallet_id)
      }
      
      if (filters.type) {
        query = query.eq('type', filters.type)
      }
      
      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id)
      }
      
      if (filters.date_from) {
        query = query.gte('date', filters.date_from)
      }
      
      if (filters.date_to) {
        query = query.lte('date', filters.date_to)
      }
      
      const { data, error: fetchError } = await query
      
      console.log('✅ Transactions fetched:', data?.length || 0)
      
      if (fetchError) {
        console.error('❌ Fetch error:', fetchError)
        throw fetchError
      }
      
      setTransactions(data || [])
      setLoading(false)
    } catch (err) {
      console.error('❌ Error:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  const createTransaction = async (transactionData) => {
    try {
      const { data, error: createError } = await supabase
        .from('financial_transactions')
        .insert([{
          wallet_id: transactionData.wallet_id,
          category_id: transactionData.category_id,
          type: transactionData.type,
          amount: parseFloat(transactionData.amount),
          description: transactionData.description,
          date: transactionData.date,
        }])
        .select(`
          *,
          wallet:wallets(id, name, currency),
          category:categories(id, name, type, icon)
        `)
        .single()
      
      if (createError) throw createError
      
      setTransactions(prev => [data, ...prev])
      return { success: true, data }
    } catch (err) {
      console.error('Error creating transaction:', err)
      return { success: false, error: err.message }
    }
  }

  const updateTransaction = async (id, transactionData) => {
    try {
      const { data, error: updateError } = await supabase
        .from('financial_transactions')
        .update({
          wallet_id: transactionData.wallet_id,
          category_id: transactionData.category_id,
          type: transactionData.type,
          amount: parseFloat(transactionData.amount),
          description: transactionData.description,
          date: transactionData.date,
        })
        .eq('id', id)
        .select(`
          *,
          wallet:wallets(id, name, currency),
          category:categories(id, name, type, icon)
        `)
        .single()
      
      if (updateError) throw updateError
      
      setTransactions(prev => prev.map(t => t.id === id ? data : t))
      return { success: true, data }
    } catch (err) {
      console.error('Error updating transaction:', err)
      return { success: false, error: err.message }
    }
  }

  return {
    transactions,
    loading,
    error,
    createTransaction,
    updateTransaction,
    refetch: fetchTransactions,
  }
}