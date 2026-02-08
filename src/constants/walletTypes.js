// Wallet type definitions - synced with database schema
export const WALLET_TYPES = [
  { 
    value: 'all', 
    label: 'Tất cả', 
    icon: '💼', 
    color: 'bg-gray-100 text-gray-700',
    hoverColor: 'hover:bg-gray-200',
    activeRing: 'ring-gray-500',
    description: 'Hiển thị tất cả ví'
  },
  { 
    value: 'bank', 
    label: 'Ngân hàng', 
    icon: '🏦', 
    color: 'bg-blue-100 text-blue-700',
    hoverColor: 'hover:bg-blue-200',
    activeRing: 'ring-blue-500',
    description: 'Tài khoản ngân hàng'
  },
  { 
    value: 'cash', 
    label: 'Tiền mặt', 
    icon: '💵', 
    color: 'bg-green-100 text-green-700',
    hoverColor: 'hover:bg-green-200',
    activeRing: 'ring-green-500',
    description: 'Tiền mặt, ví da'
  },
  { 
    value: 'ewallet', 
    label: 'Ví điện tử', 
    icon: '📱', 
    color: 'bg-purple-100 text-purple-700',
    hoverColor: 'hover:bg-purple-200',
    activeRing: 'ring-purple-500',
    description: 'Momo, ZaloPay, VNPay...'
  },
  { 
    value: 'credit_card', 
    label: 'Thẻ tín dụng', 
    icon: '💳', 
    color: 'bg-pink-100 text-pink-700',
    hoverColor: 'hover:bg-pink-200',
    activeRing: 'ring-pink-500',
    description: 'Visa, Mastercard...'
  },
  { 
    value: 'investment', 
    label: 'Đầu tư', 
    icon: '📈', 
    color: 'bg-indigo-100 text-indigo-700',
    hoverColor: 'hover:bg-indigo-200',
    activeRing: 'ring-indigo-500',
    description: 'Chứng khoán, quỹ...'
  },
  { 
    value: 'other', 
    label: 'Khác', 
    icon: '💰', 
    color: 'bg-amber-100 text-amber-700',
    hoverColor: 'hover:bg-amber-200',
    activeRing: 'ring-amber-500',
    description: 'Các loại ví khác'
  },
]

// Wallet types for form select (exclude 'all')
export const WALLET_TYPE_OPTIONS = WALLET_TYPES.filter(t => t.value !== 'all')

// Helper: Get wallet type info
export const getWalletTypeInfo = (typeValue) => {
  return WALLET_TYPES.find(t => t.value === typeValue) || WALLET_TYPES.find(t => t.value === 'other')
}

// Helper: Get wallet type label with icon
export const getWalletTypeLabel = (typeValue) => {
  const info = getWalletTypeInfo(typeValue)
  return `${info.icon} ${info.label}`
}

// Helper: Get wallet type color class
export const getWalletTypeColor = (typeValue) => {
  const info = getWalletTypeInfo(typeValue)
  return info.color
}