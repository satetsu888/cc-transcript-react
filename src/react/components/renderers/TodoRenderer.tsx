import { CheckCircle2, CircleDot, Circle } from 'lucide-react'
import { cn } from '../../cn'

interface TodoItem {
  content: string
  status: 'pending' | 'in_progress' | 'completed'
  activeForm?: string
  priority?: 'high' | 'medium' | 'low'
}

export function extractTodos(toolName: string, input: unknown, resultContent: unknown): TodoItem[] | null {
  if (toolName === 'TodoWrite') {
    const inputObj = input as { todos?: TodoItem[] } | undefined
    if (inputObj?.todos && Array.isArray(inputObj.todos)) {
      return inputObj.todos
    }
  }
  if (toolName === 'TodoRead') {
    if (resultContent) {
      let parsed = resultContent
      if (typeof resultContent === 'string') {
        try { parsed = JSON.parse(resultContent) } catch { return null }
      }
      const resultObj = parsed as { todos?: TodoItem[] } | TodoItem[]
      if (Array.isArray(resultObj)) return resultObj as TodoItem[]
      if (resultObj && 'todos' in resultObj && Array.isArray(resultObj.todos)) return resultObj.todos
    }
  }
  return null
}

export function TodoListBlock({ todos }: { todos: TodoItem[] }) {
  if (todos.length === 0) {
    return <div className="cct-text-sm cct-text-[var(--cct-text-tertiary)] cct-italic">No tasks</div>
  }
  return (
    <div className="cct-space-y-1.5">
      {todos.map((todo, i) => (
        <div key={i} className="cct-flex cct-items-start cct-gap-2">
          {todo.status === 'completed' && (
            <CheckCircle2 className="cct-h-4 cct-w-4 cct-text-[var(--cct-todo-completed)] cct-flex-shrink-0 cct-mt-0.5" />
          )}
          {todo.status === 'in_progress' && (
            <CircleDot className="cct-h-4 cct-w-4 cct-text-[var(--cct-todo-in-progress)] cct-flex-shrink-0 cct-mt-0.5" />
          )}
          {todo.status === 'pending' && (
            <Circle className="cct-h-4 cct-w-4 cct-text-[var(--cct-todo-pending)] cct-flex-shrink-0 cct-mt-0.5" />
          )}
          <span
            className={cn(
              'cct-text-sm',
              todo.status === 'completed' && 'cct-text-[var(--cct-text-tertiary)] cct-line-through',
              todo.status === 'in_progress' && 'cct-text-[var(--cct-selected-text)] cct-font-medium',
              todo.status === 'pending' && 'cct-text-[var(--cct-text-body)]'
            )}
          >
            {todo.content}
          </span>
        </div>
      ))}
    </div>
  )
}
