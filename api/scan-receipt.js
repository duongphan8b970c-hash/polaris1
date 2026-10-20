// api/scan-receipt.js
// Đọc ảnh hóa đơn / ảnh chụp màn hình giao dịch bằng Claude Haiku 5.5 và trả về dữ liệu để điền sẵn form giao dịch.
import Anthropic from '@anthropic-ai/sdk'
import { jsonSchemaOutputFormat } from '@anthropic-ai/sdk/helpers/json-schema'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const anthropic = new Anthropic() // đọc ANTHROPIC_API_KEY từ biến môi trường

const ALLOWED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_IMAGE_BASE64_LENGTH = 4 * 1024 * 1024 // Vercel giới hạn body ~4.5MB

const buildSchema = (categoryIds) => ({
  type: 'object',
  properties: {
    is_receipt: { type: 'boolean' },
    amount: { type: 'number' },
    currency: { type: 'string' },
    date: { type: 'string' },
    time: { type: 'string' },
    merchant: { type: 'string' },
    description: { type: 'string' },
    category_id: { type: 'string', enum: [...categoryIds, ''] },
  },
  required: ['is_receipt', 'amount', 'currency', 'date', 'time', 'merchant', 'description', 'category_id'],
  additionalProperties: false,
})

const buildPrompt = (categories) => `Ảnh này có thể là hóa đơn/biên lai mua hàng, hoặc ảnh chụp màn hình giao dịch từ app ngân hàng / ví điện tử (MoMo, ZaloPay, chuyển khoản, thanh toán QR...), thường ở Việt Nam. Trích xuất thông tin để ghi vào sổ thu chi.

Quy tắc:
- is_receipt: true nếu ảnh là hóa đơn, biên lai hoặc màn hình xác nhận/chi tiết giao dịch; false nếu không phải; khi false để các trường khác rỗng hoặc 0.
- amount: với hóa đơn, lấy số tiền KHÁCH THỰC TRẢ (dòng "Tổng cộng", "Tổng tiền", "Thanh toán", "Total"...), không lấy tạm tính hay tiền khách đưa/tiền thối. Với ảnh giao dịch ngân hàng/ví, lấy số tiền giao dịch (bỏ dấu +/-), không lấy số dư tài khoản. Trả về số thuần, ví dụ "125.000đ" -> 125000 (dấu chấm/phẩy là phân cách hàng nghìn với VND). 0 nếu không đọc được.
- currency: mã ISO 4217, mặc định "VND".
- date: định dạng YYYY-MM-DD, chuỗi rỗng nếu không có. Ngày trên hóa đơn VN thường là ngày/tháng/năm.
- time: định dạng HH:MM (24 giờ), chuỗi rỗng nếu không có.
- merchant: tên cửa hàng, hoặc tên người/đơn vị nhận/gửi tiền với ảnh chuyển khoản (ví dụ "Highlands Coffee", "Nguyen Van A").
- description: mô tả ngắn để ghi chú, ví dụ "Highlands - Phin sữa đá"; với chuyển khoản nên dựa vào nội dung chuyển khoản nếu có.
- category_id: id của danh mục phù hợp nhất trong danh sách dưới đây, chuỗi rỗng nếu không chắc.

Danh mục:
${categories.map(c => `- ${c.id}: ${c.name}`).join('\n')}`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Chỉ người dùng đã đăng nhập mới được gọi (mỗi lần gọi đều tốn phí API).
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  const { data: { user } = {}, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' })

  const { image, media_type, categories = [] } = req.body || {}
  if (typeof image !== 'string' || !image || image.length > MAX_IMAGE_BASE64_LENGTH) {
    return res.status(400).json({ error: 'Ảnh không hợp lệ hoặc quá lớn' })
  }
  if (!ALLOWED_MEDIA_TYPES.includes(media_type)) {
    return res.status(400).json({ error: 'Định dạng ảnh không được hỗ trợ' })
  }
  const cleanCategories = (Array.isArray(categories) ? categories : [])
    .filter(c => c && typeof c.id === 'string' && typeof c.name === 'string')
    .slice(0, 100)

  try {
    const response = await anthropic.messages.parse({
      model: 'claude-haiku-5-5',
      max_tokens: 8000,
      output_config: {
        effort: 'low',
        format: jsonSchemaOutputFormat(buildSchema(cleanCategories.map(c => c.id))),
      },
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type, data: image } },
          { type: 'text', text: buildPrompt(cleanCategories) },
        ],
      }],
    })

    if (response.stop_reason === 'refusal') {
      return res.status(422).json({ error: 'Không thể xử lý ảnh này' })
    }
    const result = response.parsed_output
    if (!result) {
      return res.status(502).json({ error: 'Không đọc được kết quả từ AI' })
    }
    if (!result.is_receipt) {
      return res.status(422).json({ error: 'Ảnh không giống hóa đơn hoặc giao dịch' })
    }

    return res.status(200).json({
      amount: result.amount > 0 ? result.amount : null,
      currency: result.currency || 'VND',
      date: /^\d{4}-\d{2}-\d{2}$/.test(result.date) ? result.date : null,
      time: /^\d{2}:\d{2}$/.test(result.time) ? result.time : null,
      merchant: result.merchant || null,
      description: result.description || result.merchant || null,
      category_id: result.category_id || null,
    })
  } catch (error) {
    console.error('scan-receipt error:', error)
    if (error instanceof Anthropic.RateLimitError) {
      return res.status(429).json({ error: 'Quá nhiều yêu cầu, thử lại sau ít phút' })
    }
    if (error instanceof Anthropic.APIError) {
      return res.status(502).json({ error: `Lỗi AI (${error.status})` })
    }
    return res.status(500).json({ error: 'Lỗi xử lý hóa đơn' })
  }
}
