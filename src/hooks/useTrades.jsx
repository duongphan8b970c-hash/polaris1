import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

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

  const updateTrade = async (id, tradeData) => {
    try {
      const updateData = {
        symbol: tradeData.symbol,
        side: tradeData.side,
        entry_price: parseFloat(tradeData.entry_price),
        amount: parseFloat(tradeData.amount),
        leverage: parseInt(tradeData.leverage),
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