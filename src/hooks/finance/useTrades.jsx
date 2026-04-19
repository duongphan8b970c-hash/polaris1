import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export function useTrades(filters = {}) {
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Create stable filter string
  const filterKey = JSON.stringify(filters)

  useEffect(() => {
    fetchTrades()
  }, [filterKey]) // ✅ Use string instead of object

  const fetchTrades = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('trades')
        .select(`
          *,
          wallet:wallets(id, name, currency)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
      
      // Apply filters
      if (filters.wallet_id) {
        query = query.eq('wallet_id', filters.wallet_id)
      }
      
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      
      if (filters.symbol) {
        query = query.ilike('symbol', `%${filters.symbol}%`)
      }
      
      const { data, error: fetchError } = await query
      
      if (fetchError) throw fetchError
      setTrades(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createTrade = async (tradeData) => {
    try {
      const { data, error: createError } = await supabase
        .from('trades')
        .insert([{
          wallet_id: tradeData.wallet_id,
          symbol: tradeData.symbol,
          side: tradeData.side,
          entry_price: parseFloat(tradeData.entry_price),
          entry_currency: tradeData.entry_currency || 'USD',
          amount: parseFloat(tradeData.amount),
          leverage: parseInt(tradeData.leverage) || 1,
          exit_currency: tradeData.exit_currency,
          status: 'open',
          notes: tradeData.notes || null,
        }])
        .select(`
          *,
          wallet:wallets(id, name, currency)
        `)
        .single()
      
      if (createError) throw createError
      
      setTrades(prev => [data, ...prev])
      return { success: true, data }
    } catch (err) {
      console.error('Error creating trade:', err)
      return { success: false, error: err.message }
    }
  }

  const createTradeTransaction = async (trade) => {
    const profitLoss = parseFloat(trade.profit_loss)
    if (!trade.wallet_id || isNaN(profitLoss) || profitLoss === 0) return

    const isProfit = profitLoss > 0
    const transactionType = isProfit ? 'income' : 'expense'

    // Try to find "Trade" category first, then fall back to first matching type
    let category = null
    const { data: tradeCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('name', 'Trade')
      .eq('type', transactionType)
      .limit(1)
      .single()

    if (tradeCategory) {
      category = tradeCategory
    } else {
      const { data: fallbackCategory, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('type', transactionType)
        .limit(1)
        .single()

      if (categoryError || !fallbackCategory) {
        console.warn(`No ${transactionType} category found, skipping wallet transaction`)
        return
      }
      category = fallbackCategory
    }

    // Convert profit_loss to VND
    const currency = (trade.exit_currency || trade.wallet?.currency || 'USDT').toUpperCase()
    let amountVND = Math.abs(profitLoss)

    if (currency !== 'VND') {
      // Try to get exchange rate from DB
      const { data: rateData } = await supabase
        .from('exchange_rates')
        .select('rate')
        .eq('from_currency', currency)
        .eq('to_currency', 'VND')
        .limit(1)
        .single()

      const rate = rateData?.rate
        ? parseFloat(rateData.rate)
        : (currency === 'USD' || currency === 'USDT' ? 25000 : 1)

      amountVND = Math.abs(profitLoss) * rate
    }

    const { error: txError } = await supabase
      .from('financial_transactions')
      .insert({
        wallet_id: trade.wallet_id,
        category_id: category.id,
        type: transactionType,
        amount: isProfit ? amountVND : -amountVND,
        description: `Trade ${trade.symbol} - ${isProfit ? 'Win' : 'Loss'} (${trade.leverage || 1}x) [${Math.abs(profitLoss)} ${currency}]`,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 8),
      })

    if (txError) {
      console.error('Error creating trade transaction:', txError)
    }
  }

  const updateTrade = async (id, tradeData) => {
    try {
      const updateData = {
        symbol: tradeData.symbol,
        side: tradeData.side,
        entry_price: parseFloat(tradeData.entry_price),
        amount: parseFloat(tradeData.amount),
        leverage: parseInt(tradeData.leverage),
        notes: tradeData.notes || null,
      }

      // If closing trade
      if (tradeData.status === 'closed') {
        updateData.status = 'closed'
        updateData.exit_price = tradeData.exit_price ? parseFloat(tradeData.exit_price) : null
        updateData.profit_loss = tradeData.profit_loss ? parseFloat(tradeData.profit_loss) : null
      }

      const { data, error: updateError } = await supabase
        .from('trades')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          wallet:wallets(id, name, currency)
        `)
        .single()
      
      if (updateError) throw updateError

      // Create financial transaction when closing a trade
      if (tradeData.status === 'closed' && data.profit_loss !== null) {
        await createTradeTransaction(data)
      }
      
      setTrades(prev => prev.map(t => t.id === id ? data : t))
      return { success: true, data }
    } catch (err) {
      console.error('Error updating trade:', err)
      return { success: false, error: err.message }
    }
  }

  const quickCloseTrade = async (id, profitLoss, exitPrice) => {
    try {
      const { data, error: updateError } = await supabase
        .from('trades')
        .update({
          status: 'closed',
          exit_price: exitPrice ? parseFloat(exitPrice) : null,
          profit_loss: parseFloat(profitLoss),
        })
        .eq('id', id)
        .select(`
          *,
          wallet:wallets(id, name, currency)
        `)
        .single()
      
      if (updateError) throw updateError

      // Create financial transaction for the closed trade
      await createTradeTransaction(data)
      
      setTrades(prev => prev.map(t => t.id === id ? data : t))
      return { success: true, data }
    } catch (err) {
      console.error('Error closing trade:', err)
      return { success: false, error: err.message }
    }
  }

  return {
    trades,
    loading,
    error,
    createTrade,
    updateTrade,
    quickCloseTrade,
    refetch: fetchTrades,
  }
}