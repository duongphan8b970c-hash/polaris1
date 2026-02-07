import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'JPY', 'CNY', 'THB', 'SGD', 'KRW', 'GBP']

export default async function handler(req, res) {
  try {
    const authHeader = req.headers.authorization
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    console.log('🔄 Fetching latest exchange rates...')

    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
    
    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates from API')
    }

    const data = await response.json()
    const usdToVnd = data.rates.VND

    console.log(`💵 USD to VND: ${usdToVnd}`)

    const updates = []

    // VND to VND = 1
    updates.push({
      from_currency: 'VND',
      to_currency: 'VND',
      rate: 1,
      updated_at: new Date().toISOString()
    })

    // ✅ PHẦN ĐÃ SỬA: Thêm tỷ giá 2 chiều
    for (const currency of SUPPORTED_CURRENCIES) {
      if (data.rates[currency]) {
        const rateToVnd = currency === 'USD' 
          ? usdToVnd 
          : usdToVnd / data.rates[currency]

        // XUÔI: Currency → VND
        updates.push({
          from_currency: currency,
          to_currency: 'VND',
          rate: parseFloat(rateToVnd.toFixed(4)),
          updated_at: new Date().toISOString()
        })

        // NGƯỢC: VND → Currency
        const rateFromVnd = 1 / rateToVnd
        updates.push({
          from_currency: 'VND',
          to_currency: currency,
          rate: parseFloat(rateFromVnd.toFixed(8)),
          updated_at: new Date().toISOString()
        })

        console.log(`💱 ${currency} → VND: ${rateToVnd.toFixed(2)} | VND → ${currency}: ${rateFromVnd.toFixed(8)}`)
      }
    }

    // Update database
    console.log('💾 Updating database...')
    
    for (const update of updates) {
      const { error } = await supabase
        .from('exchange_rates')
        .upsert(update, {
          onConflict: 'from_currency,to_currency'
        })

      if (error) {
        console.error(`❌ Error updating ${update.from_currency}:`, error)
        throw error
      }
    }

    console.log('🔢 Recalculating wallet balances...')
    
    const { error: recalcError } = await supabase.rpc('recalculate_all_wallet_balances')
    
    if (recalcError) {
      console.error('❌ Error recalculating balances:', recalcError)
      throw recalcError
    }

    console.log('✅ Exchange rates updated successfully!')

    return res.status(200).json({
      success: true,
      message: 'Exchange rates updated successfully',
      updated_currencies: updates.length,
      rates: updates.map(u => ({ 
        currency: u.from_currency, 
        rate: u.rate 
      })),
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error updating exchange rates:', error)
    return res.status(500).json({ 
      success: false,
      error: error.message 
    })
  }
}
    
    