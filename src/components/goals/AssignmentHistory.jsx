import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import UserAvatar from '../common/UserAvatar'

export default function AssignmentHistory({ resourceType, resourceId }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (resourceId) {
      fetchHistory()
    }
  }, [resourceType, resourceId])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('assignment_history')
        .select('*')
        .eq('resource_type', resourceType)
        .eq('resource_id', resourceId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setHistory(data || [])
    } catch (err) {
      console.error('Error fetching assignment history:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffInMinutes = Math.floor((now - date) / 1000 / 60)

    if (diffInMinutes < 1) return 'Vừa xong'
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)} ngày trước`
    return date.toLocaleDateString('vi-VN')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-800">❌ Lỗi: {error}</p>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">📋</div>
        <p className="text-sm text-gray-500">Chưa có lịch sử phân công</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
        <span className="text-lg">📜</span>
        Assignment History
        <span className="ml-auto text-xs font-normal text-gray-500">
          {history.length} {history.length === 1 ? 'entry' : 'entries'}
        </span>
      </h4>

      <div className="space-y-2">
        {history.map((entry, index) => (
          <div 
            key={entry.id} 
            className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
              entry.action === 'assigned' ? 'bg-green-50 border-green-200' :
              entry.action === 'unassigned' ? 'bg-red-50 border-red-200' :
              'bg-blue-50 border-blue-200'
            }`}
          >
            {/* User Avatar */}
            <div className="flex-shrink-0 mt-1">
              <UserAvatar userId={entry.user_id} size="sm" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-900">
                  {entry.action === 'assigned' && '➕ Assigned'}
                  {entry.action === 'unassigned' && '➖ Unassigned'}
                  {entry.action === 'reassigned' && '🔄 Reassigned'}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDate(entry.created_at)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span>by</span>
                <UserAvatar userId={entry.assigned_by} size="xs" showTooltip={true} />
              </div>

              {/* Show changes if reassigned */}
              {entry.previous_assignees && entry.previous_assignees.length > 0 && (
                <div className="mt-2 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">From:</span>
                    <div className="flex -space-x-1">
                      {entry.previous_assignees.slice(0, 3).map((userId) => (
                        <UserAvatar key={userId} userId={userId} size="xs" />
                      ))}
                      {entry.previous_assignees.length > 3 && (
                        <span className="ml-1">+{entry.previous_assignees.length - 3}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-gray-500">To:</span>
                    <div className="flex -space-x-1">
                      {entry.new_assignees.slice(0, 3).map((userId) => (
                        <UserAvatar key={userId} userId={userId} size="xs" />
                      ))}
                      {entry.new_assignees.length > 3 && (
                        <span className="ml-1">+{entry.new_assignees.length - 3}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}