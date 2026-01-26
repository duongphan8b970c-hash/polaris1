import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useTransactions(filters = {}) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchTransactions()
  }, []) // Empty dependency - only run once

  const fetchTransactions = async () => {
    try {
      console.log('🔄 Fetching transactions...') // DEBUG
      setLoading(true)
      setError(null)
      
      const { data, error: fetchError } = await supabase
        .from('financial_transactions')
        .select(`
          *,
          wallet:wallets(id, name, currency),
          category:categories(id, name, type)
        `)
        .is('deleted_at', null)
        .order('date', { ascending: false })
        .limit(100)
      
      console.log('✅ Transactions fetched:', data?.length || 0) // DEBUG
      
      if (fetchError) {
        console.error('❌ Fetch error:', fetchError) // DEBUG
        throw fetchError
      }
      
      setTransactions(data || [])
      setLoading(false)
    } catch (err) {
      console.error('❌ Error:', err) // DEBUG
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
          category:categories(id, name, type)
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
          category:categories(id, name, type)
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