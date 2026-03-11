import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'

export function useWalletHistory(walletId, filters = {}) {
  const [transactions, setTransactions] = useState([])
  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchWalletHistory = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!walletId) {
        setTransactions([])
        setWallet(null)
        return
      }

      // Get wallet info
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('id', walletId)
        .single()

      if (walletError) throw walletError
      setWallet(walletData)

      // Build query for transactions
      let query = supabase
        .from('financial_transactions')
        .select(`
          *,
          categories (
            id,
            name,
            icon,
            type
          ),
          to_wallet:wallets!financial_transactions_to_wallet_id_fkey (
            id,
            name
          ),
          payback_goals (
            id,
            name
          )
        `)
        .or(`wallet_id.eq.${walletId},to_wallet_id.eq.${walletId}`)
        .order('date', { ascending: false })
        .order('time', { ascending: false })

      // Apply filters
      if (filters.type && filters.type !== 'all') {
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

      const { data: txnData, error: txnError } = await query

      if (txnError) throw txnError

      // Calculate running balance for each transaction
      const transactionsWithBalance = calculateRunningBalance(txnData, walletId, walletData.current_amount)

      setTransactions(transactionsWithBalance)

    } catch (err) {
      console.error('Error fetching wallet history:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWalletHistory()
  }, [walletId, filters.type, filters.category_id, filters.date_from, filters.date_to])

  // Calculate running balance (số dư lũy kế)
  const calculateRunningBalance = (transactions, currentWalletId, finalBalance) => {
    if (!transactions || transactions.length === 0) return []

    // Sort by date/time ascending to calculate from oldest
    const sorted = [...transactions].sort((a, b) => {
      const dateCompare = new Date(a.date) - new Date(b.date)
      if (dateCompare !== 0) return dateCompare
      return (a.time || '00:00:00').localeCompare(b.time || '00:00:00')
    })

    // Start from current balance and work backwards
    let runningBalance = finalBalance
    const result = []

    // Calculate backwards from newest to oldest
    for (let i = sorted.length - 1; i >= 0; i--) {
      const txn = sorted[i]
      
      // For this wallet, calculate the effect on balance
      let balanceChange = 0
      
      if (txn.type === 'transfer') {
        // Transfer: check if this wallet is sender or receiver
        if (txn.wallet_id === currentWalletId) {
          // This wallet is sender: subtract amount
          balanceChange = txn.amount // already negative with fee
        } else if (txn.to_wallet_id === currentWalletId) {
          // This wallet is receiver: add amount
          balanceChange = Math.abs(txn.amount)
        }
      } else {
        // Regular transaction: amount is already signed
        balanceChange = txn.amount
      }

      // The balance BEFORE this transaction
      const balanceBeforeTxn = runningBalance - balanceChange

      result.unshift({
        ...txn,
        balance_before: balanceBeforeTxn,
        balance_after: runningBalance,
        balance_change: balanceChange,
        is_inflow: txn.wallet_id === currentWalletId ? txn.amount > 0 : txn.to_wallet_id === currentWalletId
      })

      runningBalance = balanceBeforeTxn
    }

    return result
  }

  // Calculate statistics
  const stats = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return {
        totalInflow: 0,
        totalOutflow: 0,
        netChange: 0,
        transactionCount: 0,
        avgTransaction: 0,
        largestInflow: null,
        largestOutflow: null
      }
    }

    let totalInflow = 0
    let totalOutflow = 0
    let largestInflow = null
    let largestOutflow = null

    transactions.forEach(txn => {
      const change = txn.balance_change
      
      if (change > 0) {
        totalInflow += change
        if (!largestInflow || change > largestInflow.balance_change) {
          largestInflow = txn
        }
      } else if (change < 0) {
        totalOutflow += Math.abs(change)
        if (!largestOutflow || Math.abs(change) > Math.abs(largestOutflow.balance_change)) {
          largestOutflow = txn
        }
      }
    })

    return {
      totalInflow,
      totalOutflow,
      netChange: totalInflow - totalOutflow,
      transactionCount: transactions.length,
      avgTransaction: transactions.length > 0 ? (totalInflow + totalOutflow) / transactions.length : 0,
      largestInflow,
      largestOutflow
    }
  }, [transactions])

  return {
    transactions,
    wallet,
    stats,
    loading,
    error,
    refetch: fetchWalletHistory
  }
}