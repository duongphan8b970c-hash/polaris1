import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { getExchangeRate } from '../../utils/currency'

export function useTransactions(filters = {}) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch transactions without FK joins (works even without FK constraints)
      let query = supabase
        .from('financial_transactions')
        .select('*')
        .order('date', { ascending: false })
        .order('time', { ascending: false })

      // Apply filters
      if (filters.wallet_id) {
        query = query.eq('wallet_id', filters.wallet_id)
      }
      if (filters.type) {
        query = query.eq('type', filters.type)
      }
      if (filters.category_ids && Array.isArray(filters.category_ids) && filters.category_ids.length > 0) {
        query = query.in('category_id', filters.category_ids)
      } else if (filters.category_id) {
        query = query.eq('category_id', filters.category_id)
      }
      if (filters.date_from) {
        query = query.gte('date', filters.date_from)
      }
      if (filters.date_to) {
        query = query.lte('date', filters.date_to)
      }

      const { data: txnData, error: fetchError } = await query
      if (fetchError) throw fetchError

      const txns = txnData || []

      // Fetch related data in parallel (no FK constraints needed)
      const walletIds = [...new Set(txns.map(t => t.wallet_id).filter(Boolean))]
      const toWalletIds = [...new Set(txns.map(t => t.to_wallet_id).filter(Boolean))]
      const categoryIds = [...new Set(txns.map(t => t.category_id).filter(Boolean))]
      const goalIds = [...new Set(txns.map(t => t.payback_goal_id).filter(Boolean))]

      const allWalletIds = [...new Set([...walletIds, ...toWalletIds])]

      const [walletsRes, categoriesRes, goalsRes] = await Promise.all([
        allWalletIds.length > 0
          ? supabase.from('wallets').select('id, name, currency, current_amount').in('id', allWalletIds)
          : { data: [] },
        categoryIds.length > 0
          ? supabase.from('categories').select('id, name, icon, type').in('id', categoryIds)
          : { data: [] },
        goalIds.length > 0
          ? supabase.from('payback_goals').select('id, name, target_amount, status').in('id', goalIds)
          : { data: [] },
      ])

      // Build lookup maps
      const walletMap = Object.fromEntries((walletsRes.data || []).map(w => [w.id, w]))
      const categoryMap = Object.fromEntries((categoriesRes.data || []).map(c => [c.id, c]))
      const goalMap = Object.fromEntries((goalsRes.data || []).map(g => [g.id, g]))

      // Merge related data onto transactions (same shape as FK joins produced)
      const merged = txns.map(txn => ({
        ...txn,
        wallets: txn.wallet_id ? walletMap[txn.wallet_id] || null : null,
        to_wallet: txn.to_wallet_id ? walletMap[txn.to_wallet_id] || null : null,
        categories: txn.category_id ? categoryMap[txn.category_id] || null : null,
        payback_goals: txn.payback_goal_id ? goalMap[txn.payback_goal_id] || null : null,
      }))

      setTransactions(merged)
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
  }, [filters.wallet_id, filters.type, filters.category_id, JSON.stringify(filters.category_ids), filters.date_from, filters.date_to])

  const createTransaction = async (transactionData) => {
    try {
      // ========================================
      // TRANSFER LOGIC WITH CURRENCY CONVERSION
      // ========================================
      if (transactionData.type === 'transfer') {
        const { wallet_id, to_wallet_id, amount, fee, description, date, time } = transactionData
        const transferAmount = Math.abs(parseFloat(amount))
        const transferFee = parseFloat(fee || 0)

        // 1. Get source wallet
        const { data: sourceWallet, error: sourceError } = await supabase
          .from('wallets')
          .select('id, name, current_amount, currency')
          .eq('id', wallet_id)
          .single()

        if (sourceError || !sourceWallet) {
          throw new Error('Không tìm thấy ví nguồn')
        }

        // ✅ 2. Get destination wallet
        const { data: destWallet, error: destError } = await supabase
          .from('wallets')
          .select('id, name, current_amount, currency')
          .eq('id', to_wallet_id)
          .single()

        if (destError || !destWallet) {
          throw new Error('Không tìm thấy ví đích')
        }

        // 3. Check if different currencies and get exchange rate
        const isDifferentCurrency = sourceWallet.currency !== destWallet.currency
        let exchangeRate = 1
        let convertedAmount = transferAmount

        if (isDifferentCurrency) {
          try {
            exchangeRate = await getExchangeRate(sourceWallet.currency, destWallet.currency)
            convertedAmount = transferAmount * exchangeRate

            // Confirm conversion with user
            const confirmMsg = 
              `Xác nhận chuyển khoản quy đổi:\n\n` +
              `Từ ví: ${sourceWallet.name} (${sourceWallet.currency})\n` +
              `Đến ví: ${destWallet.name} (${destWallet.currency})\n\n` +
              `Số tiền chuyển: ${transferAmount.toLocaleString()} ${sourceWallet.currency}\n` +
              `Tỷ giá: 1 ${sourceWallet.currency} = ${exchangeRate.toLocaleString()} ${destWallet.currency}\n` +
              `Người nhận được: ${convertedAmount.toLocaleString()} ${destWallet.currency}\n` +
              (transferFee > 0 ? `Phí: ${transferFee.toLocaleString()} ${sourceWallet.currency}\n\n` : '\n') +
              `Bạn có muốn tiếp tục?`

            if (!window.confirm(confirmMsg)) {
              return { success: false, error: 'Đã hủy giao dịch' }
            }
          } catch {
            throw new Error(
              `Không tìm thấy tỷ giá ${sourceWallet.currency} → ${destWallet.currency}.\n` +
              `Vui lòng cập nhật tỷ giá trước khi chuyển khoản.`
            )
          }
        }

        // ✅ 4. Check source wallet balance (including fee)
        const totalDeduction = transferAmount + transferFee
        if (sourceWallet.current_amount < totalDeduction) {
          const errorMsg = 
            `Số dù không đủ trong ví "${sourceWallet.name}".\n` +
            `Hiện có: ${sourceWallet.current_amount.toLocaleString()} ${sourceWallet.currency}\n` +
            `Cần: ${totalDeduction.toLocaleString()} (${transferAmount.toLocaleString()} + ${transferFee.toLocaleString()} phí)`
          throw new Error(errorMsg)
        }

        // 5. Generate transfer pair ID
        const transferPairId = crypto.randomUUID()

        // 6. Create OUTGOING transaction (negative in source currency)
        const { data: outgoingTxn, error: outgoingError } = await supabase
          .from('financial_transactions')
          .insert({
            wallet_id: wallet_id,
            type: 'transfer',
            amount: -(transferAmount + transferFee), // Negative with fee
            fee: transferFee,
            currency: sourceWallet.currency,
            description: description || `Chuyển đến ${destWallet.name}${isDifferentCurrency ? ` (${exchangeRate.toFixed(4)} ${destWallet.currency})` : ''}`,
            date: date,
            time: time,
            transfer_pair_id: transferPairId,
            to_wallet_id: to_wallet_id
          })
          .select()
          .single()

        if (outgoingError) {
          throw outgoingError
        }

        // 7. Create INCOMING transaction (positive in destination currency)
        const { data: incomingTxn, error: incomingError } = await supabase
          .from('financial_transactions')
          .insert({
            wallet_id: to_wallet_id,
            type: 'transfer',
            amount: convertedAmount, // POSITIVE converted amount
            fee: 0,
            currency: destWallet.currency,
            description: description || `Nhận từ ${sourceWallet.name}${isDifferentCurrency ? ` (${exchangeRate.toFixed(4)} rate)` : ''}`,
            date: date,
            time: time,
            transfer_pair_id: transferPairId,
            to_wallet_id: wallet_id
          })
          .select()
          .single()

        if (incomingError) {
          // Rollback: delete outgoing transaction
          await supabase
            .from('financial_transactions')
            .delete()
            .eq('id', outgoingTxn.id)
          throw incomingError
        }

        // 8. Recalculate wallet balances
        await supabase.rpc('recalculate_all_wallet_balances')

        await fetchTransactions()
        return { 
          success: true, 
          data: { outgoing: outgoingTxn, incoming: incomingTxn } 
        }
      }

      // ========================================
      // REGULAR TRANSACTION (income/expense)
      // ========================================
      // Look up wallet currency for the transaction
      const { data: txnWallet, error: txnWalletError } = await supabase
        .from('wallets')
        .select('currency')
        .eq('id', transactionData.wallet_id)
        .single()

      if (txnWalletError || !txnWallet) {
        throw new Error('Không tìm thấy ví')
      }

      const { data, error: insertError } = await supabase
        .from('financial_transactions')
        .insert([{
          ...transactionData,
          currency: txnWallet.currency,
          time: transactionData.time || '12:00:00'
        }])
        .select()
        .single()

      if (insertError) throw insertError

      // Recalculate wallet balances after creating transaction
      await supabase.rpc('recalculate_all_wallet_balances')

      await fetchTransactions()
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
          ...transactionData,
          amount: transactionData.type === 'expense' 
            ? -Math.abs(parseFloat(transactionData.amount))
            : Math.abs(parseFloat(transactionData.amount))
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      // Recalculate wallet balances after updating transaction
      await supabase.rpc('recalculate_all_wallet_balances')

      await fetchTransactions()
      return { success: true, data }
    } catch (err) {
      console.error('Error updating transaction:', err)
      return { success: false, error: err.message }
    }
  }

  const deleteTransaction = async (id) => {
    try {
      // Check if this is a transfer transaction
      const { data: txn, error: fetchError } = await supabase
        .from('financial_transactions')
        .select('type, transfer_pair_id')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      if (txn.type === 'transfer' && txn.transfer_pair_id) {
        // Delete both transactions in the transfer pair
        const { error: deleteError } = await supabase
          .from('financial_transactions')
          .delete()
          .eq('transfer_pair_id', txn.transfer_pair_id)

        if (deleteError) throw deleteError
      } else {
        // Delete single transaction
        const { error: deleteError } = await supabase
          .from('financial_transactions')
          .delete()
          .eq('id', id)

        if (deleteError) throw deleteError
      }

      // Recalculate wallet balances
      await supabase.rpc('recalculate_all_wallet_balances')

      await fetchTransactions()
      return { success: true }
    } catch (err) {
      console.error('Error deleting transaction:', err)
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