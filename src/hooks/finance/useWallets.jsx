import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { recalculateAllWalletBalances } from '../../utils/walletBalance'

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
    // 1. Get wallet info
    const { data: wallet, error: fetchError } = await supabase
      .from('wallets')
      .select('id, name, currency, current_amount')
      .eq('id', walletId)
      .single()

    if (fetchError) throw fetchError

    const currentBalance = parseFloat(wallet.current_amount || 0)
    const parsedNewBalance = parseFloat(newBalance)
    const difference = parsedNewBalance - currentBalance

    if (difference === 0) {
      return { success: false, error: 'Số dư mới giống số dư hiện tại' }
    }

    // 2. Determine transaction type and get category
    const isIncrease = difference > 0
    const transactionType = isIncrease ? 'income' : 'expense'

    // Get any category of the appropriate type
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('type', transactionType)
      .limit(1)
      .single()

    if (categoryError || !category) {
      throw new Error(`Không tìm thấy danh mục ${transactionType}. Vui lòng tạo ít nhất 1 danh mục trước.`)
    }

    // 3. Create Balance Correction transaction
    const { error: transactionError } = await supabase
      .from('financial_transactions')
      .insert({
        wallet_id: walletId,
        category_id: category.id,
        type: transactionType,
        currency: wallet.currency,
        amount: isIncrease 
          ? Math.abs(difference)   // Income: positive
          : -Math.abs(difference), // Expense: NEGATIVE
        description: `⚖️ Balance Correction: ${currentBalance.toLocaleString()} → ${parsedNewBalance.toLocaleString()} ${wallet.currency}`,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 8)
      })
      .select()
      .single()

    if (transactionError) throw transactionError

    // 4. Recalculate wallet balances
    await recalculateAllWalletBalances()

    // 5. Refetch wallets
    await fetchWallets()
    
    return { 
      success: true, 
      message: `Đã điều chỉnh số dư ${isIncrease ? '+' : ''}${difference.toLocaleString()} ${wallet.currency}`
    }
  } catch (err) {
    console.error('Error resetting wallet balance:', err)
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

  const recalculateBalances = async () => {
    try {
      const updatedCount = await recalculateAllWalletBalances()
      await fetchWallets()
      return { success: true, updatedCount }
    } catch (err) {
      console.error('Error recalculating balances:', err)
      return { success: false, error: err.message }
    }
  }

  return {
    wallets,
    loading,
    error,
    createWallet,
    updateWallet,
    resetWalletBalance,
    deleteWallet,
    getMonthlyReport,
    recalculateBalances,
    refetch: fetchWallets
  }
}