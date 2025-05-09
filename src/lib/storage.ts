"use client"

interface Todo {
  id: string
  text: string
  completed: boolean
}

const STORAGE_KEY = 'todos'

export const TodoStorage = {
  getTodos: (): Todo[] => {
    if (typeof window === 'undefined') return []
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (e) {
      console.error('Error loading todos from storage:', e)
      return []
    }
  },
  
  saveTodos: (todos: Todo[]): void => {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
    } catch (e) {
      console.error('Error saving todos to storage:', e)
    }
  }
} 