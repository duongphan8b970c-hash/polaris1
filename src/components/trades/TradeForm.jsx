import { useState, useEffect } from 'react'
import { useWallets } from '../../hooks/useWallets'
import { formatCurrency } from '../../lib/utils'

export default function TradeForm({ trade, onSubmit, onCancel, loading }) {
  const { wallets } = useWallets()
  
  const [formData, setFormData] = useState({
    wallet_id: '',
    symbol: '',
    side: 'buy',
    entry_price: '',
    amount: '',
    leverage: '1',
    exit_price: '',
    profit_loss: '',
    notes: '',
  })

  const [isClosing, setIsClosing] = useState(false)

  const selectedWallet = wallets.find(w => w.id === formData.wallet_id)
  const walletCurrency = selectedWallet?.currency || 'USDT'

  useEffect(() => {
    if (trade) {
      setFormData({
        wallet_id: trade.wallet_id,
        symbol: trade.symbol,
        side: trade.side,
        entry_price: trade.entry_price,
        amount: trade.amount || '',
        leverage: trade.leverage || '1',
        exit_price: trade.exit_price || '',
        profit_loss: trade.profit_loss || '',
        notes: trade.notes || '',
      })
      setIsClosing(trade.status === 'closed')
    }
  }, [trade])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.wallet_id) {
      alert('Vui lòng chọn ví')
      return
    }
    
    if (!selectedWallet) {
      alert('Ví được chọn không hợp lệ')
      return
    }
    
    if (!formData.symbol?.trim()) {
      alert('Vui lòng nhập symbol (VD: BTC/USDT)')
      return
    }
    
    const entryPrice = parseFloat(formData.entry_price)
    if (!entryPrice || entryPrice <= 0 || isNaN(entryPrice)) {
      alert('Vui lòng nhập giá vào hợp lệ (phải > 0)')
      return
    }
    
    const amount = parseFloat(formData.amount)
    if (!amount || amount <= 0 || isNaN(amount)) {
      alert('Vui lòng nhập số tiền đầu tư hợp lệ (phải > 0)')
      return
    }
    
    const leverage = parseInt(formData.leverage)
    if (!leverage || leverage < 1 || leverage > 1000) {
      alert('Leverage không hợp lệ (1-1000)')
      return
    }
    
    if (!trade && selectedWallet.current_amount < amount) {
      const confirmLow = window.confirm(
        `Ví chỉ còn ${formatCurrency(selectedWallet.current_amount, walletCurrency)} ` +
        `nhưng bạn muốn trade ${formatCurrency(amount, walletCurrency)}. ` +
        `Bạn có chắc muốn tiếp tục?`
      )
      if (!confirmLow) return
    }
    
    if (isClosing) {
      const exitPrice = parseFloat(formData.exit_price)
      if (!exitPrice || exitPrice <= 0 || isNaN(exitPrice)) {
        alert('Vui lòng nhập giá ra hợp lệ (phải > 0)')
        return
      }
      
      const profitLoss = parseFloat(formData.profit_loss)
      if (profitLoss === undefined || profitLoss === null || isNaN(profitLoss)) {
        alert('Vui lòng nhập số tiền lãi/lỗ')
        return
      }
    }
    
    const dataToSubmit = {
      ...formData,
      currency: walletCurrency,
      amount: amount,
      entry_price: entryPrice,
      leverage: leverage,
      exit_price: formData.exit_price ? parseFloat(formData.exit_price) : null,
      profit_loss: formData.profit_loss ? parseFloat(formData.profit_loss) : null
    }
    
    onSubmit(dataToSubmit)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label label-required">Ví</label>
        <select
          name="wallet_id"
          value={formData.wallet_id}
          onChange={handleChange}
          className="input"
          required
          disabled={loading}
        >
          <option value="">-- Chọn ví --</option>
          {wallets.map(wallet => (
            <option key={wallet.id} value={wallet.id}>
              {wallet.name} ({wallet.currency})
            </option>
          ))}
        </select>
        {!formData.wallet_id && (
          <p className="text-xs text-amber-600 mt-1">
            ⚠️ Chọn ví trước để xác định loại tiền tệ
          </p>
        )}
        {selectedWallet && (
          <p className="text-xs text-gray-500 mt-1">
            Số dư hiện tại: {formatCurrency(selectedWallet.current_amount, walletCurrency)}
          </p>
        )}
      </div>

      <div>
        <label className="label label-required">Symbol</label>
        <input
          type="text"
          name="symbol"
          value={formData.symbol}
          onChange={handleChange}
          className="input"
          placeholder="VD: BTC/USDT, AAPL, EUR/USD"
          required
          disabled={loading}
        />
      </div>

      <div>
        <label className="label label-required">Loại lệnh</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, side: 'buy' }))}
            className={`py-3 px-4 rounded-lg font-medium transition-all ${
              formData.side === 'buy'
                ? 'bg-green-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            disabled={loading}
          >
            <svg className="w-5 h-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
            </svg>
            BUY
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, side: 'sell' }))}
            className={`py-3 px-4 rounded-lg font-medium transition-all ${
              formData.side === 'sell'
                ? 'bg-red-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            disabled={loading}
          >
            <svg className="w-5 h-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
            </svg>
            SELL
          </button>
        </div>
      </div>

                 {/* Entry Price, Amount & Leverage */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Column 1: Entry Price */}
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Giá vào (USD) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="entry_price"
            value={formData.entry_price}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="0.00"
            step="0.00000001"
            min="0"
            required
            disabled={loading || !formData.wallet_id}
          />
          <p className="text-xs text-gray-500 mt-1">💵 Giá vào theo USD</p>
        </div>
        
        {/* Column 2: Amount */}
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Số tiền đầu tư ({walletCurrency}) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="0.00"
            step="0.01"
            min="0.01"
            required
            disabled={loading || !formData.wallet_id}
          />
          <p className="text-xs text-gray-500 mt-1">🔥 Số tiền margin</p>
        </div>
        
        {/* Column 3: Leverage */}
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Đòn bẩy (Leverage) <span className="text-red-500">*</span>
          </label>
          <select
            name="leverage"
            value={formData.leverage}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
            disabled={loading}
          >
            <option value="1">1x (Spot)</option>
            <option value="2">2x</option>
            <option value="3">3x</option>
            <option value="5">5x</option>
            <option value="10">10x</option>
            <option value="20">20x</option>
            <option value="25">25x</option>
            <option value="50">50x</option>
            <option value="75">75x</option>
            <option value="100">100x</option>
            <option value="125">125x</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">🎯 Đòn bẩy giao dịch</p>
        </div>
      </div>

      {trade && trade.status === 'open' && (
        <div className="border-t pt-4">
          <div className="flex items-center mb-3">
            <input
              type="checkbox"
              checked={isClosing}
              onChange={(e) => setIsClosing(e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <label className="ml-2 text-sm font-medium text-gray-700">
              Đóng lệnh này
            </label>
          </div>

          {isClosing && (
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label label-required">Giá ra ({walletCurrency})</label>
                  <input
                    type="number"
                    name="exit_price"
                    value={formData.exit_price}
                    onChange={handleChange}
                    className="input"
                    placeholder="0.00"
                    step="0.00000001"
                    min="0"
                    required={isClosing}
                    disabled={loading}
                  />
                </div>
                
                <div>
                  <label className="label label-required">Lãi/Lỗ ({walletCurrency})</label>
                  <input
                    type="number"
                    name="profit_loss"
                    value={formData.profit_loss}
                    onChange={handleChange}
                    className="input"
                    placeholder="0.00 (+ lãi, - lỗ)"
                    step="0.01"
                    required={isClosing}
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Nhập số dương (+) nếu lãi, số âm (-) nếu lỗ
                  </p>
                </div>
              </div>

              {formData.profit_loss && (
                <div className={`p-3 rounded border ${
                  parseFloat(formData.profit_loss) >= 0 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <p className="text-sm text-gray-600 mb-1">Kết quả giao dịch:</p>
                  <p className={`text-xl font-bold ${
                    parseFloat(formData.profit_loss) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {parseFloat(formData.profit_loss) >= 0 ? '+' : ''}
                    {formatCurrency(parseFloat(formData.profit_loss), walletCurrency)}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div>
        <label className="label">Ghi chú</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          className="input"
          rows="3"
          placeholder="Strategy, setup, reason..."
          disabled={loading}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary flex-1"
          disabled={loading}
        >
          Hủy
        </button>
        <button
          type="submit"
          className="btn btn-primary flex-1"
          disabled={loading || !formData.wallet_id}
        >
          {loading ? 'Đang lưu...' : (trade ? 'Cập nhật' : 'Tạo mới')}
        </button>
      </div>
    </form>
  )
}