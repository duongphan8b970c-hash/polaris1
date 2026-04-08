import { useState, useEffect, useCallback } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { binanceService } from '../../services/binanceService'
import { useBinancePrice } from '../../hooks/useBinancePrice'

const INTERVAL_OPTIONS = [
  { value: '15m', label: '15m' },
  { value: '1h', label: '1H' },
  { value: '4h', label: '4H' },
  { value: '1d', label: '1D' },
]

export default function SymbolChart({ symbol, onSymbolChange }) {
  const [symbols, setSymbols] = useState([])
  const [symbolSearch, setSymbolSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [klineData, setKlineData] = useState([])
  const [interval, setInterval] = useState('1h')
  const [chartLoading, setChartLoading] = useState(false)
  const { price: livePrice, ticker, loading: priceLoading } = useBinancePrice(symbol, true)

  // Fetch Binance symbol list
  useEffect(() => {
    binanceService.getSymbolList().then(setSymbols)
  }, [])

  // Fetch kline data when symbol or interval changes
  const fetchKlines = useCallback(async () => {
    if (!symbol) return
    setChartLoading(true)
    try {
      const data = await binanceService.getKlineData(symbol, interval, 80)
      setKlineData(data.map(k => ({
        time: new Date(k.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        price: k.close,
        high: k.high,
        low: k.low,
      })))
    } catch {
      setKlineData([])
    } finally {
      setChartLoading(false)
    }
  }, [symbol, interval])

  useEffect(() => {
    fetchKlines()
  }, [fetchKlines])

  // Filter symbols for search
  const filteredSymbols = symbolSearch
    ? symbols.filter(s =>
        s.baseAsset.toLowerCase().includes(symbolSearch.toLowerCase()) ||
        s.displayName.toLowerCase().includes(symbolSearch.toLowerCase())
      ).slice(0, 30)
    : symbols.slice(0, 30)

  const handleSelectSymbol = (s) => {
    onSymbolChange(s.displayName)
    setShowDropdown(false)
    setSymbolSearch('')
  }

  const displaySymbol = symbol || 'Chọn symbol'

  return (
    <div className="card mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            📊 Live Chart
          </h2>
          {/* Symbol selector */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-800 transition-colors flex items-center gap-1"
            >
              {displaySymbol}
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showDropdown && (
              <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg w-64 max-h-72 overflow-hidden">
                <div className="p-2 border-b">
                  <input
                    type="text"
                    placeholder="Tìm symbol... VD: BTC"
                    value={symbolSearch}
                    onChange={(e) => setSymbolSearch(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    autoFocus
                  />
                </div>
                <div className="overflow-y-auto max-h-52">
                  {filteredSymbols.map(s => (
                    <button
                      key={s.symbol}
                      onClick={() => handleSelectSymbol(s)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-primary-50 transition-colors flex justify-between items-center"
                    >
                      <span className="font-medium">{s.baseAsset}</span>
                      <span className="text-xs text-gray-400">/{s.quoteAsset}</span>
                    </button>
                  ))}
                  {filteredSymbols.length === 0 && (
                    <p className="px-3 py-4 text-sm text-gray-400 text-center">Không tìm thấy</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Interval selector */}
          <div className="flex rounded-lg overflow-hidden border border-gray-200">
            {INTERVAL_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setInterval(opt.value)}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  interval === opt.value
                    ? 'bg-primary-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live price header */}
      {symbol && !priceLoading && livePrice && (
        <div className="flex items-baseline gap-3 mb-3">
          <span className="text-2xl font-bold text-gray-900">
            ${livePrice.toFixed(2)}
          </span>
          {ticker && (
            <span className={`text-sm font-medium ${
              ticker.priceChangePercent >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {ticker.priceChangePercent >= 0 ? '+' : ''}{ticker.priceChangePercent?.toFixed(2)}%
            </span>
          )}
          {ticker && (
            <span className="text-xs text-gray-400">
              H: ${ticker.high?.toFixed(2)} • L: ${ticker.low?.toFixed(2)}
            </span>
          )}
        </div>
      )}

      {/* Chart */}
      {!symbol ? (
        <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg">
          <p className="text-gray-400 text-sm">Chọn symbol để xem chart</p>
        </div>
      ) : chartLoading ? (
        <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg animate-pulse">
          <p className="text-gray-400 text-sm">Đang tải chart...</p>
        </div>
      ) : klineData.length > 0 ? (
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={klineData}>
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
                stroke="#9ca3af"
              />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fontSize: 10 }}
                stroke="#9ca3af"
                width={65}
                tickFormatter={(v) => `$${v.toLocaleString()}`}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Price']}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#6366f1' }}
              />
              {livePrice && (
                <ReferenceLine
                  y={livePrice}
                  stroke="#f59e0b"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg">
          <p className="text-gray-400 text-sm">Không có dữ liệu chart</p>
        </div>
      )}
    </div>
  )
}
