/**
 * Validation utilities
 */

export const validators = {
  /**
   * Check if value is not empty
   */
  required: (message = 'Trường này là bắt buộc') => (value) => {
    if (value === null || value === undefined) return message
    if (typeof value === 'string' && !value.trim()) return message
    if (Array.isArray(value) && value.length === 0) return message
    return null
  },
  
  /**
   * Check email format
   */
  email: (message = 'Email không hợp lệ') => (value) => {
    if (!value) return null
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value) ? null : message
  },
  
  /**
   * Check minimum length
   */
  minLength: (min, message) => (value) => {
    if (!value) return null
    const msg = message || `Tối thiểu ${min} ký tự`
    return value.length >= min ? null : msg
  },
  
  /**
   * Check maximum length
   */
  maxLength: (max, message) => (value) => {
    if (!value) return null
    const msg = message || `Tối đa ${max} ký tự`
    return value.length <= max ? null : msg
  },
  
  /**
   * Check if value is a number
   */
  number: (message = 'Phải là số') => (value) => {
    if (value === '' || value === null || value === undefined) return null
    return !isNaN(value) ? null : message
  },
  
  /**
   * Check if value is positive
   */
  positive: (message = 'Phải là số dương') => (value) => {
    if (value === '' || value === null || value === undefined) return null
    return value > 0 ? null : message
  },
  
  /**
   * Check if value is not negative
   */
  notNegative: (message = 'Không được là số âm') => (value) => {
    if (value === '' || value === null || value === undefined) return null
    return value >= 0 ? null : message
  },
  
  /**
   * Check minimum value
   */
  min: (min, message) => (value) => {
    if (value === '' || value === null || value === undefined) return null
    const msg = message || `Giá trị tối thiểu là ${min}`
    return value >= min ? null : msg
  },
  
  /**
   * Check maximum value
   */
  max: (max, message) => (value) => {
    if (value === '' || value === null || value === undefined) return null
    const msg = message || `Giá trị tối đa là ${max}`
    return value <= max ? null : msg
  },
  
  /**
   * Check date format
   */
  date: (message = 'Ngày không hợp lệ') => (value) => {
    if (!value) return null
    return !isNaN(Date.parse(value)) ? null : message
  },
  
  /**
   * Check if date is in future
   */
  futureDate: (message = 'Ngày phải sau hôm nay') => (value) => {
    if (!value) return null
    const inputDate = new Date(value)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return inputDate > today ? null : message
  },
  
  /**
   * Check if date is in past
   */
  pastDate: (message = 'Ngày phải trước hôm nay') => (value) => {
    if (!value) return null
    const inputDate = new Date(value)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return inputDate < today ? null : message
  },
  
  /**
   * Check pattern (regex)
   */
  pattern: (regex, message = 'Định dạng không hợp lệ') => (value) => {
    if (!value) return null
    return regex.test(value) ? null : message
  },
  
  /**
   * Custom validator
   */
  custom: (validatorFn, message) => (value) => {
    return validatorFn(value) ? null : message
  }
}

/**
 * Validate form data against rules
 * @param {Object} data - Form data
 * @param {Object} rules - Validation rules
 * @returns {Object} { isValid, errors }
 */
export function validateForm(data, rules) {
  const errors = {}
  
  Object.entries(rules).forEach(([field, fieldRules]) => {
    // Convert single validator to array
    const validators = Array.isArray(fieldRules) ? fieldRules : [fieldRules]
    
    for (const validator of validators) {
      const error = validator(data[field])
      if (error) {
        errors[field] = error
        break // Stop at first error for this field
      }
    }
  })
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Validate a single field
 * @param {any} value - Field value
 * @param {Array|Function} rules - Validation rules
 * @returns {string|null} Error message or null
 */
export function validateField(value, rules) {
  const validators = Array.isArray(rules) ? rules : [rules]
  
  for (const validator of validators) {
    const error = validator(value)
    if (error) return error
  }
  
  return null
}