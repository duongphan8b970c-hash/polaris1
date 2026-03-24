import { useCallback } from 'react'
import { supabase } from '../../lib/supabase'

/**
 * Hook to save and retrieve kanji writing practice sessions
 */
export default function useKanjiPractice() {
  const savePracticeSession = useCallback(async ({ kanji, mode, score, accuracy, stars, timeSpent }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { success: false, error: 'Not authenticated' }

      const { error } = await supabase.from('kanji_practice_sessions').insert({
        user_id: user.id,
        kanji,
        mode,
        score,
        accuracy,
        stars,
        time_spent: timeSpent,
      })

      if (error) throw error
      return { success: true }
    } catch (err) {
      // Non-critical - don't surface to user if table doesn't exist yet
      console.warn('Could not save practice session:', err.message)
      return { success: false, error: err.message }
    }
  }, [])

  const getPracticeHistory = useCallback(async (kanji) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('kanji_practice_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('kanji', kanji)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      return data || []
    } catch {
      return []
    }
  }, [])

  const getBestScore = useCallback(async (kanji) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('kanji_practice_sessions')
        .select('score, accuracy, stars')
        .eq('user_id', user.id)
        .eq('kanji', kanji)
        .order('score', { ascending: false })
        .limit(1)
        .single()

      if (error) throw error
      return data
    } catch {
      return null
    }
  }, [])

  return { savePracticeSession, getPracticeHistory, getBestScore }
}
