import { useState, useEffect, useCallback } from 'react'
import { cryptoNewsService } from '../../services/cryptoNewsService'

const CATEGORY_COLORS = {
  crypto: 'bg-orange-50 text-orange-600',
  macro: 'bg-blue-50 text-blue-600',
  market: 'bg-green-50 text-green-600',
  technology: 'bg-purple-50 text-purple-600',
}

const CATEGORY_LABELS = {
  crypto: 'Crypto',
  macro: 'Vĩ mô',
  market: 'Thị trường',
  technology: 'Công nghệ',
}

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return `${diff} giây trước`
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`
  return `${Math.floor(diff / 86400)} ngày trước`
}

export default function MarketNewsArea() {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchNews = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)
      const items = await cryptoNewsService.getLatestNews(20, forceRefresh)
      setNews(items)
    } catch (err) {
      console.error('Failed to fetch news:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNews()
  }, [fetchNews])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => fetchNews(true), 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchNews])

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-gray-900">Tin Tức Thị Trường</h2>
        <button
          onClick={() => fetchNews(true)}
          disabled={loading}
          className="text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1 hover:bg-gray-200 transition-colors disabled:opacity-50"
          title="Làm mới tin tức"
        >
          {loading ? 'Đang tải...' : '↻ Làm mới'}
        </button>
      </div>

      {/* Error state */}
      {error && !loading && news.length === 0 && (
        <div className="text-center py-10">
          <p className="text-sm text-red-500 mb-2">Không thể tải tin tức</p>
          <p className="text-xs text-gray-400 mb-3">{error}</p>
          <button
            onClick={() => fetchNews(true)}
            className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && news.length === 0 && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse">
              <div className="flex gap-2 mb-2">
                <div className="h-4 w-14 bg-gray-200 rounded-full" />
                <div className="h-4 w-16 bg-gray-100 rounded" />
              </div>
              <div className="h-4 w-full bg-gray-200 rounded mb-2" />
              <div className="h-3 w-3/4 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* News list */}
      {news.length > 0 && (
        <div className="space-y-3">
          {news.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[item.category] || 'bg-gray-100 text-gray-600'}`}
                    >
                      {CATEGORY_LABELS[item.category] || item.category}
                    </span>
                    <span className="text-xs text-gray-400">{item.source}</span>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-gray-400">{timeAgo(item.publishedAt)}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1 leading-snug">
                    {item.headline}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                    {item.summary}
                  </p>
                </div>
                <svg
                  className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </div>
            </a>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs text-center text-gray-400">
        Nguồn: CoinTelegraph / CoinDesk · Tự động cập nhật mỗi 5 phút
      </p>
    </div>
  )
}
