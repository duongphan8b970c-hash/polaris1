const RSS2JSON_BASE = 'https://api.rss2json.com/v1/api.json'

// RSS feeds from major crypto news outlets
const RSS_SOURCES = [
  {
    url: 'https://cointelegraph.com/rss',
    name: 'CoinTelegraph',
  },
  {
    url: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
    name: 'CoinDesk',
  },
]

// Cache to avoid hammering the API on every render
let newsCache = null
let newsCacheTime = 0
const NEWS_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Map RSS item categories to our UI categories.
 */
function mapCategory(categories) {
  if (!categories || !Array.isArray(categories) || categories.length === 0) return 'crypto'
  const joined = categories.join(' ').toLowerCase()
  if (joined.includes('regulation') || joined.includes('government') || joined.includes('policy') || joined.includes('cbdc')) return 'macro'
  if (joined.includes('trading') || joined.includes('market') || joined.includes('price') || joined.includes('analysis')) return 'market'
  if (joined.includes('technology') || joined.includes('blockchain') || joined.includes('defi') || joined.includes('nft')) return 'technology'
  return 'crypto'
}

/**
 * Strip HTML tags from a string and trim to maxLen characters.
 */
function stripHtml(html, maxLen = 200) {
  if (!html) return ''
  // Apply tag removal iteratively to handle nested/broken tags like <scr<script>ipt>
  let text = html
  let prev
  do {
    prev = text
    text = text.replace(/<[^>]*>/g, '')
  } while (text !== prev)
  text = text.replace(/&[^;]+;/g, ' ').trim()
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text
}

/**
 * Fetch news from a single RSS source via rss2json.
 */
async function fetchFromRss(source, count) {
  const url = `${RSS2JSON_BASE}?rss_url=${encodeURIComponent(source.url)}&count=${count}`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`RSS proxy returned ${response.status}`)

  const json = await response.json()
  if (json.status !== 'ok' || !Array.isArray(json.items)) {
    throw new Error(json.message || 'Unexpected response from RSS proxy')
  }

  return json.items.map((item, index) => ({
    id: `${source.name}-${index}-${item.pubDate}`,
    headline: item.title || 'Untitled',
    summary: stripHtml(item.description),
    source: item.author || source.name,
    publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
    url: item.link || '#',
    imageUrl: item.thumbnail || item.enclosure?.link || null,
    category: mapCategory(item.categories),
  }))
}

export const cryptoNewsService = {
  /**
   * Fetch latest crypto / market news from RSS feeds.
   * Uses rss2json.com as a free, no-auth CORS-friendly RSS-to-JSON proxy.
   * Tries CoinTelegraph first, falls back to CoinDesk.
   * @param {number} limit - number of articles to return (max 50)
   * @param {boolean} forceRefresh - bypass cache
   * @returns {Promise<Array>} normalised news items
   */
  async getLatestNews(limit = 20, forceRefresh = false) {
    // Return cache if still fresh
    if (!forceRefresh && newsCache && Date.now() - newsCacheTime < NEWS_CACHE_TTL) {
      return newsCache
    }

    let lastError = null

    // Try each RSS source until one succeeds
    for (const source of RSS_SOURCES) {
      try {
        const items = await fetchFromRss(source, limit)
        if (items.length > 0) {
          // Sort by date (newest first)
          items.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
          newsCache = items
          newsCacheTime = Date.now()
          return items
        }
      } catch (err) {
        console.warn(`Failed to fetch news from ${source.name}:`, err.message)
        lastError = err
      }
    }

    throw lastError || new Error('Không thể tải tin tức từ bất kỳ nguồn nào')
  },
}

