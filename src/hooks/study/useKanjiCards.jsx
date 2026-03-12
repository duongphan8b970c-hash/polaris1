import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { fetchKanjiFromJisho } from '../../utils/jishoAPI'

export function useKanjiCards() {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCards = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('kanji_cards')
        .select('*')
        .order('position', { ascending: true })

      if (fetchError) throw fetchError

      setCards(data || [])
    } catch (err) {
      console.error('Error fetching kanji cards:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addKanjiCard = async (kanji, groupId = null, radical = null) => {
    try {
      // Check auth first
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        return {
          success: false,
          error: 'Please login to add Kanji cards'
        }
      }

      // Fetch data from Jisho API
      const kanjiData = await fetchKanjiFromJisho(kanji)

      // Get next position
      const maxPosition = cards.length > 0
        ? Math.max(...cards.map(c => c.position))
        : -1

      const { data, error } = await supabase
        .from('kanji_cards')
        .insert({
          ...kanjiData,
          radical: radical || kanjiData.radical || null,
          position: maxPosition + 1,
          user_id: user.id,
          group_id: groupId
        })
        .select()
        .single()

      if (error) throw error

      await fetchCards()
      return { success: true, data }
    } catch (err) {
      console.error('Error adding kanji card:', err)
      return { success: false, error: err.message }
    }
  }

  const moveCardToGroup = async (cardId, newGroupId) => {
    try {
      const { error } = await supabase
        .from('kanji_cards')
        .update({ group_id: newGroupId })
        .eq('id', cardId)

      if (error) throw error

      await fetchCards()
      return { success: true }
    } catch (err) {
      console.error('Error moving kanji card to group:', err)
      return { success: false, error: err.message }
    }
  }

  const updateKanjiCard = async (id, updates) => {
    try {
      const { error } = await supabase
        .from('kanji_cards')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      await fetchCards()
      return { success: true }
    } catch (err) {
      console.error('Error updating kanji card:', err)
      return { success: false, error: err.message }
    }
  }

  const deleteKanjiCard = async (id) => {
    try {
      const { error } = await supabase
        .from('kanji_cards')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchCards()
      return { success: true }
    } catch (err) {
      console.error('Error deleting kanji card:', err)
      return { success: false, error: err.message }
    }
  }

  useEffect(() => {
    fetchCards()
  }, [])

  return {
    cards,
    loading,
    error,
    addKanjiCard,
    updateKanjiCard,
    deleteKanjiCard,
    moveCardToGroup,
    refetch: fetchCards
  }
}
