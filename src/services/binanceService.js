const BINANCE_API = 'https://api.binance.com/api/v3'
const BINANCE_WS = 'wss://stream.binance.com:9443/ws'

export const binanceService = {
  // Get current price for a symbol
  async getCurrentPrice(symbol) {
    try {
      const binanceSymbol = symbol.replace('/', '')
      const response = await fetch(`${BINANCE_API}/ticker/price?symbol=${binanceSymbol}`)
      if (!response.ok) throw new Error('Failed to fetch price')
      const data = await response.json()
      return {
        symbol: data.symbol,
        price: parseFloat(data.price)
      }
    } catch (error) {
      console.error('Binance API error:', error)
      return null
    }
  },

  // Get 24hr ticker data
  async get24hrTicker(symbol) {
    try {
      const binanceSymbol = symbol.replace('/', '')
      const response = await fetch(`${BINANCE_API}/ticker/24hr?symbol=${binanceSymbol}`)
      if (!response.ok) throw new Error('Failed to fetch ticker')
      const data = await response.json()
      return {
        symbol: data.symbol,
        price: parseFloat(data.lastPrice),
        priceChange: parseFloat(data.priceChange),
        priceChangePercent: parseFloat(data.priceChangePercent),
        high: parseFloat(data.highPrice),
        low: parseFloat(data.lowPrice),
        volume: parseFloat(data.volume)
      }
    } catch (error) {
      console.error('Binance ticker error:', error)
      return null
    }
  },

  // Get kline/candlestick data for charts
  async getKlineData(symbol, interval = '1h', limit = 100) {
    try {
      const binanceSymbol = symbol.replace('/', '')
      const response = await fetch(
        `${BINANCE_API}/klines?symbol=${binanceSymbol}&interval=${interval}&limit=${limit}`
      )
      if (!response.ok) throw new Error('Failed to fetch klines')
      const data = await response.json()
      return data.map(k => ({
        time: k[0],
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5])
      }))
    } catch (error) {
      console.error('Binance klines error:', error)
      return []
    }
  },

  // WebSocket subscription for real-time price updates
  subscribeToPrice(symbol, callback) {
    try {
      const binanceSymbol = symbol.replace('/', '').toLowerCase()
      const ws = new WebSocket(`${BINANCE_WS}/${binanceSymbol}@ticker`)

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        callback({
          symbol: data.s,
          price: parseFloat(data.c),
          priceChange: parseFloat(data.p),
          priceChangePercent: parseFloat(data.P),
        })
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      return ws
    } catch (error) {
      console.error('WebSocket subscription error:', error)
      return null
    }
  }
}
