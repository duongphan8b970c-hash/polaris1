import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
  ) 

const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'JPY', 'CNY', 'THB', 'SGD', 'KRW', 'GBP']

export default async function handler(req, res) {
  try {
    const authHeader = req.headers.authorization
    if (authHeader !== `Bearer ${process.env.VITE_CRON_SECRET}`) {
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

    for (const currency of SUPPORTED_CURRENCIES) {
  if (data.rates[currency]) {
    // Bước 1: Tính 1 Currency = ? VND
    let currencyToVnd
    
    if (currency === 'USD') {
      currencyToVnd = usdToVnd  // 1 USD = usdToVnd VND
    } else {
      // VD: EUR → VND
      // 1 EUR = (rate[EUR] / rate[USD]) * usdToVnd
      // VD: 1 EUR = 1.1 USD → 1 EUR = 1.1 * 25000 = 27500 VND
      currencyToVnd = (data.rates[currency] / data.rates.USD) * usdToVnd
    }

    // Bước 2: Tính 1 VND = ? Currency
    const vndToCurrency = 1 / currencyToVnd

    // XUÔI: Currency → VND (VD: USD → VND)
    updates.push({
      from_currency: currency,
      to_currency: 'VND',
      rate: parseFloat(currencyToVnd.toFixed(4)),
      updated_at: new Date().toISOString()
    })

    // NGƯỢC: VND → Currency (VD: VND → USD)
    updates.push({
      from_currency: 'VND',
      to_currency: currency,
      rate: parseFloat(vndToCurrency.toFixed(8)),
      updated_at: new Date().toISOString()
    })

    console.log(`💱 ${currency} ↔ VND:`)
    console.log(`   ${currency} → VND: ${currencyToVnd.toFixed(2)}`)
    console.log(`   VND → ${currency}: ${vndToCurrency.toFixed(8)}`)
      }
    }

    // Update database
    console.log('💾 Updating database...')
    
    // ✅ BATCH UPSERT - Nhanh hơn nhiều!
    console.log(`💾 Updating ${updates.length} exchange rates...`)

    const { error: upsertError } = await supabase
      .from('exchange_rates')
      .upsert(updates, {
        onConflict: 'from_currency,to_currency',
        ignoreDuplicates: false  // Update nếu đã tồn tại
      })

    if (upsertError) {
      console.error('❌ Error batch updating exchange rates:', upsertError)
      throw upsertError
    }

    console.log('✅ All exchange rates updated successfully!')

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
    
    