import { useState, useEffect, useRef, useMemo } from 'react'
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
  const [rawData, setRawData] = useState([])
  const { price: livePrice, ticker, loading: priceLoading } = useBinancePrice(symbol, true)

  // Chart refs
  const mainChartRef = useRef(null)
  const rsiChartRef = useRef(null)
  const volChartRef = useRef(null)
  const chartInstanceRef = useRef(null)
  const rsiChartInstanceRef = useRef(null)
  const volChartInstanceRef = useRef(null)

  // Fetch Binance symbol list
  useEffect(() => {
    binanceService.getSymbolList().then(setSymbols)
  }, [])

  // Theme colors
  const theme = useMemo(() => darkMode
    ? {
        bg: '#0d1117',
        text: '#c9d1d9',
        grid: 'rgba(30, 41, 59, 0.5)',
        border: '#1e293b',
        upColor: '#22c55e',
        downColor: '#ef4444',
        ma7Color: '#fbbf24',
        ma25Color: '#60a5fa',
        volUpColor: 'rgba(34,197,94,0.35)',
        volDownColor: 'rgba(239,68,68,0.35)',
        rsi14Color: '#a78bfa',
        rsi99Color: '#f59e0b',
        rsi200Color: '#ec4899',
        crosshair: '#475569',
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
        rsi14Color: '#8b5cf6',
        rsi99Color: '#d97706',
        rsi200Color: '#db2777',
        crosshair: '#9ca3af',
      }, [darkMode])

  // Fetch klines when symbol or interval changes (NOT when theme changes)
  useEffect(() => {
    if (!symbol) return
    let cancelled = false

    const fetchData = async () => {
      setChartLoading(true)
      try {
        const data = await binanceService.getKlineData(symbol, interval, 300)
        if (!cancelled) setRawData(data)
      } catch {
        if (!cancelled) setRawData([])
      } finally {
        if (!cancelled) setChartLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [symbol, interval])

  // Build/rebuild charts when rawData or theme changes
  useEffect(() => {
    if (!mainChartRef.current || !rsiChartRef.current || !volChartRef.current || rawData.length === 0) return

    // Dispose previous chart instances
    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove()
      chartInstanceRef.current = null
    }
    if (rsiChartInstanceRef.current) {
      rsiChartInstanceRef.current.remove()
      rsiChartInstanceRef.current = null
    }
    if (volChartInstanceRef.current) {
      volChartInstanceRef.current.remove()
      volChartInstanceRef.current = null
    }

    // Small delay to ensure DOM is ready after potential loading state change
    const timerId = setTimeout(() => {
      if (!mainChartRef.current || !rsiChartRef.current || !volChartRef.current) return

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

      const maInput = rawData.map(k => ({ time: toChartTime(k.time), close: k.close }))
      const ma7Data = calculateMA(maInput, 7)
      const ma25Data = calculateMA(maInput, 25)
      const rsi14Data = calculateRSI(maInput, 14)
      const rsi99Data = calculateRSI(maInput, 99)
      const rsi200Data = calculateRSI(maInput, 200)

      // ---- Main chart (candlestick + volume overlay + MA) ----
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

      // Volume series (overlay at bottom 25% of main chart)
      const volOverlaySeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: 'vol',
      })
      volOverlaySeries.setData(volumeData)
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

      // RSI(14) line
      const rsi14Series = rsiChart.addSeries(LineSeries, {
        color: theme.rsi14Color,
        lineWidth: 1.5,
        priceLineVisible: false,
        lastValueVisible: true,
        title: '14',
      })
      rsi14Series.setData(rsi14Data)

      // RSI(99) line
      if (rsi99Data.length > 0) {
        const rsi99Series = rsiChart.addSeries(LineSeries, {
          color: theme.rsi99Color,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: true,
          title: '99',
        })
        rsi99Series.setData(rsi99Data)
      }

      // RSI(200) line
      if (rsi200Data.length > 0) {
        const rsi200Series = rsiChart.addSeries(LineSeries, {
          color: theme.rsi200Color,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: true,
          title: '200',
        })
        rsi200Series.setData(rsi200Data)
      }

      // RSI reference lines (30 and 70)
      rsi14Series.createPriceLine({ price: 70, color: theme.downColor, lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: '' })
      rsi14Series.createPriceLine({ price: 30, color: theme.upColor, lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: '' })

      rsiChart.timeScale().fitContent()

      // ---- Volume chart (separate, below RSI) ----
      const volChart = createChart(volChartRef.current, {
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
          scaleMargins: { top: 0.1, bottom: 0 },
        },
        timeScale: {
          borderColor: theme.border,
          timeVisible: true,
          secondsVisible: false,
          visible: false,
        },
        crosshair: { mode: 0 },
        width: volChartRef.current.clientWidth,
        height: 80,
      })
      volChartInstanceRef.current = volChart

      const volStandaloneSeries = volChart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
      })
      volStandaloneSeries.setData(volumeData)

      volChart.timeScale().fitContent()

      // Sync all three charts' time scales
      const syncCharts = [chart, rsiChart, volChart]
      syncCharts.forEach((src, srcIdx) => {
        src.timeScale().subscribeVisibleLogicalRangeChange((range) => {
          if (!range) return
          syncCharts.forEach((dst, dstIdx) => {
            if (srcIdx !== dstIdx) {
              dst.timeScale().setVisibleLogicalRange(range)
            }
          })
        })
      })
    }, 50)

    // Resize handler
    const handleResize = () => {
      if (mainChartRef.current && chartInstanceRef.current) {
        chartInstanceRef.current.applyOptions({ width: mainChartRef.current.clientWidth })
      }
      if (rsiChartRef.current && rsiChartInstanceRef.current) {
        rsiChartInstanceRef.current.applyOptions({ width: rsiChartRef.current.clientWidth })
      }
      if (volChartRef.current && volChartInstanceRef.current) {
        volChartInstanceRef.current.applyOptions({ width: volChartRef.current.clientWidth })
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      clearTimeout(timerId)
      window.removeEventListener('resize', handleResize)
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove()
        chartInstanceRef.current = null
      }
      if (rsiChartInstanceRef.current) {
        rsiChartInstanceRef.current.remove()
        rsiChartInstanceRef.current = null
      }
      if (volChartInstanceRef.current) {
        volChartInstanceRef.current.remove()
        volChartInstanceRef.current = null
      }
    }
  }, [rawData, theme])

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

  const cardBg = darkMode ? 'bg-[#111827]/80 backdrop-blur-sm border border-[#1e293b]' : 'bg-white'
  const textColor = darkMode ? 'text-gray-100' : 'text-gray-900'
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
                  ? 'bg-[#0f172a] text-gray-200 hover:bg-[#1e293b] border border-[#334155]'
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
                darkMode ? 'bg-[#111827] border border-[#1e293b]' : 'bg-white border border-gray-200'
              }`}>
                <div className="p-2 border-b border-inherit">
                  <input
                    type="text"
                    placeholder="Tìm symbol... VD: BTC"
                    value={symbolSearch}
                    onChange={(e) => setSymbolSearch(e.target.value)}
                    className={`w-full px-2 py-1.5 text-sm rounded focus:ring-1 focus:ring-blue-500 ${
                      darkMode
                        ? 'bg-[#0f172a] border-[#334155] text-gray-200 placeholder-gray-500 border'
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
                        darkMode ? 'hover:bg-[#1e293b] text-gray-200' : 'hover:bg-primary-50'
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
            darkMode ? 'border-[#334155]' : 'border-gray-200'
          }`}>
            {INTERVAL_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setInterval(opt.value)}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  interval === opt.value
                    ? 'bg-blue-500 text-white'
                    : darkMode
                      ? 'bg-[#0f172a] text-gray-400 hover:bg-[#1e293b]'
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
          <div className="ml-auto flex items-center gap-3 text-xs flex-wrap">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-0.5 rounded" style={{ background: theme.ma7Color }} />
              MA7
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-0.5 rounded" style={{ background: theme.ma25Color }} />
              MA25
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-0.5 rounded" style={{ background: theme.rsi14Color }} />
              RSI14
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-0.5 rounded" style={{ background: theme.rsi99Color }} />
              RSI99
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-0.5 rounded" style={{ background: theme.rsi200Color }} />
              RSI200
            </span>
          </div>
        </div>
      )}

      {/* Chart area */}
      {!symbol ? (
        <div className={`flex items-center justify-center h-48 rounded-lg ${
          darkMode ? 'bg-[#0f172a]' : 'bg-gray-50'
        }`}>
          <p className={`text-sm ${subtextColor}`}>Chọn symbol để xem chart</p>
        </div>
      ) : chartLoading ? (
        <div className={`flex items-center justify-center h-48 rounded-lg animate-pulse ${
          darkMode ? 'bg-[#0f172a]' : 'bg-gray-50'
        }`}>
          <p className={`text-sm ${subtextColor}`}>Đang tải chart...</p>
        </div>
      ) : (
        <>
          {/* Main candlestick + volume + MA chart */}
          <div ref={mainChartRef} className="w-full rounded-lg overflow-hidden" />
          {/* RSI chart */}
          <div className={`flex items-center gap-2 mt-1 px-1 ${subtextColor}`}>
            <span className="text-xs font-medium">RSI</span>
            <span className="text-xs" style={{ color: theme.rsi14Color }}>14</span>
            <span className="text-xs" style={{ color: theme.rsi99Color }}>99</span>
            <span className="text-xs" style={{ color: theme.rsi200Color }}>200</span>
          </div>
          <div ref={rsiChartRef} className="w-full rounded-lg overflow-hidden" />
          {/* Volume chart */}
          <div className={`flex items-center gap-2 mt-1 px-1 ${subtextColor}`}>
            <span className="text-xs font-medium">VOL</span>
          </div>
          <div ref={volChartRef} className="w-full rounded-lg overflow-hidden" />
        </>
      )}
    </div>
  )
}
