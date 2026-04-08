import { useState, useEffect, useRef } from 'react'
import { binanceService } from '../services/binanceService'

export function useBinancePrice(symbol, enableWebSocket = true) {
  const [price, setPrice] = useState(null)
  const [ticker, setTicker] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const wsRef = useRef(null)

  useEffect(() => {
    if (!symbol) {
      setLoading(false)
      return
    }

    // Fetch initial price
    const fetchInitialPrice = async () => {
      try {
        const data = await binanceService.get24hrTicker(symbol)
        if (data) {
          setPrice(data.price)
          setTicker(data)
          setError(null)
        } else {
          setError('Failed to fetch price')
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchInitialPrice()

    // Setup WebSocket for real-time updates
    if (enableWebSocket) {
      wsRef.current = binanceService.subscribeToPrice(symbol, (data) => {
        setPrice(data.price)
        setTicker(prev => ({ ...prev, ...data }))
      })
    }

    // Cleanup
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [symbol, enableWebSocket])

  return { price, ticker, loading, error }
}
