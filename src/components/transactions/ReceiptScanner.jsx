import { useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'

const MAX_EDGE = 1568 // Claude tự thu nhỏ ảnh lớn hơn mức này, gửi to hơn chỉ tốn băng thông

// Thu nhỏ + nén ảnh về JPEG ngay trên trình duyệt, trả về base64 (không có tiền tố data:).
const compressImage = (file) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file)
  const img = new Image()
  img.onload = () => {
    URL.revokeObjectURL(url)
    const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.width * scale)
    canvas.height = Math.round(img.height * scale)
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
    resolve(canvas.toDataURL('image/jpeg', 0.85).split(',')[1])
  }
  img.onerror = () => {
    URL.revokeObjectURL(url)
    reject(new Error('Không đọc được file ảnh'))
  }
  img.src = url
})

// Nút chụp ảnh / chọn ảnh từ thư viện (hóa đơn, ảnh chụp màn hình chuyển khoản) -> gọi /api/scan-receipt -> trả kết quả qua onResult.
export default function ReceiptScanner({ categories, onResult, disabled }) {
  const cameraRef = useRef(null)
  const galleryRef = useRef(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState(null)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // cho phép chọn lại cùng một ảnh
    if (!file) return

    setScanning(true)
    setError(null)
    try {
      const image = await compressImage(file)
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({
          image,
          media_type: 'image/jpeg',
          categories: categories.map(c => ({ id: c.id, name: c.name })),
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || `Lỗi ${response.status}`)
      onResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setScanning(false)
    }
  }

  const buttonClass = 'flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors disabled:opacity-60'

  return (
    <div>
      {/* capture -> mở thẳng camera trên mobile; không capture -> chọn từ thư viện ảnh */}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
      <input ref={galleryRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />

      {scanning ? (
        <div className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 text-blue-700 text-sm font-medium">
          <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          Đang đọc ảnh...
        </div>
      ) : (
        <div className="flex gap-2">
          <button type="button" onClick={() => cameraRef.current?.click()} disabled={disabled} className={buttonClass}>
            📷 Chụp hóa đơn
          </button>
          <button type="button" onClick={() => galleryRef.current?.click()} disabled={disabled} className={buttonClass}>
            🖼️ Chọn ảnh
          </button>
        </div>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
