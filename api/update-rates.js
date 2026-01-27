import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

// Supported currencies to track
const SUPPORTED_CURRENCIES = ['USD','USDT', 'EUR', 'JPY', 'CNY', 'THB', 'SGD', 'KRW', 'GBP']

export default async function handler(req, res) {
  try {
    // Security: Verify cron secret
    const authHeader = req.headers.authorization
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    console.log('🔄 Fetching latest exchange rates...')

    // Fetch rates from ExchangeRate-API (Free, no API key needed)
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
    
    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates from API')
    }

    const data = await response.json()
    const usdToVnd = data.rates.VND

    console.log(`💵 USD to VND: ${usdToVnd}`)

    // Prepare rate updates
    const updates = []

    // VND to VND = 1 (base currency)
    updates.push({
      from_currency: 'VND',
      to_currency: 'VND',
      rate: 1,
      updated_at: new Date().toISOString()
    })

    // Calculate each currency to VND
    for (const currency of SUPPORTED_CURRENCIES) {
      if (data.rates[currency]) {
        // Convert: 1 CURRENCY = ? VND
        const rateToVnd = currency === 'USD' 
          ? usdToVnd 
          : usdToVnd / data.rates[currency]

        updates.push({
          from_currency: currency,
          to_currency: 'VND',
          rate: parseFloat(rateToVnd.toFixed(4)),
          updated_at: new Date().toISOString()
        })

        console.log(`💱 ${currency} to VND: ${rateToVnd.toFixed(2)}`)
      }
    }

    // Update Supabase exchange_rates table
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

    // Recalculate all wallet balances with new rates
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
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}