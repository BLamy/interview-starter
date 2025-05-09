"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { TodoStorage } from "@/lib/storage"

interface Todo {
  id: string
  text: string
  completed: boolean
}

export function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodo, setNewTodo] = useState("")
  const [isLoaded, setIsLoaded] = useState(false)

  // Load todos from storage on mount
  useEffect(() => {
    const loadedTodos = TodoStorage.getTodos()
    setTodos(loadedTodos)
    setIsLoaded(true)
  }, [])

  // Save todos to storage when they change
  useEffect(() => {
    if (isLoaded) {
      TodoStorage.saveTodos(todos)
    }
  }, [todos, isLoaded])

  const addTodo = () => {
    if (newTodo.trim() === "") return
    
    const todo: Todo = {
      id: Date.now().toString(),
      text: newTodo,
      completed: false
    }
    
    setTodos([...todos, todo])
    setNewTodo("")
  }

  const toggleTodo = (id: string) => {
    setTodos(
      todos.map(todo => 
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    )
  }

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id))
  }

  const clearCompleted = () => {
    setTodos(todos.filter(todo => !todo.completed))
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Todo List</CardTitle>
        <CardDescription>Manage your tasks efficiently</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Input
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Add a new task"
              onKeyDown={(e) => e.key === "Enter" && addTodo()}
            />
            <Button onClick={addTodo}>Add</Button>
          </div>
          
          <div className="space-y-2">
            {todos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No tasks yet. Add one above!
              </p>
            ) : (
              todos.map(todo => (
                <div 
                  key={todo.id} 
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id={`todo-${todo.id}`}
                      checked={todo.completed}
                      onCheckedChange={() => toggleTodo(todo.id)}
                    />
                    <Label 
                      htmlFor={`todo-${todo.id}`}
                      className={cn(
                        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                        todo.completed && "line-through text-muted-foreground"
                      )}
                    >
                      {todo.text}
                    </Label>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => deleteTodo(todo.id)}
                  >
                    Delete
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          {todos.filter(t => t.completed).length} of {todos.length} tasks completed
        </p>
        {todos.some(t => t.completed) && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearCompleted}
          >
            Clear completed
          </Button>
        )}
      </CardFooter>
    </Card>
  )
} 