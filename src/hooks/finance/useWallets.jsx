import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export function useWallets() {
  const [wallets, setWallets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchWallets = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data: walletsData, error: walletsError } = await supabase
        .from('wallets')
        .select('*')
        .is('deleted_at', null)
        .order('name')

      if (walletsError) throw walletsError

      const currentMonth = new Date()
      currentMonth.setDate(1)
      currentMonth.setHours(0, 0, 0, 0)
      const monthKey = currentMonth.toISOString().split('T')[0]

      const { data: snapshots, error: snapshotsError } = await supabase
        .from('wallet_monthly_snapshots')
        .select('*')
        .in('wallet_id', walletsData.map(w => w.id))
        .eq('month', monthKey)

      if (snapshotsError) throw snapshotsError

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

  useEffect(() => {
    fetchWallets()
  }, [])

  const createWallet = async (walletData) => {
    try {
      const initialAmount = parseFloat(walletData.initial_amount)
      
      const { data, error: createError } = await supabase
        .from('wallets')
        .insert([{
          name: walletData.name,
          type: walletData.type || 'other',
          currency: walletData.currency || 'VND',
          initial_amount: initialAmount,
          current_amount: initialAmount,
        }])
        .select()
        .single()
      
      if (createError) throw createError
      
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
        console.error('Snapshot error (non-critical):', snapshotError)
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
      console.log('🔄 Resetting wallet balance:', { walletId, newBalance })

      // 1. Get wallet info
      const { data: wallet, error: fetchError } = await supabase
        .from('wallets')
        .select('id, name, currency, current_amount, initial_amount')
        .eq('id', walletId)
        .single()

      if (fetchError) throw fetchError

      const currentBalance = parseFloat(wallet.current_amount || 0)
      const parsedNewBalance = parseFloat(newBalance)
      const difference = parsedNewBalance - currentBalance

      console.log('💰 Balance info:', {
        current: currentBalance,
        new: parsedNewBalance,
        difference: difference
      })

      if (difference === 0) {
        return { success: false, error: 'Số dư mới giống số dư hiện tại' }
      }

      // 2. Get or create "Balance Correction" category
      let correctionCategory
      const { data: existingCategory } = await supabase
        .from('categories')
        .select('id')
        .eq('name', 'Balance Correction')
        .eq('type', difference > 0 ? 'income' : 'expense')
        .single()

      if (existingCategory) {
        correctionCategory = existingCategory
      } else {
        // Create Balance Correction category if not exists
        const { data: newCategory, error: categoryError } = await supabase
          .from('categories')
          .insert({
            name: 'Balance Correction',
            type: difference > 0 ? 'income' : 'expense',
            icon: '⚖️'
          })
          .select()
          .single()

        if (categoryError) throw categoryError
        correctionCategory = newCategory
      }

      console.log('📂 Using category:', correctionCategory.id)

      // 3. Create Balance Correction transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('financial_transactions')
        .insert({
          wallet_id: walletId,
          category_id: correctionCategory.id,
          type: difference > 0 ? 'income' : 'expense',
          amount: Math.abs(difference), // Always positive, type determines direction
          description: `Điều chỉnh số dư: ${currentBalance.toLocaleString()} → ${parsedNewBalance.toLocaleString()} ${wallet.currency}`,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().slice(0, 8)
        })
        .select()
        .single()

      if (transactionError) {
        console.error('❌ Transaction error:', transactionError)
        throw transactionError
      }

      console.log('✅ Balance correction transaction created:', transaction.id)

      // 4. Recalculate wallet balance (triggers will handle this)
      const { error: recalcError } = await supabase.rpc('recalculate_all_wallet_balances')
      
      if (recalcError) {
        console.error('⚠️ Recalculation error:', recalcError)
      }

      // 5. Refetch wallets
      await fetchWallets()
      
      return { 
        success: true, 
        message: `✅ Đã tạo giao dịch điều chỉnh ${Math.abs(difference).toLocaleString()} ${wallet.currency}`
      }
    } catch (err) {
      console.error('❌ Error resetting wallet balance:', err)
      return { success: false, error: err.message }
    }
  }

  const deleteWallet = async (id) => {
    try {
      const { error } = await supabase
        .from('wallets')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      await fetchWallets()
      return { success: true }
    } catch (err) {
      console.error('Error deleting wallet:', err)
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
      console.error('Error getting monthly report:', err)
      return null
    }
  }

  return {
    wallets,
    loading,
    error,
    createWallet,
    updateWallet,
    resetWalletBalance, // ✅ Export this
    deleteWallet,
    getMonthlyReport,
    refetch: fetchWallets
  }
}