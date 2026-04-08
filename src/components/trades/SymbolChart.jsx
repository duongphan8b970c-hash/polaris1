import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { createChart, ColorType, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts'
import { binanceService } from '../../services/binanceService'
import { useBinancePrice } from '../../hooks/useBinancePrice'
import { calculateMA, calculateRSI } from '../../utils/indicators'

const INTERVAL_OPTIONS = [
  { value: '15m', label: '15m' },
  { value: '1h', label: '1H' },
  { value: '4h', label: '4H' },
  { value: '1d', label: '1D' },
]

// Convert kline timestamp to lightweight-charts time (UTC seconds)
function toChartTime(ts) {
  return Math.floor(ts / 1000)
}

export default function SymbolChart({ symbol, onSymbolChange, darkMode = false }) {
  const [symbols, setSymbols] = useState([])
  const [symbolSearch, setSymbolSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [interval, setInterval] = useState('1h')
  const [chartLoading, setChartLoading] = useState(false)
  const { price: livePrice, ticker, loading: priceLoading } = useBinancePrice(symbol, true)

  // Chart refs
  const mainChartRef = useRef(null)
  const rsiChartRef = useRef(null)
  const chartInstanceRef = useRef(null)
  const rsiChartInstanceRef = useRef(null)
  const seriesRef = useRef({})
  const rsiSeriesRef = useRef(null)

  // Fetch Binance symbol list
  useEffect(() => {
    binanceService.getSymbolList().then(setSymbols)
  }, [])

  // Theme colors
  const theme = useMemo(() => darkMode
    ? {
        bg: '#1a1a2e',
        text: '#d1d4dc',
        grid: '#2B2B43',
        border: '#363C4E',
        upColor: '#26a69a',
        downColor: '#ef5350',
        ma7Color: '#f5c842',
        ma25Color: '#2962FF',
        volUpColor: 'rgba(38,166,154,0.5)',
        volDownColor: 'rgba(239,83,80,0.5)',
        rsiColor: '#b39ddb',
        crosshair: '#758696',
      }
    : {
        bg: '#ffffff',
        text: '#333333',
        grid: '#f0f0f0',
        border: '#e0e0e0',
        upColor: '#22c55e',
        downColor: '#ef4444',
        ma7Color: '#f59e0b',
        ma25Color: '#3b82f6',
        volUpColor: 'rgba(34,197,94,0.4)',
        volDownColor: 'rgba(239,68,68,0.4)',
        rsiColor: '#8b5cf6',
        crosshair: '#9ca3af',
      }, [darkMode])

  // Create / update charts
  const buildCharts = useCallback((rawData) => {
    if (!mainChartRef.current || !rsiChartRef.current || rawData.length === 0) return

    // Dispose previous chart instances
    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove()
      chartInstanceRef.current = null
    }
    if (rsiChartInstanceRef.current) {
      rsiChartInstanceRef.current.remove()
      rsiChartInstanceRef.current = null
    }

    // ---- Data transformation ----
    const candleData = rawData.map(k => ({
      time: toChartTime(k.time),
      open: k.open,
      high: k.high,
      low: k.low,
      close: k.close,
    }))

    const volumeData = rawData.map(k => ({
      time: toChartTime(k.time),
      value: k.volume,
      color: k.close >= k.open ? theme.volUpColor : theme.volDownColor,
    }))

    const ma7Data = calculateMA(
      rawData.map(k => ({ time: toChartTime(k.time), close: k.close })),
      7
    )
    const ma25Data = calculateMA(
      rawData.map(k => ({ time: toChartTime(k.time), close: k.close })),
      25
    )
    const rsiData = calculateRSI(
      rawData.map(k => ({ time: toChartTime(k.time), close: k.close })),
      14
    )

    // ---- Main chart (candlestick + volume + MA) ----
    const chart = createChart(mainChartRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: theme.bg },
        textColor: theme.text,
      },
      grid: {
        vertLines: { color: theme.grid },
        horzLines: { color: theme.grid },
      },
      crosshair: { mode: 0 },
      rightPriceScale: { borderColor: theme.border },
      timeScale: {
        borderColor: theme.border,
        timeVisible: true,
        secondsVisible: false,
      },
      width: mainChartRef.current.clientWidth,
      height: 340,
    })
    chartInstanceRef.current = chart

    // Candlestick series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: theme.upColor,
      downColor: theme.downColor,
      borderVisible: false,
      wickUpColor: theme.upColor,
      wickDownColor: theme.downColor,
    })
    candleSeries.setData(candleData)
    seriesRef.current.candle = candleSeries

    // Volume series (overlay at bottom 25%)
    const volSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'vol',
    })
    volSeries.setData(volumeData)
    chart.priceScale('vol').applyOptions({
      scaleMargins: { top: 0.75, bottom: 0 },
    })

    // MA7 line
    const ma7Series = chart.addSeries(LineSeries, {
      color: theme.ma7Color,
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    })
    ma7Series.setData(ma7Data)

    // MA25 line
    const ma25Series = chart.addSeries(LineSeries, {
      color: theme.ma25Color,
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    })
    ma25Series.setData(ma25Data)

    chart.timeScale().fitContent()

    // ---- RSI chart (separate) ----
    const rsiChart = createChart(rsiChartRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: theme.bg },
        textColor: theme.text,
      },
      grid: {
        vertLines: { color: theme.grid },
        horzLines: { color: theme.grid },
      },
      rightPriceScale: {
        borderColor: theme.border,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: theme.border,
        timeVisible: true,
        secondsVisible: false,
        visible: false,
      },
      crosshair: { mode: 0 },
      width: rsiChartRef.current.clientWidth,
      height: 100,
    })
    rsiChartInstanceRef.current = rsiChart

    const rsiSeries = rsiChart.addSeries(LineSeries, {
      color: theme.rsiColor,
      lineWidth: 1.5,
      priceLineVisible: false,
      lastValueVisible: true,
    })
    rsiSeries.setData(rsiData)
    rsiSeriesRef.current = rsiSeries

    // RSI reference lines (30 and 70)
    rsiSeries.createPriceLine({ price: 70, color: theme.downColor, lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: '' })
    rsiSeries.createPriceLine({ price: 30, color: theme.upColor, lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: '' })

    rsiChart.timeScale().fitContent()

    // Sync time scales
    chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (range) rsiChart.timeScale().setVisibleLogicalRange(range)
    })
    rsiChart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (range) chart.timeScale().setVisibleLogicalRange(range)
    })

    // Resize handler
    const handleResize = () => {
      if (mainChartRef.current) chart.applyOptions({ width: mainChartRef.current.clientWidth })
      if (rsiChartRef.current) rsiChart.applyOptions({ width: rsiChartRef.current.clientWidth })
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [theme])

  // Fetch klines and build chart
  useEffect(() => {
    if (!symbol) return
    let cancelled = false

    const fetchAndBuild = async () => {
      setChartLoading(true)
      try {
        const data = await binanceService.getKlineData(symbol, interval, 120)
        if (!cancelled && data.length > 0) {
          buildCharts(data)
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setChartLoading(false)
      }
    }

    fetchAndBuild()
    return () => { cancelled = true }
  }, [symbol, interval, buildCharts])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) chartInstanceRef.current.remove()
      if (rsiChartInstanceRef.current) rsiChartInstanceRef.current.remove()
    }
  }, [])

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

  const cardBg = darkMode ? 'bg-[#16213e] border border-[#2B2B43]' : 'bg-white'
  const textColor = darkMode ? 'text-gray-200' : 'text-gray-900'
  const subtextColor = darkMode ? 'text-gray-400' : 'text-gray-500'

  return (
    <div className={`rounded-xl shadow-md p-4 sm:p-6 mb-6 ${cardBg}`}>
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <h2 className={`text-lg font-bold ${textColor} flex items-center gap-2`}>
            📊 Live Chart
          </h2>
          {/* Symbol selector */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                darkMode
                  ? 'bg-[#1a1a2e] text-gray-200 hover:bg-[#2B2B43] border border-[#363C4E]'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
              }`}
            >
              {displaySymbol}
              <svg className="w-4 h-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showDropdown && (
              <div className={`absolute z-50 mt-1 rounded-lg shadow-lg w-64 max-h-72 overflow-hidden ${
                darkMode ? 'bg-[#1a1a2e] border border-[#363C4E]' : 'bg-white border border-gray-200'
              }`}>
                <div className="p-2 border-b border-inherit">
                  <input
                    type="text"
                    placeholder="Tìm symbol... VD: BTC"
                    value={symbolSearch}
                    onChange={(e) => setSymbolSearch(e.target.value)}
                    className={`w-full px-2 py-1.5 text-sm rounded focus:ring-1 focus:ring-primary-500 ${
                      darkMode
                        ? 'bg-[#16213e] border-[#363C4E] text-gray-200 placeholder-gray-500 border'
                        : 'border border-gray-200'
                    }`}
                    autoFocus
                  />
                </div>
                <div className="overflow-y-auto max-h-52">
                  {filteredSymbols.map(s => (
                    <button
                      key={s.symbol}
                      onClick={() => handleSelectSymbol(s)}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors flex justify-between items-center ${
                        darkMode ? 'hover:bg-[#2B2B43] text-gray-200' : 'hover:bg-primary-50'
                      }`}
                    >
                      <span className="font-medium">{s.baseAsset}</span>
                      <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>/{s.quoteAsset}</span>
                    </button>
                  ))}
                  {filteredSymbols.length === 0 && (
                    <p className={`px-3 py-4 text-sm text-center ${subtextColor}`}>Không tìm thấy</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Interval selector */}
          <div className={`flex rounded-lg overflow-hidden border ${
            darkMode ? 'border-[#363C4E]' : 'border-gray-200'
          }`}>
            {INTERVAL_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setInterval(opt.value)}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  interval === opt.value
                    ? 'bg-primary-500 text-white'
                    : darkMode
                      ? 'bg-[#1a1a2e] text-gray-400 hover:bg-[#2B2B43]'
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
          <span className={`text-2xl font-bold ${textColor}`}>
            ${livePrice.toFixed(2)}
          </span>
          {ticker && (
            <span className={`text-sm font-medium ${
              ticker.priceChangePercent >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {ticker.priceChangePercent >= 0 ? '+' : ''}{ticker.priceChangePercent?.toFixed(2)}%
            </span>
          )}
          {ticker && (
            <span className={`text-xs ${subtextColor}`}>
              H: ${ticker.high?.toFixed(2)} &bull; L: ${ticker.low?.toFixed(2)}
            </span>
          )}
          {/* Legend */}
          <div className="ml-auto flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-0.5 rounded" style={{ background: darkMode ? '#f5c842' : '#f59e0b' }} />
              MA7
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-0.5 rounded" style={{ background: darkMode ? '#2962FF' : '#3b82f6' }} />
              MA25
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-0.5 rounded" style={{ background: darkMode ? '#b39ddb' : '#8b5cf6' }} />
              RSI
            </span>
          </div>
        </div>
      )}

      {/* Chart area */}
      {!symbol ? (
        <div className={`flex items-center justify-center h-48 rounded-lg ${
          darkMode ? 'bg-[#1a1a2e]' : 'bg-gray-50'
        }`}>
          <p className={`text-sm ${subtextColor}`}>Chọn symbol để xem chart</p>
        </div>
      ) : chartLoading ? (
        <div className={`flex items-center justify-center h-48 rounded-lg animate-pulse ${
          darkMode ? 'bg-[#1a1a2e]' : 'bg-gray-50'
        }`}>
          <p className={`text-sm ${subtextColor}`}>Đang tải chart...</p>
        </div>
      ) : (
        <>
          {/* Main candlestick + volume + MA chart */}
          <div ref={mainChartRef} className="w-full rounded-lg overflow-hidden" />
          {/* RSI chart */}
          <div className={`flex items-center gap-2 mt-1 px-1 ${subtextColor}`}>
            <span className="text-xs font-medium">RSI(14)</span>
          </div>
          <div ref={rsiChartRef} className="w-full rounded-lg overflow-hidden" />
        </>
      )}
    </div>
  )
}
