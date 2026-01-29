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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.wallet_id, filters.type, filters.category_id, filters.date_from, filters.date_to])

  const createTransaction = async (transactionData) => {
    try {
      // ========================================
    // TRANSFER LOGIC WITH CURRENCY CONVERSION
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
        currency: sourceWallet.currency,
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
        .select('id, name, currency, current_amount')
        .eq('id', to_wallet_id)
        .single()

      if (destError || !destWallet) {
        console.error('❌ Destination wallet error:', destError)
        throw new Error('Không tìm thấy ví đích')
      }

      console.log('📥 Destination wallet:', {
        name: destWallet.name,
        currency: destWallet.currency
      })

      // ✅ 4. CHECK CURRENCY MISMATCH
      let convertedAmount = transferAmount
      let conversionRate = 1
      let conversionNote = ''

      if (sourceWallet.currency !== destWallet.currency) {
        // ⚠️ DIFFERENT CURRENCIES - NEED CONVERSION
        console.warn('⚠️ Currency mismatch:', sourceWallet.currency, '→', destWallet.currency)

        // Fetch exchange rate
        const { data: rateData, error: rateError } = await supabase
          .from('exchange_rates')
          .select('rate')
          .eq('from_currency', sourceWallet.currency)
          .eq('to_currency', destWallet.currency)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (rateError || !rateData) {
          // ❌ NO EXCHANGE RATE FOUND
          const errorMsg = `Không tìm thấy tỷ giá ${sourceWallet.currency} → ${destWallet.currency}.\n\n` +
            `Vui lòng:\n` +
            `1. Cập nhật tỷ giá tại Cài đặt > Tỷ giá\n` +
            `2. Hoặc chuyển giữa các ví cùng loại tiền`
          
          console.error('❌ No exchange rate found')
          throw new Error(errorMsg)
        }

        conversionRate = parseFloat(rateData.rate)
        convertedAmount = transferAmount * conversionRate

        conversionNote = ` (${transferAmount.toLocaleString('vi-VN')} ${sourceWallet.currency} × ${conversionRate} = ${convertedAmount.toLocaleString('vi-VN')} ${destWallet.currency})`

        console.log('💱 Currency conversion:', {
          from: sourceWallet.currency,
          to: destWallet.currency,
          rate: conversionRate,
          original: transferAmount,
          converted: convertedAmount
        })
      }

      // ✅ 5. GENERATE UNIQUE PAIR ID
      const transferPairId = self.crypto?.randomUUID 
        ? self.crypto.randomUUID() 
        : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      console.log('🔗 Transfer pair ID:', transferPairId)

      // ✅ 6. CREATE WITHDRAWAL TRANSACTION (NEGATIVE - SOURCE CURRENCY)
      const withdrawalData = {
        wallet_id: wallet_id,
        to_wallet_id: to_wallet_id,
        type: 'transfer',
        amount: -transferAmount, // Source currency amount (negative)
        description: description || `Chuyển → ${destWallet.name}${conversionNote}`,
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

      // ✅ 7. CREATE DEPOSIT TRANSACTION (POSITIVE - DESTINATION CURRENCY)
      const depositData = {
        wallet_id: to_wallet_id,
        to_wallet_id: wallet_id,
        type: 'transfer',
        amount: convertedAmount, // Converted amount (positive)
        description: description || `Nhận ← ${sourceWallet.name}${conversionNote}`,
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

      // ✅ 8. MANUALLY UPDATE WALLET BALANCES
      console.log('💾 Updating wallet balances...')

      // Update source wallet (subtract in source currency)
      const newSourceBalance = sourceWallet.current_amount - transferAmount
      const { error: updateSourceError } = await supabase
        .from('wallets')
        .update({ current_amount: newSourceBalance })
        .eq('id', wallet_id)

      if (updateSourceError) {
        console.error('⚠️ Source balance update error:', updateSourceError)
      } else {
        console.log(`✅ ${sourceWallet.name}: ${sourceWallet.current_amount} ${sourceWallet.currency} → ${newSourceBalance} ${sourceWallet.currency}`)
      }

      // Update destination wallet (add in destination currency)
      const newDestBalance = destWallet.current_amount + convertedAmount
      const { error: updateDestError } = await supabase
        .from('wallets')
        .update({ current_amount: newDestBalance })
        .eq('id', to_wallet_id)

      if (updateDestError) {
        console.error('⚠️ Destination balance update error:', updateDestError)
      } else {
        console.log(`✅ ${destWallet.name}: ${destWallet.current_amount} ${destWallet.currency} → ${newDestBalance} ${destWallet.currency}`)
      }

      // Show conversion summary if currencies differ
      if (sourceWallet.currency !== destWallet.currency) {
        console.log('💱 CONVERSION SUMMARY:')
        console.log(`   From: ${transferAmount.toLocaleString('vi-VN')} ${sourceWallet.currency}`)
        console.log(`   Rate: ${conversionRate}`)
        console.log(`   To:   ${convertedAmount.toLocaleString('vi-VN')} ${destWallet.currency}`)
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