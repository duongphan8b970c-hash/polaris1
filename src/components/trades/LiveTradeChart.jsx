import { useMemo } from 'react'
import { useBinancePrice } from '../../hooks/useBinancePrice'
import { formatCurrency } from '../../utils'

export default function LiveTradeChart({ trade }) {
  const { price: livePrice, ticker, loading, error } = useBinancePrice(trade.symbol, true)

  // Calculate unrealized P&L
  const unrealizedPL = useMemo(() => {
    if (!livePrice || !trade.entry_price || !trade.amount) return 0

    const priceDiff = trade.side === 'buy'
      ? livePrice - trade.entry_price
      : trade.entry_price - livePrice

    const positionSize = trade.amount * (trade.leverage || 1)
    return (priceDiff / trade.entry_price) * positionSize
  }, [livePrice, trade])

  const percentChange = useMemo(() => {
    if (!livePrice || !trade.entry_price) return 0
    const diff = trade.side === 'buy'
      ? livePrice - trade.entry_price
      : trade.entry_price - livePrice
    return (diff / trade.entry_price) * 100 * (trade.leverage || 1)
  }, [livePrice, trade])

  const currency = trade.exit_currency || trade.wallet?.currency || 'USDT'

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div className="h-16 bg-gray-100 rounded"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card border-red-200">
        <p className="text-sm text-red-600">❌ {trade.symbol} - Không thể lấy dữ liệu live</p>
        <p className="text-xs text-gray-500 mt-1">Entry: ${trade.entry_price?.toFixed(2)}</p>
        <p className="text-xs text-gray-400 mt-1">{error} — Kiểm tra lại symbol có đúng trên Binance không</p>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{trade.symbol}</h3>
          <p className="text-xs text-gray-500">
            {trade.side === 'buy' ? '↑ LONG' : '↓ SHORT'} • {trade.leverage || 1}x leverage
          </p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          trade.side === 'buy' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {trade.wallet?.name || currency}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <p className="text-xs text-gray-500">Entry Price</p>
          <p className="text-sm font-semibold text-gray-900">
            ${trade.entry_price?.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Current Price</p>
          <p className="text-sm font-semibold text-gray-900">
            ${livePrice?.toFixed(2)}
            <span className={`ml-1 text-xs ${percentChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ({percentChange >= 0 ? '+' : ''}{percentChange.toFixed(2)}%)
            </span>
          </p>
        </div>
      </div>

      {ticker && (
        <div className="grid grid-cols-3 gap-2 mb-3 text-center">
          <div className="bg-gray-50 rounded p-1">
            <p className="text-xs text-gray-400">24h Change</p>
            <p className={`text-xs font-medium ${ticker.priceChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {ticker.priceChangePercent >= 0 ? '+' : ''}{ticker.priceChangePercent?.toFixed(2)}%
            </p>
          </div>
          <div className="bg-gray-50 rounded p-1">
            <p className="text-xs text-gray-400">High</p>
            <p className="text-xs font-medium text-gray-700">${ticker.high?.toFixed(2)}</p>
          </div>
          <div className="bg-gray-50 rounded p-1">
            <p className="text-xs text-gray-400">Low</p>
            <p className="text-xs font-medium text-gray-700">${ticker.low?.toFixed(2)}</p>
          </div>
        </div>
      )}

      <div className={`p-3 rounded-lg ${
        unrealizedPL >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
      }`}>
        <p className="text-xs text-gray-600 mb-1">Unrealized P&amp;L</p>
        <p className={`text-2xl font-bold ${unrealizedPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {unrealizedPL >= 0 ? '+' : ''}{formatCurrency(unrealizedPL, currency)}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Margin: {formatCurrency(trade.amount, currency)} •
          Position: {formatCurrency(trade.amount * (trade.leverage || 1), currency)}
        </p>
      </div>
    </div>
  )
}
