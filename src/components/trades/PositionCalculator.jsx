import { useState, useMemo } from 'react'
import { formatCurrency } from '../../utils'

const DEFAULT_RISK_PERCENT = 2 // 2% risk for suggested levels

export default function PositionCalculator({ entryPrice, amount, leverage, side, currency }) {
  const [tpLevels, setTpLevels] = useState([
    { price: '', percentage: '50' },
    { price: '', percentage: '30' },
    { price: '', percentage: '20' }
  ])

  const [slLevel, setSlLevel] = useState({ price: '', percentage: '100' })

  // Calculate P&L for a given target price
  const calculatePL = (targetPrice, positionPercent = 100) => {
    if (!targetPrice || !entryPrice) return 0

    const priceDiff = side === 'buy'
      ? targetPrice - entryPrice
      : entryPrice - targetPrice

    const positionSize = amount * leverage * (positionPercent / 100)
    return (priceDiff / entryPrice) * positionSize
  }

  // Calculate suggested TP/SL based on risk/reward ratio
  const suggestedLevels = useMemo(() => {
    const riskPercent = DEFAULT_RISK_PERCENT
    const rewardRatios = [1, 2, 3] // 1:1, 1:2, 1:3 R:R

    const slPrice = side === 'buy'
      ? entryPrice * (1 - riskPercent / 100 / leverage)
      : entryPrice * (1 + riskPercent / 100 / leverage)

    const tpPrices = rewardRatios.map(ratio => {
      const rewardPercent = riskPercent * ratio
      return side === 'buy'
        ? entryPrice * (1 + rewardPercent / 100 / leverage)
        : entryPrice * (1 - rewardPercent / 100 / leverage)
    })

    return { sl: slPrice, tps: tpPrices, riskPercent }
  }, [entryPrice, leverage, side])

  const handleTPChange = (index, field, value) => {
    const newLevels = [...tpLevels]
    newLevels[index][field] = value
    setTpLevels(newLevels)
  }

  const addTPLevel = () => {
    setTpLevels([...tpLevels, { price: '', percentage: '10' }])
  }

  const removeTPLevel = (index) => {
    if (tpLevels.length > 1) {
      setTpLevels(tpLevels.filter((_, i) => i !== index))
    }
  }

  const applySuggested = () => {
    setTpLevels([
      { price: suggestedLevels.tps[0].toFixed(2), percentage: '50' },
      { price: suggestedLevels.tps[1].toFixed(2), percentage: '30' },
      { price: suggestedLevels.tps[2].toFixed(2), percentage: '20' }
    ])
    setSlLevel({ price: suggestedLevels.sl.toFixed(2), percentage: '100' })
  }

  const actualPositionSize = amount * leverage
  const totalTPPL = tpLevels.reduce(
    (sum, tp) => sum + calculatePL(parseFloat(tp.price), parseFloat(tp.percentage)),
    0
  )
  const slPL = calculatePL(parseFloat(slLevel.price))

  return (
    <div className="space-y-4">
      {/* Position Summary */}
      <div className="grid grid-cols-3 gap-3 bg-white p-3 rounded border">
        <div>
          <p className="text-xs text-gray-500">Entry</p>
          <p className="font-semibold">${entryPrice.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Margin</p>
          <p className="font-semibold">{formatCurrency(amount, currency)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Position Size</p>
          <p className="font-semibold text-purple-600">
            {formatCurrency(actualPositionSize, currency)}
          </p>
        </div>
      </div>

      {/* Suggested Levels */}
      <div className="bg-blue-50 border border-blue-200 p-3 rounded">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-medium text-blue-900">
            💡 Gợi ý mức giá (Risk 2%)
          </p>
          <button
            type="button"
            onClick={applySuggested}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Áp dụng →
          </button>
        </div>
        <div className="text-xs text-blue-800 space-y-1">
          <p>SL: ${suggestedLevels.sl.toFixed(2)} (-{suggestedLevels.riskPercent}% margin)</p>
          <p>TP1: ${suggestedLevels.tps[0].toFixed(2)} (1:1 R:R)</p>
          <p>TP2: ${suggestedLevels.tps[1].toFixed(2)} (1:2 R:R)</p>
          <p>TP3: ${suggestedLevels.tps[2].toFixed(2)} (1:3 R:R)</p>
        </div>
      </div>

      {/* Take Profit Levels */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-700">
            🎯 Take Profit Levels
          </label>
          <button
            type="button"
            onClick={addTPLevel}
            className="text-xs text-primary-600 hover:text-primary-800 font-medium"
          >
            + Thêm mức
          </button>
        </div>

        <div className="space-y-2">
          {tpLevels.map((tp, index) => {
            const pl = calculatePL(parseFloat(tp.price), parseFloat(tp.percentage))
            return (
              <div key={index} className="flex gap-2 items-center">
                <span className="text-xs text-gray-500 w-10">TP{index + 1}</span>
                <input
                  type="number"
                  placeholder="Giá"
                  value={tp.price}
                  onChange={(e) => handleTPChange(index, 'price', e.target.value)}
                  className="input text-sm flex-1"
                  step="0.01"
                />
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    placeholder="%"
                    value={tp.percentage}
                    onChange={(e) => handleTPChange(index, 'percentage', e.target.value)}
                    className="input text-sm w-16"
                    min="0"
                    max="100"
                  />
                  <span className="text-xs text-gray-400">%</span>
                </div>
                <div className={`text-sm font-bold min-w-[90px] text-right ${
                  pl >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {tp.price ? `${pl >= 0 ? '+' : ''}${pl.toFixed(2)}` : '—'}
                </div>
                {tpLevels.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTPLevel(index)}
                    className="text-red-400 hover:text-red-600 p-1"
                  >
                    ✕
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Stop Loss */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          🛑 Stop Loss
        </label>
        <div className="flex gap-2 items-center">
          <span className="text-xs text-gray-500 w-10">SL</span>
          <input
            type="number"
            placeholder="Giá"
            value={slLevel.price}
            onChange={(e) => setSlLevel({ ...slLevel, price: e.target.value })}
            className="input text-sm flex-1"
            step="0.01"
          />
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={slLevel.percentage}
              readOnly
              className="input text-sm w-16 bg-gray-50"
            />
            <span className="text-xs text-gray-400">%</span>
          </div>
          <div className={`text-sm font-bold min-w-[90px] text-right ${
            slPL >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {slLevel.price ? `${slPL >= 0 ? '+' : ''}${slPL.toFixed(2)}` : '—'}
          </div>
        </div>
      </div>

      {/* Total Potential */}
      <div className="border-t pt-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Lợi nhuận tối đa:</span>
          <span className="font-bold text-green-600">
            {totalTPPL >= 0 ? '+' : ''}{totalTPPL.toFixed(2)} {currency}
          </span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-gray-600">Rủi ro tối đa:</span>
          <span className={`font-bold ${slPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {slLevel.price ? `${slPL.toFixed(2)} ${currency}` : '—'}
          </span>
        </div>
        {slLevel.price && totalTPPL > 0 && slPL < 0 && (
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-600">Risk/Reward:</span>
            <span className="font-bold text-purple-600">
              1:{(totalTPPL / Math.abs(slPL)).toFixed(2)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
