import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

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
          )
        `)
        .order('date', { ascending: false })

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
  }, [filters.wallet_id, filters.type, filters.category_id, filters.date_from, filters.date_to])

  const createTransaction = async (transactionData) => {
    try {
      // ========================================
      // TRANSFER LOGIC
      // ========================================
      if (transactionData.type === 'transfer') {
        const { wallet_id, to_wallet_id, amount, description, date } = transactionData
        const transferAmount = Math.abs(parseFloat(amount))

        console.log('💸 Starting transfer:', {
          from: wallet_id,
          to: to_wallet_id,
          amount: transferAmount
        })

        // ✅ 1. GET SOURCE WALLET WITH CURRENT BALANCE
        const { data: sourceWallet, error: sourceError } = await supabase
          .from('wallets')
          .select('id, name, current_amount, currency')
          .eq('id', wallet_id)
          .single()

        if (sourceError || !sourceWallet) {
          console.error('❌ Source wallet error:', sourceError)
          throw new Error('Không tìm thấy ví nguồn')
        }

        console.log('💰 Source wallet:', {
          name: sourceWallet.name,
          current: sourceWallet.current_amount,
          needed: transferAmount
        })

        // ✅ 2. CHECK SOURCE BALANCE
        if (sourceWallet.current_amount < transferAmount) {
          const errorMsg = `Số dư không đủ trong ví "${sourceWallet.name}".\n` +
            `Hiện có: ${sourceWallet.current_amount.toLocaleString('vi-VN')} ${sourceWallet.currency}\n` +
            `Cần: ${transferAmount.toLocaleString('vi-VN')} ${sourceWallet.currency}`
          
          console.error('❌ Insufficient balance')
          throw new Error(errorMsg)
        }

        // ✅ 3. GET DESTINATION WALLET
        const { data: destWallet, error: destError } = await supabase
          .from('wallets')
          .select('id, name, currency')
          .eq('id', to_wallet_id)
          .single()

        if (destError || !destWallet) {
          console.error('❌ Destination wallet error:', destError)
          throw new Error('Không tìm thấy ví đích')
        }

        console.log('📥 Destination wallet:', destWallet.name)

        // ✅ 4. GENERATE UNIQUE PAIR ID
        const transferPairId = self.crypto?.randomUUID 
          ? self.crypto.randomUUID() 
          : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        console.log('🔗 Transfer pair ID:', transferPairId)

        // ✅ 5. CREATE WITHDRAWAL TRANSACTION (NEGATIVE)
        const withdrawalData = {
          wallet_id: wallet_id,
          to_wallet_id: to_wallet_id,
          type: 'transfer',
          amount: -transferAmount, // ⚠️ NEGATIVE
          description: description || `Chuyển → ${destWallet.name}`,
          date: date,
          category_id: null,
          transfer_pair_id: transferPairId
        }

        console.log('➖ Creating withdrawal:', withdrawalData)

        const { error: withdrawError } = await supabase
          .from('financial_transactions')
          .insert(withdrawalData)

        if (withdrawError) {
          console.error('❌ Withdrawal error:', withdrawError)
          throw new Error('Lỗi tạo giao dịch rút: ' + withdrawError.message)
        }

        console.log('✅ Withdrawal created')

        // ✅ 6. CREATE DEPOSIT TRANSACTION (POSITIVE)
        const depositData = {
          wallet_id: to_wallet_id,
          to_wallet_id: wallet_id,
          type: 'transfer',
          amount: transferAmount, // ⚠️ POSITIVE
          description: description || `Nhận ← ${sourceWallet.name}`,
          date: date,
          category_id: null,
          transfer_pair_id: transferPairId
        }

        console.log('➕ Creating deposit:', depositData)

        const { error: depositError } = await supabase
          .from('financial_transactions')
          .insert(depositData)

        if (depositError) {
          console.error('❌ Deposit error:', depositError)
          
          // ⚠️ ROLLBACK: Delete withdrawal if deposit fails
          console.log('🔄 Rolling back withdrawal...')
          await supabase
            .from('financial_transactions')
            .delete()
            .eq('transfer_pair_id', transferPairId)
          
          throw new Error('Lỗi tạo giao dịch nạp: ' + depositError.message)
        }

        console.log('✅ Deposit created')

        // ✅ 7. MANUALLY UPDATE WALLET BALANCES
        console.log('💾 Updating wallet balances...')

        // Update source wallet (subtract)
        const newSourceBalance = sourceWallet.current_amount - transferAmount
        const { error: updateSourceError } = await supabase
          .from('wallets')
          .update({ current_amount: newSourceBalance })
          .eq('id', wallet_id)

        if (updateSourceError) {
          console.error('⚠️ Source balance update error:', updateSourceError)
        } else {
          console.log(`✅ ${sourceWallet.name}: ${sourceWallet.current_amount} → ${newSourceBalance}`)
        }

        // Get destination current balance
        const { data: destCurrentData } = await supabase
          .from('wallets')
          .select('current_amount')
          .eq('id', to_wallet_id)
          .single()

        const destCurrentBalance = destCurrentData?.current_amount || 0
        const newDestBalance = destCurrentBalance + transferAmount

        // Update destination wallet (add)
        const { error: updateDestError } = await supabase
          .from('wallets')
          .update({ current_amount: newDestBalance })
          .eq('id', to_wallet_id)

        if (updateDestError) {
          console.error('⚠️ Destination balance update error:', updateDestError)
        } else {
          console.log(`✅ ${destWallet.name}: ${destCurrentBalance} → ${newDestBalance}`)
        }

        console.log('🎉 Transfer completed successfully!')

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
      console.log('🗑️ Deleting transaction:', id, transactionData.type)

      // If deleting a transfer, delete BOTH sides
      if (transactionData.type === 'transfer' && transactionData.transfer_pair_id) {
        console.log('🔗 Deleting transfer pair:', transactionData.transfer_pair_id)
        
        const { error } = await supabase
          .from('financial_transactions')
          .delete()
          .eq('transfer_pair_id', transactionData.transfer_pair_id)

        if (error) {
          console.error('❌ Delete transfer error:', error)
          throw error
        }
        
        console.log('✅ Transfer pair deleted')
      } else {
        // Regular delete
        const { error } = await supabase
          .from('financial_transactions')
          .delete()
          .eq('id', id)

        if (error) {
          console.error('❌ Delete error:', error)
          throw error
        }
        
        console.log('✅ Transaction deleted')
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
      return { success: true }
      
    } catch (err) {
      console.error('❌ Delete transaction error:', err)
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