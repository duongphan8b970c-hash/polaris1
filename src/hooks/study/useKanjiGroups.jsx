import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

export function useKanjiGroups() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchGroups = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('kanji_card_groups')
        .select('*')
        .order('radical', { ascending: true })
        .order('position', { ascending: true })

      if (error) throw error
      setGroups(data || [])
    } catch (err) {
      console.error('Error fetching groups:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const createGroup = async (radical, name) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const maxPos = groups
        .filter(g => g.radical === radical)
        .reduce((max, g) => Math.max(max, g.position), -1)

      const { data, error } = await supabase
        .from('kanji_card_groups')
        .insert({
          radical,
          name,
          position: maxPos + 1,
          user_id: user.id
        })
        .select()
        .single()

      if (error) throw error
      await fetchGroups()
      return { success: true, data }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const updateGroup = async (id, updates) => {
    try {
      const { error } = await supabase
        .from('kanji_card_groups')
        .update(updates)
        .eq('id', id)

      if (error) throw error
      await fetchGroups()
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const deleteGroup = async (id) => {
    try {
      const { error } = await supabase
        .from('kanji_card_groups')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchGroups()
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  return {
    groups,
    loading,
    createGroup,
    updateGroup,
    deleteGroup,
    refetch: fetchGroups
  }
}
