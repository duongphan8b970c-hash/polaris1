import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import UserAvatar from '../common/UserAvatar'

export default function AssignmentHistory({ resourceType, resourceId }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHistory()
  }, [resourceType, resourceId])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('assignment_history')
        .select('*')
        .eq('resource_type', resourceType)
        .eq('resource_id', resourceId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setHistory(data || [])
    } catch (err) {
      console.error('Error fetching history:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Loading history...</div>
  }

  if (history.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        No assignment history yet
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-sm text-gray-700">Assignment History</h4>
      <div className="space-y-2">
        {history.map((entry) => (
          <div key={entry.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <UserAvatar userId={entry.user_id} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">
                {entry.action === 'assigned' && '➕ Assigned'}
                {entry.action === 'unassigned' && '➖ Unassigned'}
                {entry.action === 'reassigned' && '🔄 Reassigned'}
              </p>
              <p className="text-xs text-gray-500">
                by <UserAvatar userId={entry.assigned_by} size="xs" showTooltip={false} /> 
                • {new Date(entry.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}