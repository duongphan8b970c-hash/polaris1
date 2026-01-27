export default async function handler(req, res) {
  try {
    console.log('🔄 Starting update-rates function...')
    
    // Check authorization
    const authHeader = req.headers.authorization
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`
    
    console.log('Auth check:', authHeader === expectedAuth ? 'OK' : 'FAILED')
    
    if (authHeader !== expectedAuth) {
      console.log('❌ Unauthorized')
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid CRON_SECRET' 
      })
    }

    console.log('✅ Authorized, fetching rates...')

    // Fetch exchange rates
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`)
    }

    const data = await response.json()
    
    console.log('✅ Got rates:', Object.keys(data.rates).length, 'currencies')

    // Return success without Supabase for now (testing)
    return res.status(200).json({
      success: true,
      message: 'Test successful - rates fetched',
      usd_to_vnd: data.rates.VND,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error:', error.message)
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    })
  }
}