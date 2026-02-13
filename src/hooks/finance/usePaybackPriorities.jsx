// Payback priority definitions (3 levels only)
export const PAYBACK_PRIORITIES = [
  { 
    value: 'all', 
    label: 'Tất cả', 
    icon: '💼', 
    color: 'bg-gray-100 text-gray-700',
    hoverColor: 'hover:bg-gray-200',
    activeRing: 'ring-gray-500',
    badgeColor: 'bg-gray-100 text-gray-700'
  },
  { 
    value: 1, 
    label: 'Cao', 
    icon: '🔴', 
    color: 'bg-red-100 text-red-700',
    hoverColor: 'hover:bg-red-200',
    activeRing: 'ring-red-500',
    badgeColor: 'bg-red-500 text-white',
    sortOrder: 1
  },
  { 
    value: 2, 
    label: 'Trung bình', 
    icon: '🟡', 
    color: 'bg-yellow-100 text-yellow-700',
    hoverColor: 'hover:bg-yellow-200',
    activeRing: 'ring-yellow-500',
    badgeColor: 'bg-yellow-500 text-white',
    sortOrder: 2
  },
  { 
    value: 3, 
    label: 'Thấp', 
    icon: '🟢', 
    color: 'bg-green-100 text-green-700',
    hoverColor: 'hover:bg-green-200',
    activeRing: 'ring-green-500',
    badgeColor: 'bg-green-500 text-white',
    sortOrder: 3
  },
]

// Priority options for form select (exclude 'all')
export const PAYBACK_PRIORITY_OPTIONS = PAYBACK_PRIORITIES.filter(p => p.value !== 'all')

// Helper: Get priority info by sort_order
export const getPriorityInfo = (sortOrder) => {
  return PAYBACK_PRIORITIES.find(p => p.value === sortOrder) || PAYBACK_PRIORITIES.find(p => p.value === 2)
}

// Helper: Get priority label with icon
export const getPriorityLabel = (sortOrder) => {
  const info = getPriorityInfo(sortOrder)
  return `${info.icon} ${info.label}`
}

// Helper: Get priority badge color
export const getPriorityBadgeColor = (sortOrder) => {
  const info = getPriorityInfo(sortOrder)
  return info.badgeColor
}

// Helper: Sort goals by priority
export const sortByPriority = (goals) => {
  return [...goals].sort((a, b) => {
    const priorityA = a.priority_sort_order || 2
    const priorityB = b.priority_sort_order || 2
    return priorityA - priorityB  // 1 (Cao) comes first
  })
}