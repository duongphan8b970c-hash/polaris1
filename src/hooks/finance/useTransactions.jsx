import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { formatNumber } from '../../utils'

export function useTransactions(filters = {}) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('financial_transactions')
        .select(`
          *,
          wallets!financial_transactions_wallet_id_fkey (
            id,
            name,
            currency,
            current_amount
          ),
          to_wallet:wallets!financial_transactions_to_wallet_id_fkey (
            id,
            name,
            currency
          ),
          categories (
            id,
            name,
            icon,
            type
          ),
          payback_goals (
            id,
            name,
            target_amount,
            status
          )
        `)
        .order('date', { ascending: false })
        .order('time', { ascending: false })

      // Apply filters
      if (filters.wallet_id) {
        query = query.or(`wallet_id.eq.${filters.wallet_id},to_wallet_id.eq.${filters.wallet_id}`)
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

      if (fetchError) throw fetchError

      setTransactions(data || [])
    } catch (err) {
      console.error('Error fetching transactions:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.wallet_id, filters.type, filters.category_id, filters.date_from, filters.date_to])

  const createTransaction = async (transactionData) => {
    try {
    // Inside createTransaction function, update transfer logic:
      if (transactionData.type === 'transfer') {
        const { wallet_id, to_wallet_id, amount, fee, description, date, time } = transactionData
        const transferAmount = Math.abs(parseFloat(amount))
        const transferFee = parseFloat(fee || 0)
        
        console.log('💸 Starting transfer:', {
          from: wallet_id,
          to: to_wallet_id,
          amount: transferAmount,
          fee: transferFee,
          time: time
        })

        // Get source wallet
        const { data: sourceWallet, error: sourceError } = await supabase
          .from('wallets')
          .select('id, name, current_amount, currency')
          .eq('id', wallet_id)
          .single()

        if (sourceError || !sourceWallet) {
          throw new Error('Không tìm thấy ví nguồn')
        }
        const { data: destWallet, error: destError } = await supabase
          .from('wallets')
          .select('id, name, currency')
          .eq('id', to_wallet_id)
          .single()

        if (destError || !destWallet) {
          throw new Error('Không tìm thấy ví đích')
        }
        // ✅ Check balance including fee
        const totalDeduction = transferAmount + transferFee
        if (sourceWallet.current_amount < totalDeduction) {
          const errorMsg = `Số dư không đủ trong ví "${sourceWallet.name}".\n` +
            `Hiện có: ${sourceWallet.current_amount.toLocaleString('vi-VN')} ${sourceWallet.currency}\n` +
            `Cần: ${totalDeduction.toLocaleString('vi-VN')} (${transferAmount.toLocaleString('vi-VN')} + ${transferFee.toLocaleString('vi-VN')} phí)`
          throw new Error(errorMsg)
        }

        // Generate transfer pair ID
        const transferPairId = `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        // ✅ 1. Create OUTGOING transaction (negative amount + fee)
        const { data: outgoingTxn, error: outgoingError } = await supabase
          .from('financial_transactions')
          .insert({
            wallet_id: wallet_id,
            type: 'transfer',
            amount: -(transferAmount + transferFee), // ✅ Include fee in deduction
            fee: transferFee, // ✅ Store fee
            description: description || `Chuyển đến ${destWallet.name}`,
            date: date,
            time: time,
            transfer_pair_id: transferPairId,
            to_wallet_id: to_wallet_id
          })
          .select()
          .single()

        if (outgoingError) throw outgoingError

        // ✅ 2. Create INCOMING transaction (positive amount, NO fee)
        const { data: incomingTxn, error: incomingError } = await supabase
          .from('financial_transactions')
          .insert({
            wallet_id: to_wallet_id,
            type: 'transfer',
            amount: transferAmount, // ✅ Only amount, no fee
            fee: 0, // ✅ No fee for incoming
            description: description || `Nhận từ ${sourceWallet.name}`,
            date: date,
            time: time,
            transfer_pair_id: transferPairId,
            to_wallet_id: wallet_id
          })
          .select()
          .single()

        if (incomingError) {
          // Rollback: delete outgoing if incoming fails
          await supabase
            .from('financial_transactions')
            .delete()
            .eq('id', outgoingTxn.id)
          throw incomingError
        }

        console.log('✅ Transfer completed with fee:', {
          outgoing: outgoingTxn,
          incoming: incomingTxn,
          fee: transferFee
        })

        await fetchTransactions()
        return { success: true, data: [outgoingTxn, incomingTxn] }
      } else {
        // ========================================
        // REGULAR TRANSACTION (INCOME/EXPENSE)
        // ========================================
        console.log('💳 Creating regular transaction:', transactionData.type)

        const { error } = await supabase
          .from('financial_transactions')
          .insert({
            wallet_id: transactionData.wallet_id,
            category_id: transactionData.category_id,
            type: transactionData.type,
            amount: transactionData.type === 'expense' 
              ? -Math.abs(parseFloat(transactionData.amount)) 
              : Math.abs(parseFloat(transactionData.amount)),
            description: transactionData.description,
            date: transactionData.date,
            time: transactionData.time || '12:00:00',
            payback_goal_id: transactionData.payback_goal_id || null,
            to_wallet_id: null,
            transfer_pair_id: null
          })

        if (error) {
          console.error('❌ Transaction error:', error)
          throw error
        }

        console.log('✅ Transaction created')

        // Update wallet balance manually
        const { data: walletData } = await supabase
          .from('wallets')
          .select('current_amount')
          .eq('id', transactionData.wallet_id)
          .single()

        const currentBalance = walletData?.current_amount || 0
        const amountChange = transactionData.type === 'expense'
          ? -Math.abs(parseFloat(transactionData.amount))
          : Math.abs(parseFloat(transactionData.amount))
        
        const newBalance = currentBalance + amountChange

        await supabase
          .from('wallets')
          .update({ current_amount: newBalance })
          .eq('id', transactionData.wallet_id)

        console.log(`✅ Wallet updated: ${currentBalance} → ${newBalance}`)
      }

      await fetchTransactions()
      return { success: true }
      
    } catch (err) {
      console.error('❌ Create transaction error:', err)
      return { success: false, error: err.message }
    }
  }

  const updateTransaction = async (id, transactionData) => {
    try {
      // Prevent updating transfers
      if (transactionData.type === 'transfer') {
        throw new Error('Không thể sửa giao dịch chuyển khoản. Vui lòng xóa và tạo lại.')
      }

      const { error } = await supabase
        .from('financial_transactions')
        .update({
          wallet_id: transactionData.wallet_id,
          category_id: transactionData.category_id,
          type: transactionData.type,
          amount: transactionData.type === 'expense' 
            ? -Math.abs(parseFloat(transactionData.amount)) 
            : Math.abs(parseFloat(transactionData.amount)),
          description: transactionData.description,
          date: transactionData.date,
          time: transactionData.time || '12:00:00',  
          payback_goal_id: transactionData.payback_goal_id || null,
        })
        .eq('id', id)

      if (error) throw error

      // Recalculate using SQL function
      await supabase.rpc('recalculate_all_wallet_balances')
      await fetchTransactions()
      return { success: true }
      
    } catch (err) {
      console.error('Error updating transaction:', err)
      return { success: false, error: err.message }
    }
  }

  const deleteTransaction = async (id, transactionData) => {
    try {
      console.log('🗑️ DELETE CALLED')
      console.log('Transaction ID:', id)
      console.log('Transaction data:', JSON.stringify(transactionData, null, 2))
      console.log('Type:', transactionData.type)
      console.log('Has transfer_pair_id?', !!transactionData.transfer_pair_id)

      // If deleting a transfer, delete BOTH sides
      if (transactionData.type === 'transfer' && transactionData.transfer_pair_id) {
        console.log('🔗 Attempting to delete transfer pair:', transactionData.transfer_pair_id)
        
        const { data: deletedData, error } = await supabase
          .from('financial_transactions')
          .delete()
          .eq('transfer_pair_id', transactionData.transfer_pair_id)
          .select()

        if (error) {
          console.error('❌ Delete transfer error:', error)
          throw error
        }
        
        console.log('✅ Deleted transactions:', deletedData)
        console.log('✅ Deleted count:', deletedData?.length)
      } else {
        console.log('💳 Deleting regular transaction:', id)
        
        const { data: deletedData, error } = await supabase
          .from('financial_transactions')
          .delete()
          .eq('id', id)
          .select()

        if (error) {
          console.error('❌ Delete error:', error)
          throw error
        }
        
        console.log('✅ Deleted transaction:', deletedData)
      }

      // Recalculate balances
      console.log('🔄 Recalculating balances...')
      const { error: recalcError } = await supabase.rpc('recalculate_all_wallet_balances')
      
      if (recalcError) {
        console.error('⚠️ Recalculation error:', recalcError)
      } else {
        console.log('✅ Balances recalculated')
      }

      await fetchTransactions()
      console.log('✅ Transactions refetched')
      return { success: true }
      
    } catch (err) {
      console.error('❌ DELETE FAILED:', err)
      return { success: false, error: err.message }
    }
  }

  return {
    transactions,
    loading,
    error,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    refetch: fetchTransactions
  }
}