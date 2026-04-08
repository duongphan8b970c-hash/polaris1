// api/rss-proxy.js — Vercel serverless function that fetches RSS feeds server-side
// Avoids all CORS issues since the request goes from Vercel's edge, not the browser.

const ALLOWED_FEEDS = [
  'https://cointelegraph.com/rss',
  'https://www.coindesk.com/arc/outboundfeeds/rss/',
]

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const { url } = req.query
  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' })
  }

  if (!ALLOWED_FEEDS.includes(url)) {
    return res.status(403).json({ error: 'Feed URL not in allowlist' })
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Polaris/1.0)',
        Accept: 'application/rss+xml, application/xml, text/xml',
      },
    })

    if (!response.ok) {
      throw new Error(`Upstream RSS returned ${response.status}`)
    }

    const xml = await response.text()
    res.setHeader('Content-Type', 'application/xml; charset=utf-8')
    return res.status(200).send(xml)
  } catch (error) {
    console.error('RSS proxy error:', error)
    return res.status(502).json({
      error: 'Failed to fetch RSS feed',
      message: error.message,
    })
  }
}
