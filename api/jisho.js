// api/jisho.js

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  const { kanji } = req.query
  
  if (!kanji) {
    return res.status(400).json({ error: 'Missing kanji parameter' })
  }
  
  try {
    const response = await fetch(
      `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(kanji)}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Polaris/1.0)',
          'Accept': 'application/json'
        }
      }
    )
    
    if (!response.ok) {
      throw new Error(`Jisho API returned ${response.status}`)
    }
    
    const data = await response.json()
    
    return res.status(200).json(data)
  } catch (error) {
    console.error('Jisho API error:', error)
    return res.status(500).json({ 
      error: 'Failed to fetch from Jisho',
      message: error.message 
    })
  }
}