import { useState, useEffect, useCallback } from 'react'
import { parseKanjiVGSVG } from '../../utils/svgPathParser'

const cache = {}

/**
 * Hook to fetch and parse KanjiVG stroke data for a given kanji character
 *
 * @param {string} kanji - Single kanji character
 * @param {number} canvasSize - Target canvas size for coordinate scaling
 * @returns {{ strokes, totalStrokes, loading, error, refetch }}
 */
export default function useKanjiStrokes(kanji, canvasSize = 400) {
  const [strokes, setStrokes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchStrokes = useCallback(async () => {
    if (!kanji) return

    const unicode = kanji.charCodeAt(0).toString(16).padStart(5, '0')
    const cacheKey = `${unicode}-${canvasSize}`

    if (cache[cacheKey]) {
      setStrokes(cache[cacheKey])
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const url = `https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${unicode}.svg`
      const res = await fetch(url)
      if (!res.ok) {
        throw new Error('Stroke data not available for this kanji')
      }
      const svgText = await res.text()
      const parsed = parseKanjiVGSVG(svgText, canvasSize)

      if (parsed.length === 0) {
        throw new Error('No stroke data found for this kanji')
      }

      cache[cacheKey] = parsed
      setStrokes(parsed)
    } catch (err) {
      setError(err.message || 'Failed to load stroke data')
      setStrokes([])
    } finally {
      setLoading(false)
    }
  }, [kanji, canvasSize])

  useEffect(() => {
    fetchStrokes()
  }, [fetchStrokes])

  return {
    strokes,
    totalStrokes: strokes.length,
    loading,
    error,
    refetch: fetchStrokes,
  }
}
