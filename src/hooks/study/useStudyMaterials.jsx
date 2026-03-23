import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

export function useStudyMaterials() {
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchMaterials = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        setError('Please login to view study materials')
        return
      }

      const { data, error: fetchError } = await supabase
        .from('study_materials')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setMaterials(data || [])
    } catch (err) {
      console.error('Error fetching study materials:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const createMaterial = async (materialData) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return { success: false, error: 'Please login to create study materials' }
      }

      const { data, error } = await supabase
        .from('study_materials')
        .insert({
          ...materialData,
          user_id: user.id,
        })
        .select()
        .single()

      if (error) throw error

      await fetchMaterials()
      return { success: true, data }
    } catch (err) {
      console.error('Error creating study material:', err)
      return { success: false, error: err.message }
    }
  }

  const updateMaterial = async (id, updates) => {
    try {
      const { error } = await supabase
        .from('study_materials')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error

      await fetchMaterials()
      return { success: true }
    } catch (err) {
      console.error('Error updating study material:', err)
      return { success: false, error: err.message }
    }
  }

  const deleteMaterial = async (id) => {
    try {
      // Get material to delete associated images
      const material = materials.find(m => m.id === id)
      if (material?.images?.length) {
        const bucketPrefix = '/object/public/study-materials/'
        const paths = material.images.map(url => {
          try {
            const idx = url.indexOf(bucketPrefix)
            if (idx !== -1) return decodeURIComponent(url.slice(idx + bucketPrefix.length))
          } catch {
            // ignore parse errors for individual URLs
          }
          return null
        }).filter(Boolean)

        if (paths.length) {
          await supabase.storage.from('study-materials').remove(paths)
        }
      }

      const { error } = await supabase
        .from('study_materials')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchMaterials()
      return { success: true }
    } catch (err) {
      console.error('Error deleting study material:', err)
      return { success: false, error: err.message }
    }
  }

  const uploadImage = async (file) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return { success: false, error: 'Please login to upload images' }
      }

      const ext = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('study-materials')
        .upload(fileName, file, { upsert: false })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('study-materials')
        .getPublicUrl(fileName)

      return { success: true, url: publicUrl }
    } catch (err) {
      console.error('Error uploading image:', err)
      return { success: false, error: err.message }
    }
  }

  useEffect(() => {
    fetchMaterials()
  }, [fetchMaterials])

  return {
    materials,
    loading,
    error,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    uploadImage,
    refetch: fetchMaterials,
  }
}
