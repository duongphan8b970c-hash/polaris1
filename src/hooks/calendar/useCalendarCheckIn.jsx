import { useCallback, useState } from 'react'
import { supabase } from '../../lib/supabase'

/**
 * Toggle the completion state of a calendar item (task or subtask).
 *
 * Returns an `updating` map keyed by `<type>-<id>` so callers can show a spinner
 * on the row that is being written.
 */
export function useCalendarCheckIn(onRefresh) {
  const [updating, setUpdating] = useState({})

  const checkIn = useCallback(
    async (item) => {
      const itemKey = `${item.type}-${item.original_id}`

      try {
        setUpdating((prev) => ({ ...prev, [itemKey]: true }))

        if (item.type === 'task') {
          const newStatus = item.status === 'completed' ? 'in_progress' : 'completed'
          const { error } = await supabase
            .from('tasks')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', item.original_id)
          if (error) throw error
        } else {
          const newCompleted = !item.is_completed
          const { error } = await supabase
            .from('subtasks')
            .update({
              is_completed: newCompleted,
              completed_date: newCompleted ? new Date().toISOString() : null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', item.original_id)
          if (error) throw error
        }

        if (typeof onRefresh === 'function') await onRefresh()
      } catch (err) {
        console.error('Error checking in:', err)
        alert('Lỗi: ' + err.message)
      } finally {
        setUpdating((prev) => {
          const next = { ...prev }
          delete next[itemKey]
          return next
        })
      }
    },
    [onRefresh]
  )

  return { checkIn, updating }
}
