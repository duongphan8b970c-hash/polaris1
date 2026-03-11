/**
 * Fetch Kanji data from Jisho.org API with CORS proxy
 */
export async function fetchKanjiFromJisho(kanji) {
  try {
    // Use CORS proxy
    const proxyUrl = 'https://api.allorigins.win/raw?url='
    const jishoUrl = `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(kanji)}`
    const fullUrl = proxyUrl + encodeURIComponent(jishoUrl)
    
    const response = await fetch(fullUrl)
    
    if (!response.ok) {
      throw new Error('Failed to fetch from Jisho API')
    }
    
    const data = await response.json()
    
    if (!data.data || data.data.length === 0) {
      throw new Error(`Kanji "${kanji}" not found`)
    }
    
    const result = data.data[0]
    
    // Extract meanings
    const meanings = result.senses
      .flatMap(s => s.english_definitions)
      .slice(0, 5)
    
    // Extract readings
    const allReadings = result.japanese
      .filter(j => j.reading)
      .map(j => j.reading)
    
    return {
      kanji: kanji,
      meanings: meanings,
      readings_on: allReadings,
      readings_kun: [],
      radical: extractRadical(result),
      stroke_count: extractStrokeCount(result),
      jisho_data: result
    }
  } catch (error) {
    console.error('Jisho API error:', error)
    throw error
  }
}

/**
 * Extract radical from Jisho data
 */
function extractRadical(jishoData) {
  const tags = jishoData.tags || []
  const radicalTag = tags.find(t => 
    t.toLowerCase().includes('radical')
  )
  return radicalTag || null
}

/**
 * Extract stroke count from Jisho data
 */
function extractStrokeCount(jishoData) {
  const tags = jishoData.tags || []
  const strokeTag = tags.find(t => 
    t.toLowerCase().includes('stroke')
  )
  
  if (strokeTag) {
    const match = strokeTag.match(/\d+/)
    return match ? parseInt(match[0]) : null
  }
  
  return null
}