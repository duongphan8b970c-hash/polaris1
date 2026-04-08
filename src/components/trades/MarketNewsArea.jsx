// Placeholder market news items — replace with a real API integration as needed
const HOUR_MS = 60 * 60 * 1000

const PLACEHOLDER_NEWS = [
  {
    id: 1,
    headline: 'Bitcoin vượt ngưỡng 70,000 USD, thị trường tăng mạnh',
    source: 'CoinDesk',
    publishedAt: new Date(Date.now() - 1 * HOUR_MS).toISOString(),
    summary:
      'Bitcoin đạt mức cao mới trong tuần khi dòng tiền tổ chức tiếp tục đổ vào thị trường crypto, đẩy tổng vốn hóa thị trường lên trên 2.5 nghìn tỷ USD.',
    url: '#',
    category: 'crypto',
  },
  {
    id: 2,
    headline: 'Fed giữ nguyên lãi suất, tín hiệu cắt giảm trong năm nay',
    source: 'Reuters',
    publishedAt: new Date(Date.now() - 3 * HOUR_MS).toISOString(),
    summary:
      'Cục Dự trữ Liên bang Mỹ giữ lãi suất ở mức 5.25–5.5%, đồng thời phát đi tín hiệu có thể cắt giảm lãi suất vào cuối năm nếu lạm phát tiếp tục hạ nhiệt.',
    url: '#',
    category: 'macro',
  },
  {
    id: 3,
    headline: 'Ethereum hoàn thành nâng cấp mạng, gas fee giảm đáng kể',
    source: 'The Block',
    publishedAt: new Date(Date.now() - 5 * HOUR_MS).toISOString(),
    summary:
      'Mạng Ethereum vừa triển khai thành công bản nâng cấp mới, giúp giảm phí giao dịch và tăng tốc độ xử lý, mở ra cơ hội cho các ứng dụng DeFi và NFT.',
    url: '#',
    category: 'crypto',
  },
  {
    id: 4,
    headline: 'Chỉ số S&P 500 đạt đỉnh mới, cổ phiếu công nghệ dẫn đầu',
    source: 'Bloomberg',
    publishedAt: new Date(Date.now() - 8 * HOUR_MS).toISOString(),
    summary:
      'Phố Wall ghi nhận phiên tăng mạnh với S&P 500 leo lên mức cao lịch sử, dẫn đầu là nhóm cổ phiếu công nghệ sau khi một số công ty lớn công bố kết quả kinh doanh vượt kỳ vọng.',
    url: '#',
    category: 'stocks',
  },
  {
    id: 5,
    headline: 'Altcoin mùa bắt đầu? SOL và AVAX tăng hơn 15% trong tuần',
    source: 'CoinTelegraph',
    publishedAt: new Date(Date.now() - 12 * HOUR_MS).toISOString(),
    summary:
      'Một số altcoin hàng đầu như Solana (SOL) và Avalanche (AVAX) ghi nhận mức tăng ấn tượng trong tuần, làm dấy lên kỳ vọng về một đợt alt season mới.',
    url: '#',
    category: 'crypto',
  },
]

const CATEGORY_COLORS = {
  crypto: 'bg-orange-50 text-orange-600',
  macro: 'bg-blue-50 text-blue-600',
  stocks: 'bg-green-50 text-green-600',
}

const CATEGORY_LABELS = {
  crypto: 'Crypto',
  macro: 'Vĩ mô',
  stocks: 'Cổ phiếu',
}

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return `${diff} giây trước`
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`
  return `${Math.floor(diff / 86400)} ngày trước`
}

export default function MarketNewsArea() {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-gray-900">Tin Tức Thị Trường</h2>
        <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-1">
          Dữ liệu mẫu
        </span>
      </div>

      <div className="space-y-3">
        {PLACEHOLDER_NEWS.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
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
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-center text-gray-400">
        Kết nối API tin tức thực tế để hiển thị tin tức cập nhật theo thời gian thực.
      </p>
    </div>
  )
}
