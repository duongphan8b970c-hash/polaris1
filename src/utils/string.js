/**
 * Capitalize first letter
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export const capitalize = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Truncate string with ellipsis
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated string
 */
export const truncate = (str, maxLength = 50) => {
  if (!str) return ''
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '...'
}

/**
 * Slugify string (convert to URL-friendly format)
 * @param {string} str - String to slugify
 * @returns {string} Slugified string
 */
export const slugify = (str) => {
  if (!str) return ''
  
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Remove all spaces
 * @param {string} str - String to clean
 * @returns {string} Cleaned string
 */
export const removeSpaces = (str) => {
  if (!str) return ''
  return str.replace(/\s+/g, '')
}

/**
 * Extract initials from name
 * @param {string} name - Full name
 * @param {number} maxLength - Max initials (default: 2)
 * @returns {string} Initials
 */
export const getInitials = (name, maxLength = 2) => {
  if (!name) return ''
  
  const words = name.trim().split(/\s+/)
  const initials = words.map(word => word.charAt(0).toUpperCase())
  
  return initials.slice(0, maxLength).join('')
}

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Check if string is empty or whitespace
 * @param {string} str - String to check
 * @returns {boolean}
 */
export const isEmpty = (str) => {
  return !str || str.trim().length === 0
}

/**
 * Remove HTML tags
 * @param {string} html - HTML string
 * @returns {string} Plain text
 */
export const stripHtml = (html) => {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '')
}