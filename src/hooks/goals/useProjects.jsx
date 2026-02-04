import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export function useProjects(categoryId = null) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      let query = supabase
        .from('projects')
        .select(`
          *,
          category:goal_categories(
            id,
            name,
            icon,
            goal_id,
            goal:goals(
              id,
              name,
              icon
            )
          )
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (categoryId) {
        query = query.eq('category_id', categoryId)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setProjects(data || [])
    } catch (err) {
      console.error('Error fetching projects:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createProject = async (projectData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error: createError } = await supabase
        .from('projects')
        .insert([{
          user_id: user.id,
          category_id: projectData.category_id,
          name: projectData.name,
          description: projectData.description,
          start_date: projectData.start_date,
          due_date: projectData.due_date,
          priority: projectData.priority || 'medium',
          status: 'planning'
        }])
        .select()
        .single()

      if (createError) throw createError

      await fetchProjects()
      return { success: true, data }
    } catch (err) {
      console.error('Error creating project:', err)
      return { success: false, error: err.message }
    }
  }

  const updateProject = async (id, projectData) => {
    try {
      const { data, error: updateError } = await supabase
        .from('projects')
        .update({
          name: projectData.name,
          description: projectData.description,
          due_date: projectData.due_date,
          priority: projectData.priority,
          status: projectData.status
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      await fetchProjects()
      return { success: true, data }
    } catch (err) {
      console.error('Error updating project:', err)
      return { success: false, error: err.message }
    }
  }

  const deleteProject = async (id) => {
    try {
      const { error: deleteError } = await supabase
        .from('projects')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (deleteError) throw deleteError

      await fetchProjects()
      return { success: true }
    } catch (err) {
      console.error('Error deleting project:', err)
      return { success: false, error: err.message }
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [categoryId])

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    refetch: fetchProjects
  }
}