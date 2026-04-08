// ── RSS feed sources ────────────────────────────────────────────────
const RSS_SOURCES = [
  { url: 'https://cointelegraph.com/rss', name: 'CoinTelegraph' },
  { url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', name: 'CoinDesk' },
]

// ── Cache ───────────────────────────────────────────────────────────
let newsCache = null
let newsCacheTime = 0
const NEWS_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// ── Helpers ─────────────────────────────────────────────────────────

/** Map RSS item categories to UI categories. */
function mapCategory(categories) {
  if (!categories || !Array.isArray(categories) || categories.length === 0) return 'crypto'
  const joined = categories.join(' ').toLowerCase()
  if (joined.includes('regulation') || joined.includes('government') || joined.includes('policy') || joined.includes('cbdc')) return 'macro'
  if (joined.includes('trading') || joined.includes('market') || joined.includes('price') || joined.includes('analysis')) return 'market'
  if (joined.includes('technology') || joined.includes('blockchain') || joined.includes('defi') || joined.includes('nft')) return 'technology'
  return 'crypto'
}

/** Iteratively strip HTML tags and decode entities. */
function stripHtml(html, maxLen = 200) {
  if (!html) return ''
  let text = html
  let prev
  do {
    prev = text
    text = text.replace(/<[^>]*>/g, '')
  } while (text !== prev)
  text = text.replace(/&[^;]+;/g, ' ').trim()
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text
}

// ── Strategy 1: rss2json.com (returns JSON directly) ────────────────
async function fetchViaRss2Json(feedUrl, count) {
  const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}&count=${count}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`rss2json returned ${res.status}`)
  const json = await res.json()
  if (json.status !== 'ok' || !Array.isArray(json.items)) {
    throw new Error(json.message || 'Bad rss2json response')
  }
  return json.items.map((item) => ({
    title: item.title || '',
    description: item.description || '',
    author: item.author || '',
    pubDate: item.pubDate || '',
    link: item.link || '',
    thumbnail: item.thumbnail || item.enclosure?.link || '',
    categories: item.categories || [],
  }))
}

// ── Strategy 2: AllOrigins CORS proxy → client-side XML parse ───────
function parseRssXml(xmlText) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlText, 'text/xml')
  const items = doc.querySelectorAll('item')
  return Array.from(items).map((item) => {
    const getText = (tag) => item.querySelector(tag)?.textContent?.trim() || ''
    // Try to find thumbnail from media:content, media:thumbnail, or enclosure
    let thumbnail = ''
    const mediaContent = item.querySelector('content[url]') || item.querySelector('thumbnail[url]')
    if (mediaContent) {
      thumbnail = mediaContent.getAttribute('url') || ''
    }
    if (!thumbnail) {
      const enclosure = item.querySelector('enclosure[url]')
      if (enclosure) thumbnail = enclosure.getAttribute('url') || ''
    }
    // Extract categories
    const categoryEls = item.querySelectorAll('category')
    const categories = Array.from(categoryEls).map((c) => c.textContent?.trim()).filter(Boolean)

    return {
      title: getText('title'),
      description: getText('description'),
      author: getText('creator') || getText('author') || getText('dc\\:creator'),
      pubDate: getText('pubDate'),
      link: getText('link'),
      thumbnail,
      categories,
    }
  })
}

async function fetchViaAllOrigins(feedUrl) {
  const url = `https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`AllOrigins returned ${res.status}`)
  const xmlText = await res.text()
  return parseRssXml(xmlText)
}

// ── Strategy 3: cors.lol CORS proxy → client-side XML parse ────────
async function fetchViaCorsLol(feedUrl) {
  const url = `https://api.cors.lol/?url=${encodeURIComponent(feedUrl)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`cors.lol returned ${res.status}`)
  const xmlText = await res.text()
  return parseRssXml(xmlText)
}

// ── Proxy strategies in priority order ──────────────────────────────
const PROXY_STRATEGIES = [
  { name: 'rss2json', fn: (feedUrl, count) => fetchViaRss2Json(feedUrl, count) },
  { name: 'AllOrigins', fn: (feedUrl) => fetchViaAllOrigins(feedUrl) },
  { name: 'cors.lol', fn: (feedUrl) => fetchViaCorsLol(feedUrl) },
]

/** Normalise raw items into our UI model. */
function normaliseItems(rawItems, sourceName) {
  return rawItems
    .filter((item) => item.title)
    .map((item, index) => ({
      id: `${sourceName}-${index}-${item.pubDate}`,
      headline: item.title,
      summary: stripHtml(item.description),
      source: item.author || sourceName,
      publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
      url: item.link || '#',
      imageUrl: item.thumbnail || null,
      category: mapCategory(item.categories),
    }))
}

// ── Public service ──────────────────────────────────────────────────
export const cryptoNewsService = {
  /**
   * Fetch latest crypto / market news.
   * Tries multiple CORS proxy strategies for each RSS source.
   * @param {number} limit  – max articles (default 20)
   * @param {boolean} forceRefresh – bypass cache
   * @returns {Promise<Array>} normalised news items
   */
  async getLatestNews(limit = 20, forceRefresh = false) {
    if (!forceRefresh && newsCache && Date.now() - newsCacheTime < NEWS_CACHE_TTL) {
      return newsCache
    }

    const errors = []

    // For each RSS source, try every proxy strategy
    for (const source of RSS_SOURCES) {
      for (const strategy of PROXY_STRATEGIES) {
        try {
          const rawItems = await strategy.fn(source.url, limit)
          const items = normaliseItems(rawItems, source.name).slice(0, limit)
          if (items.length > 0) {
            items.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
            newsCache = items
            newsCacheTime = Date.now()
            return items
          }
        } catch (err) {
          console.warn(`[News] ${strategy.name} × ${source.name} failed:`, err.message)
          errors.push(`${strategy.name}×${source.name}: ${err.message}`)
        }
      }
    }

    throw new Error(
      errors.length > 0
        ? `Tất cả nguồn tin đều thất bại (${errors.length} lỗi). Thử: ${errors[errors.length - 1]}`
        : 'Không thể tải tin tức từ bất kỳ nguồn nào',
    )
  },
}
