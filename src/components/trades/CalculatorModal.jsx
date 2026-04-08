import { useState, useEffect } from 'react'
import Modal from '../common/Modal'
import PositionCalculator from './PositionCalculator'
import { useBinancePrice } from '../../hooks/useBinancePrice'
import { binanceService } from '../../services/binanceService'

export default function CalculatorModal({ isOpen, onClose }) {
  const [symbol, setSymbol] = useState('')
  const [symbols, setSymbols] = useState([])
  const [symbolSearch, setSymbolSearch] = useState('')
  const [showSymbolDropdown, setShowSymbolDropdown] = useState(false)
  const [side, setSide] = useState('buy')
  const [entryPrice, setEntryPrice] = useState('')
  const [amount, setAmount] = useState('')
  const [leverage, setLeverage] = useState('10')
  const [currency, setCurrency] = useState('USDT')

  const { price: livePrice } = useBinancePrice(symbol, isOpen)

  // Derive entry price from live price when symbol changes and no manual entry
  const derivedEntryPrice = (!entryPrice && livePrice) ? livePrice.toString() : entryPrice

  // Fetch symbols
  useEffect(() => {
    if (isOpen && symbols.length === 0) {
      binanceService.getSymbolList().then(setSymbols)
    }
  }, [isOpen, symbols.length])

  const filteredSymbols = symbolSearch
    ? symbols.filter(s =>
        s.baseAsset.toLowerCase().includes(symbolSearch.toLowerCase()) ||
        s.displayName.toLowerCase().includes(symbolSearch.toLowerCase())
      ).slice(0, 20)
    : symbols.slice(0, 20)

  const handleSelectSymbol = (s) => {
    setSymbol(s.displayName)
    setEntryPrice('') // Reset to let live price fill in
    setShowSymbolDropdown(false)
    setSymbolSearch('')
  }

  const handleReset = () => {
    setSymbol('')
    setEntryPrice('')
    setAmount('')
    setLeverage('10')
    setSide('buy')
    setCurrency('USDT')
  }

  const parsedEntry = parseFloat(derivedEntryPrice)
  const parsedAmount = parseFloat(amount)
  const parsedLeverage = parseInt(leverage) || 1
  const showCalculator = parsedEntry > 0 && parsedAmount > 0

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🧮 Price Calculator">
      <div className="space-y-4">
        {/* Symbol selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Symbol</label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSymbolDropdown(!showSymbolDropdown)}
              className="w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex justify-between items-center"
            >
              <span className={symbol ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                {symbol || 'Chọn symbol...'}
              </span>
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showSymbolDropdown && (
              <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-hidden">
                <div className="p-2 border-b">
                  <input
                    type="text"
                    placeholder="Tìm symbol..."
                    value={symbolSearch}
                    onChange={(e) => setSymbolSearch(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-primary-500"
                    autoFocus
                  />
                </div>
                <div className="overflow-y-auto max-h-44">
                  {filteredSymbols.map(s => (
                    <button
                      key={s.symbol}
                      type="button"
                      onClick={() => handleSelectSymbol(s)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-primary-50 flex justify-between"
                    >
                      <span className="font-medium">{s.baseAsset}</span>
                      <span className="text-xs text-gray-400">/{s.quoteAsset}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          {livePrice && symbol && (
            <p className="text-xs text-gray-500 mt-1">
              Live: <span className="font-medium text-primary-600">${livePrice.toFixed(2)}</span>
            </p>
          )}
        </div>

        {/* Side */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Loại lệnh</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSide('buy')}
              className={`py-2 rounded-lg font-medium text-sm transition-all ${
                side === 'buy' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              ↑ LONG
            </button>
            <button
              type="button"
              onClick={() => setSide('sell')}
              className={`py-2 rounded-lg font-medium text-sm transition-all ${
                side === 'sell' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              ↓ SHORT
            </button>
          </div>
        </div>

        {/* Entry Price, Amount, Leverage */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Entry Price</label>
            <input
              type="number"
              value={derivedEntryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent"
              placeholder={livePrice ? livePrice.toFixed(2) : '0.00'}
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Margin ({currency})</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent"
              placeholder="0.00"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Leverage</label>
            <select
              value={leverage}
              onChange={(e) => setLeverage(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent"
            >
              {[1,2,3,5,10,20,25,50,75,100,125].map(v => (
                <option key={v} value={v}>{v}x</option>
              ))}
            </select>
          </div>
        </div>

        {/* Calculator */}
        {showCalculator ? (
          <div className="border-t pt-4">
            <PositionCalculator
              entryPrice={parsedEntry}
              amount={parsedAmount}
              leverage={parsedLeverage}
              side={side}
              currency={currency}
            />
          </div>
        ) : (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-400">
              Nhập entry price và margin để xem ước lượng
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="btn btn-secondary flex-1 text-sm"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary flex-1 text-sm"
          >
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  )
}
