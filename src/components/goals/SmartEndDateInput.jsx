import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function SmartEndDateInput({ 
  goal, 
  value, 
  onChange, 
  disabled = false 
}) {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (goal?.id) {
      fetchSuggestions()
    }
  }, [goal?.id])

  const fetchSuggestions = async () => {
    try {
      setLoading(true)

      // ✅ Call database function
      const { data, error } = await supabase
        .rpc('get_goal_suggestions', { p_goal_id: goal.id })

      if (error) throw error

      // Transform to component format
      const formattedSuggestions = (data || []).map(s => ({
        type: s.severity,
        date: s.suggested_date,
        message: s.message,
        action: s.suggested_date ? () => onChange(s.suggested_date) : null
      }))

      setSuggestions(formattedSuggestions)
    } catch (err) {
      console.error('Error fetching suggestions:', err)
      // Fallback to client-side calculation
      calculateClientSideSuggestions()
    } finally {
      setLoading(false)
    }
  }

  const calculateClientSideSuggestions = () => {
    // Fallback client-side logic (same as before)
    const suggestions = []
    const today = new Date().toISOString().split('T')[0]
    const progress = goal.progress || 0
    const status = goal.status

    if (progress === 100 && status !== 'completed') {
      suggestions.push({
        type: 'success',
        date: today,
        message: '✅ Goal đã hoàn thành 100%! Đánh dấu hoàn thành hôm nay?',
        action: () => onChange(today)
      })
    }

    if (goal.target_date) {
      const targetDate = new Date(goal.target_date)
      const todayDate = new Date(today)
      const daysOverdue = Math.floor((todayDate - targetDate) / (1000 * 60 * 60 * 24))

      if (daysOverdue > 0 && status !== 'completed') {
        suggestions.push({
          type: 'warning',
          date: null,
          message: `⚠️ Goal đã quá hạn ${daysOverdue} ngày`,
          action: null
        })
      }
    }

    setSuggestions(suggestions)
  }

  const validateDate = (dateStr) => {
    if (!dateStr) return null

    const inputDate = new Date(dateStr)
    const startDate = goal.start_date ? new Date(goal.start_date) : null
    const today = new Date()

    if (startDate && inputDate < startDate) {
      return {
        type: 'error',
        message: '❌ Ngày hoàn thành không thể trước ngày bắt đầu'
      }
    }

    if (goal.status === 'completed' && inputDate > today) {
      return {
        type: 'warning',
        message: '⚠️ Ngày hoàn thành trong tương lai?'
      }
    }

    return null
  }

  const validation = validateDate(value)

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Ngày hoàn thành thực tế
        {goal.status === 'completed' && (
          <span className="text-red-500 ml-1">*</span>
        )}
      </label>

      {/* Loading state */}
      {loading && (
        <div className="p-3 bg-gray-50 rounded-lg border-2 border-gray-200 text-sm text-gray-600">
          🔄 Đang tính toán gợi ý...
        </div>
      )}

      {/* Suggestions */}
      {!loading && suggestions.length > 0 && (
        <div className="space-y-2 mb-2">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border-2 text-sm ${
                suggestion.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                suggestion.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="flex-1">{suggestion.message}</p>
                {suggestion.date && suggestion.action && (
                  <button
                    type="button"
                    onClick={suggestion.action}
                    className="px-3 py-1 bg-white rounded border-2 border-current hover:bg-opacity-80 transition-colors font-medium text-xs whitespace-nowrap"
                  >
                    Sử dụng
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Date Input */}
      <input
        type="date"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`input ${validation?.type === 'error' ? 'border-red-500' : ''}`}
        required={goal.status === 'completed'}
      />

      {/* Validation Messages */}
      {validation && (
        <p className={`text-sm ${
          validation.type === 'error' ? 'text-red-600' : 'text-yellow-600'
        }`}>
          {validation.message}
        </p>
      )}

      {/* Helper Text */}
      <p className="text-xs text-gray-500">
        💡 Tip: Để trống nếu goal chưa hoàn thành
      </p>
    </div>
  )
}