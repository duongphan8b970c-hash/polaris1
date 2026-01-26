export function formatCurrency(amount, currency = 'VND') {
  const numAmount = Number(amount) || 0
  
  switch (currency) {
    case 'VND':
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0
      }).format(numAmount)
    
    case 'USD':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(numAmount)
    
    case 'USDT':
      return `${numAmount.toLocaleString('en-US', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2 
      })} USDT`
    
    default:
      return `${numAmount.toLocaleString()} ${currency}`
  }
}

export function formatDate(date, format = 'dd/MM/yyyy') {
  if (!date) return ''
  const d = new Date(date)
  
  if (format === 'dd/MM/yyyy') {
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }
  
  if (format === 'yyyy-MM-dd') {
    return d.toISOString().split('T')[0]
  }
  
  return d.toLocaleDateString('vi-VN')
}

export function getErrorMessage(error) {
  if (error?.message) return error.message
  return 'Đã xảy ra lỗi. Vui lòng thử lại.'
}

export function getTransactionColor(type) {
  return type === 'income' ? 'text-green-600' : 'text-red-600'
}
