// Task status filters
export const TASK_STATUS_FILTERS = [
  { value: 'all', label: 'Tất cả', icon: '📋', color: 'gray' },
  { value: 'todo', label: 'Cần làm', icon: '📝', color: 'gray' },
  { value: 'in_progress', label: 'Đang làm', icon: '⏳', color: 'blue' },
  { value: 'completed', label: 'Hoàn thành', icon: '✅', color: 'green' },
]

// Priority options
export const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Thấp', icon: '🔵', color: 'blue' },
  { value: 'medium', label: 'Trung bình', icon: '🟡', color: 'yellow' },
  { value: 'high', label: 'Cao', icon: '🟠', color: 'orange' },
]

// Transaction types
export const TRANSACTION_TYPES = [
  { value: 'income', label: 'Thu nhập', icon: '💰', color: 'green' },
  { value: 'expense', label: 'Chi tiêu', icon: '💸', color: 'red' },
  { value: 'transfer', label: 'Chuyển khoản', icon: '🔄', color: 'blue' }
]

// Goal status
export const GOAL_STATUS = [
  { value: 'active', label: 'Đang thực hiện', color: 'blue' },
  { value: 'completed', label: 'Hoàn thành', color: 'green' },
  { value: 'paused', label: 'Tạm dừng', color: 'yellow' },
  { value: 'cancelled', label: 'Đã hủy', color: 'red' },
]