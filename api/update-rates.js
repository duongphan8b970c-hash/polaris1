module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  
  try {
    // Check authorization
    const authHeader = req.headers.authorization
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`
    
    if (authHeader !== expectedAuth) {
      return res.status(401).json({ 
        success: false,
        error: 'Unauthorized'
      })
    }

    // Use require instead of import
    const { createClient } = require('@supabase/supabase-js')

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

    const SUPPORTED_CURRENCIES = ['USD', 'USDT', 'EUR', 'JPY', 'CNY', 'THB', 'SGD', 'KRW', 'GBP']

    // Fetch rates
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
    
    if (!response.ok) {
      throw new Error(`Exchange API returned ${response.status}`)
    }

    const data = await response.json()
    const usdToVnd = data.rates.VND

    // Prepare updates
    const updates = []

    updates.push({
      from_currency: 'VND',
      to_currency: 'VND',
      rate: 1,
      updated_at: new Date().toISOString()
    })

    for (const currency of SUPPORTED_CURRENCIES) {
      if (['USDT', 'USDC', 'BUSD'].includes(currency)) {
        updates.push({
          from_currency: currency,
          to_currency: 'VND',
          rate: parseFloat(usdToVnd.toFixed(4)),
          updated_at: new Date().toISOString()
        })
      } else if (data.rates[currency]) {
        const rateToVnd = currency === 'USD' 
          ? usdToVnd 
          : usdToVnd / data.rates[currency]

        updates.push({
          from_currency: currency,
          to_currency: 'VND',
          rate: parseFloat(rateToVnd.toFixed(4)),
          updated_at: new Date().toISOString()
        })
      }
    }

    // Update Supabase
    for (const update of updates) {
      const { error } = await supabase
        .from('exchange_rates')
        .upsert(update, {
          onConflict: 'from_currency,to_currency'
        })

      if (error) throw error
    }

    // Recalculate wallets
    await supabase.rpc('recalculate_all_wallet_balances')

    // Log success
    await supabase.from('rate_update_logs').insert({
      status: 'success',
      message: 'Exchange rates updated',
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
    console.error('Error:', error)
    
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}