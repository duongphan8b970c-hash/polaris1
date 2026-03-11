import { detectRadicalFromKanji } from './kanjiRadicals'

/**
 * Fetch Kanji data from Jisho.org API via Vercel serverless function
 */
export async function fetchKanjiFromJisho(kanji) {
  try {
    console.log('🔍 Fetching Kanji:', kanji)
    
    // Use Vercel serverless function
    const response = await fetch(`/api/jisho?kanji=${encodeURIComponent(kanji)}`)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    if (!data.data || data.data.length === 0) {
      throw new Error(`Kanji "${kanji}" not found in Jisho`)
    }
    
    const result = data.data[0]
    
    console.log('✅ Jisho data:', result)
    
    // Extract meanings
    const meanings = result.senses
      .flatMap(s => s.english_definitions)
      .filter(Boolean)
      .slice(0, 5)
    
    // Extract readings
    const allReadings = result.japanese
      .filter(j => j.reading)
      .map(j => j.reading)
      .filter(Boolean)
    
    // Extract actual Kanji character from result
    const actualKanji = result.japanese
      .find(j => j.word && j.word.includes(kanji))?.word || kanji
    
    return {
      kanji: actualKanji,
      meanings: meanings.length > 0 ? meanings : ['No meanings found'],
      readings_on: allReadings.length > 0 ? allReadings : [],
      readings_kun: [],
      radical: extractRadical(result, kanji),
      stroke_count: extractStrokeCount(result),
      jisho_data: result
    }
  } catch (error) {
    console.error('❌ Jisho API error:', error)
    throw new Error(`Failed to fetch Kanji: ${error.message}`)
  }
}

/**
 * Extract radical from Jisho data, with fallback to local kanji lookup
 */
function extractRadical(jishoData, originalKanji) {
  if (jishoData && jishoData.tags) {
    const tags = jishoData.tags
    
    // Look for radical tag
    const radicalTag = tags.find(t => 
      typeof t === 'string' && t.toLowerCase().includes('radical')
    )
    
    if (radicalTag) {
      // Try to extract the radical character (CJK Unified Ideographs)
      const match = radicalTag.match(/[一-龯]/u)
      if (match) return match[0]
    }
  }
  
  // Fallback: Try to detect from kanji itself using local lookup
  if (originalKanji) {
    const detected = detectRadicalFromKanji(originalKanji)
    if (detected) return detected
  }
  
  return null // Will trigger manual selection modal
}

/**
 * Extract stroke count from Jisho data
 */
function extractStrokeCount(jishoData) {
  if (!jishoData || !jishoData.tags) return null
  
  const tags = jishoData.tags
  
  // Look for stroke count tag
  const strokeTag = tags.find(t => 
    typeof t === 'string' && t.toLowerCase().includes('stroke')
  )
  
  if (strokeTag) {
    const match = strokeTag.match(/\d+/)
    return match ? parseInt(match[0]) : null
  }
  
  return null
}