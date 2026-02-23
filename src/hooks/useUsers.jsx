import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch all users from auth.users (via a view or RPC)
      // Note: Direct access to auth.users is restricted, 
      // so we'll get users who have created goals/tasks
      const { data: goalUsers, error: goalError } = await supabase
        .from('goals')
        .select('user_id, created_by')
        .not('user_id', 'is', null)

      if (goalError) throw goalError

      const { data: taskUsers, error: taskError } = await supabase
        .from('tasks')
        .select('user_id, created_by')
        .not('user_id', 'is', null)

      if (taskError) throw taskError

      // Combine and deduplicate user IDs
      const allUserIds = new Set()
      goalUsers?.forEach(g => {
        if (g.user_id) allUserIds.add(g.user_id)
        if (g.created_by) allUserIds.add(g.created_by)
      })
      taskUsers?.forEach(t => {
        if (t.user_id) allUserIds.add(t.user_id)
        if (t.created_by) allUserIds.add(t.created_by)
      })

      // For now, create user objects with IDs
      // In production, you'd fetch email/name from a users table
      const usersList = Array.from(allUserIds).map(id => ({
        id,
        email: null, // Will be populated if you have a profiles table
        name: null,
      }))

      setUsers(usersList)
    } catch (err) {
      console.error('Error fetching users:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return { users, loading, error, refetch: fetchUsers }
}