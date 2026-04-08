const CRYPTOCOMPARE_NEWS_URL = 'https://min-api.cryptocompare.com/data/v2/news/'

// Cache to avoid hammering the API on every render
let newsCache = null
let newsCacheTime = 0
const NEWS_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Map CryptoCompare categories to our UI categories.
 * CryptoCompare returns pipe-separated strings like "BTC|Trading|Market".
 */
function mapCategory(raw) {
  if (!raw) return 'crypto'
  const lower = raw.toLowerCase()
  if (lower.includes('regulation') || lower.includes('government') || lower.includes('fiat')) return 'macro'
  if (lower.includes('trading') || lower.includes('market')) return 'market'
  if (lower.includes('technology') || lower.includes('blockchain')) return 'technology'
  return 'crypto'
}

export const cryptoNewsService = {
  /**
   * Fetch latest crypto / market news.
   * Uses CryptoCompare's free, no-auth-required news endpoint.
   * @param {number} limit - number of articles to return (max 50)
   * @param {boolean} forceRefresh - bypass cache
   * @returns {Promise<Array>} normalised news items
   */
  async getLatestNews(limit = 20, forceRefresh = false) {
    // Return cache if still fresh
    if (!forceRefresh && newsCache && Date.now() - newsCacheTime < NEWS_CACHE_TTL) {
      return newsCache
    }

    const url = `${CRYPTOCOMPARE_NEWS_URL}?lang=EN&limit=${limit}`
    const response = await fetch(url)
    if (!response.ok) throw new Error(`News API returned ${response.status}`)

    const json = await response.json()
    if (json.Type !== 100 || !Array.isArray(json.Data)) {
      throw new Error(json.Message || 'Unexpected response from news API')
    }

    const items = json.Data.map((article) => ({
      id: article.id,
      headline: article.title,
      summary: article.body?.slice(0, 200) || '',
      source: article.source_info?.name || article.source || 'Unknown',
      publishedAt: new Date(article.published_on * 1000).toISOString(),
      url: article.url,
      imageUrl: article.imageurl,
      category: mapCategory(article.categories),
    }))

    newsCache = items
    newsCacheTime = Date.now()
    return items
  },
}
