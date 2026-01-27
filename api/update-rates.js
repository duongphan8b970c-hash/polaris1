// api/update-rates.js
export default async function handler(req, res) {
  // Set headers
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    // Check auth
    const authHeader = req.headers.authorization
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`
    
    if (authHeader !== expectedAuth) {
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized' 
      })
    }

    // Check env vars
    if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ 
        success: false, 
        error: 'Missing environment variables',
        debug: {
          has_url: !!process.env.VITE_SUPABASE_URL,
          has_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY
        }
      })
    }

    // Import Supabase
    const { createClient } = await import('@supabase/supabase-js')

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const CURRENCIES = ['USD', 'USDT', 'EUR', 'JPY', 'CNY', 'THB', 'SGD', 'KRW', 'GBP']

    // Fetch exchange rates
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
    
    if (!response.ok) {
      throw new Error(`Exchange API error: ${response.status}`)
    }

    const data = await response.json()
    const usdToVnd = data.rates.VND

    if (!usdToVnd) {
      throw new Error('VND rate not found')
    }

    // Prepare updates
    const updates = []

    // VND to VND
    updates.push({
      from_currency: 'VND',
      to_currency: 'VND',
      rate: 1,
      updated_at: new Date().toISOString()
    })

    // Other currencies
    for (const currency of CURRENCIES) {
      if (['USDT', 'USDC', 'BUSD'].includes(currency)) {
        updates.push({
          from_currency: currency,
          to_currency: 'VND',
          rate: parseFloat(usdToVnd.toFixed(4)),
          updated_at: new Date().toISOString()
        })
      } else if (data.rates[currency]) {
        const rate = currency === 'USD' ? usdToVnd : usdToVnd / data.rates[currency]
        updates.push({
          from_currency: currency,
          to_currency: 'VND',
          rate: parseFloat(rate.toFixed(4)),
          updated_at: new Date().toISOString()
        })
      }
    }

    // Update database
    for (const update of updates) {
      const { error } = await supabase
        .from('exchange_rates')
        .upsert(update, { onConflict: 'from_currency,to_currency' })

      if (error) {
        console.error('DB error:', error)
        throw new Error(`Database error: ${error.message}`)
      }
    }

    // Recalculate wallets
    const { error: recalcError } = await supabase.rpc('recalculate_all_wallet_balances')
    
    if (recalcError) {
      console.log('Recalc warning:', recalcError.message)
    }

    // Log success
    await supabase.from('rate_update_logs').insert({
      status: 'success',
      message: 'Exchange rates updated successfully',
      rates_updated: updates.length
    }).catch(() => {})

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
    console.error('Error:', error.message)
    
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}