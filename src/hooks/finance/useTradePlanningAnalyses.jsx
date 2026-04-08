import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'trade_planning_analyses'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch { /* ignore */ }
}

export function useTradePlanningAnalyses() {
  const [analyses, setAnalyses] = useState(() => loadFromStorage())

  useEffect(() => {
    saveToStorage(analyses)
  }, [analyses])

  const addAnalysis = useCallback((entry) => {
    const newEntry = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      title: entry.title || '',
      content: entry.content || '',
      tags: entry.tags || [],
    }
    setAnalyses(prev => [newEntry, ...prev])
    return newEntry
  }, [])

  const updateAnalysis = useCallback((id, updates) => {
    setAnalyses(prev =>
      prev.map(a =>
        a.id === id
          ? { ...a, ...updates, updated_at: new Date().toISOString() }
          : a
      )
    )
  }, [])

  const deleteAnalysis = useCallback((id) => {
    setAnalyses(prev => prev.filter(a => a.id !== id))
  }, [])

  return { analyses, addAnalysis, updateAnalysis, deleteAnalysis }
}
