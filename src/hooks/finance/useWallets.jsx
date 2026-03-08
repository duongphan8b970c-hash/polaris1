import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export function useWallets() {
  const [wallets, setWallets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchWallets = async () => {
    try {
      setLoading(true)
      
      // Fetch wallets with monthly snapshot data
      const { data: walletsData, error: walletsError } = await supabase
        .from('wallets')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
      
      if (walletsError) throw walletsError
      
      // Get current month's first day
      const currentMonth = new Date()
      currentMonth.setDate(1)
      currentMonth.setHours(0, 0, 0, 0)
      const monthKey = currentMonth.toISOString().split('T')[0]
      
      // Fetch monthly snapshots for current month
      const { data: snapshots, error: snapshotsError } = await supabase
        .from('wallet_monthly_snapshots')
        .select('*')
        .eq('month', monthKey)
      
      if (snapshotsError) throw snapshotsError
      
      // Merge snapshot data with wallets
      const walletsWithSnapshots = walletsData.map(wallet => {
        const snapshot = snapshots?.find(s => s.wallet_id === wallet.id)
        
        return {
          ...wallet,
          monthly_snapshot: snapshot ? {
            opening_balance: snapshot.opening_balance,
            total_income: snapshot.total_income || 0,
            total_expense: snapshot.total_expense || 0,
            month_change: (wallet.current_amount || 0) - (snapshot.opening_balance || 0)
          } : null
        }
      })
      
      setWallets(walletsWithSnapshots)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

    const createWallet = async (walletData) => {
    try {
      const initialAmount = parseFloat(walletData.initial_amount)
      
      console.log('Creating wallet with data:', walletData) // DEBUG
      
      const { data, error: createError } = await supabase
        .from('wallets')
        .insert([{
          name: walletData.name,
          type: walletData.type || 'other', // ✅ Ensure type is included
          currency: walletData.currency || 'VND',
          initial_amount: initialAmount,
          current_amount: initialAmount, // ✅ Current = Initial when creating
        }])
        .select()
        .single()
      
      if (createError) {
        console.error('Create wallet error:', createError) // DEBUG
        throw createError
      }
      
      // Create monthly snapshot for current month
      const currentMonth = new Date()
      currentMonth.setDate(1)
      currentMonth.setHours(0, 0, 0, 0)
      
      const { error: snapshotError } = await supabase
        .from('wallet_monthly_snapshots')
        .insert([{
          wallet_id: data.id,
          month: currentMonth.toISOString().split('T')[0],
          opening_balance: initialAmount
        }])
      
      if (snapshotError) {
        console.error('Snapshot error (non-critical):', snapshotError) // DEBUG
      }
      
      await fetchWallets()
      return { success: true, data }
    } catch (err) {
      console.error('Error creating wallet:', err)
      return { success: false, error: err.message }
    }
  }

  const updateWallet = async (id, walletData) => {
    try {
      const { data, error: updateError } = await supabase
        .from('wallets')
        .update({
          name: walletData.name,
          type: walletData.type,
          currency: walletData.currency,
          // initial_amount is NOT updated - it's immutable
        })
        .eq('id', id)
        .select()
        .single()
      
      if (updateError) throw updateError
      
      await fetchWallets()
      return { success: true, data }
    } catch (err) {
      console.error('Error updating wallet:', err)
      return { success: false, error: err.message }
    }
  }

  const resetWalletBalance = async (walletId, newBalance) => {
    try {
      const { data: wallet, error: fetchError } = await supabase
        .from('wallets')
        .select('id, name, currency, current_amount')
        .eq('id', walletId)
        .single()

      if (fetchError) throw fetchError

      const currentBalance = wallet.current_amount || 0
      const difference = newBalance - currentBalance

      if (difference === 0) {
        return { success: false, error: 'Số dư mới giống số dư hiện tại' }
      }

      // 1. Update wallet balance
      const { error: updateError } = await supabase
        .from('wallets')
        .update({ current_amount: newBalance })
        .eq('id', walletId)

      if (updateError) throw updateError

      // 2. Create correction transaction
      const transactionType = difference > 0 ? 'income' : 'expense'
      
      // ✅ FIX: Insert without category_id at all
      const { error: txnError } = await supabase
        .from('financial_transactions')
        .insert({
          wallet_id: walletId,
          type: transactionType,
          amount: Math.abs(difference),
          description: `Correct balance (${currentBalance.toLocaleString()} → ${newBalance.toLocaleString()})`,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().split(' ')[0]
          // ❌ NO category_id field at all
        })

      if (txnError) {
        console.error('❌ Transaction error:', txnError)
        throw txnError
      }

      // ✅ 3. Refetch wallets to update UI
      await fetchWallets()
      
      return { 
        success: true, 
        message: `✅ Đã reset ví "${wallet.name}" thành ${newBalance.toLocaleString()} ${wallet.currency}`
      }
    } catch (err) {
      console.error('❌ Error resetting wallet balance:', err)
      return { success: false, error: err.message }
    }
  }

  const getMonthlyReport = async (walletId, year, month) => {
    try {
      const monthKey = `${year}-${String(month).padStart(2, '0')}-01`
      
      const { data, error } = await supabase
        .from('wallet_monthly_snapshots')
        .select('*')
        .eq('wallet_id', walletId)
        .eq('month', monthKey)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      
      return data
    } catch (err) {
      console.error('Error fetching monthly report:', err)
      return null
    }
  }

  useEffect(() => {
    fetchWallets()
  }, [])

  return {
    wallets,
    loading,
    error,
    createWallet,
    updateWallet,
    resetWalletBalance,
    getMonthlyReport,
    refetch: fetchWallets,
  }
}