import { useState, useEffect, useCallback } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

type Theme = 'dark' | 'light'
type Filter = 'all' | 'active' | 'completed'

interface Todo {
  id: string
  text: string
  completed: boolean
  createdAt: string
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

const STORAGE_TODOS = 'darktodo_todos'
const STORAGE_THEME = 'darktodo_theme'

function loadTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_TODOS)
    if (!raw) return []
    return JSON.parse(raw) as Todo[]
  } catch (err) {
    console.error('Failed to load todos from localStorage:', err)
    return []
  }
}

function saveTodos(todos: Todo[]): void {
  try {
    localStorage.setItem(STORAGE_TODOS, JSON.stringify(todos))
  } catch (err) {
    console.error('Failed to save todos to localStorage:', err)
  }
}

function loadTheme(): Theme {
  try {
    const raw = localStorage.getItem(STORAGE_THEME)
    if (raw === 'light' || raw === 'dark') return raw
    return 'dark'
  } catch (err) {
    console.error('Failed to load theme from localStorage:', err)
    return 'dark'
  }
}

function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_THEME, theme)
  } catch (err) {
    console.error('Failed to save theme to localStorage:', err)
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [todos, setTodos] = useState<Todo[]>(loadTodos)
  const [theme, setTheme] = useState<Theme>(loadTheme)
  const [filter, setFilter] = useState<Filter>('all')
  const [inputValue, setInputValue] = useState('')

  // Persist todos whenever they change
  useEffect(() => {
    saveTodos(todos)
  }, [todos])

  // Persist theme + apply to <html>
  useEffect(() => {
    saveTheme(theme)
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
      root.setAttribute('data-theme', 'dark')
    } else {
      root.classList.remove('dark')
      root.setAttribute('data-theme', 'light')
    }
  }, [theme])

  const addTodo = useCallback(() => {
    const text = inputValue.trim()
    if (!text) return
    const newTodo: Todo = {
      id: generateId(),
      text,
      completed: false,
      createdAt: new Date().toISOString(),
    }
    setTodos(prev => [newTodo, ...prev])
    setInputValue('')
  }, [inputValue])

  const toggleTodo = useCallback((id: string) => {
    setTodos(prev =>
      prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t))
    )
  }, [])

  const deleteTodo = useCallback((id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id))
  }, [])

  const clearCompleted = useCallback(() => {
    setTodos(prev => prev.filter(t => !t.completed))
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  const filteredTodos = todos.filter(t => {
    if (filter === 'active') return !t.completed
    if (filter === 'completed') return t.completed
    return true
  })

  const activeCount = todos.filter(t => !t.completed).length
  const completedCount = todos.filter(t => t.completed).length

  // ── Theme-derived class maps ───────────────────────────────────────────────
  const isDark = theme === 'dark'

  const bg = isDark ? 'bg-[#1a1a2e]' : 'bg-[#f9fafb]'
  const cardBg = isDark ? 'bg-[#16213e]' : 'bg-white'
  const headerText = isDark ? 'text-white' : 'text-gray-900'
  const subText = isDark ? 'text-gray-400' : 'text-gray-500'
  const inputBg = isDark ? 'bg-[#0f3460] text-white placeholder-gray-500 border-[#7c3aed]/40 focus:border-[#7c3aed]'
    : 'bg-white text-gray-900 placeholder-gray-400 border-gray-300 focus:border-[#7c3aed]'
  const todoBorder = isDark ? 'border-[#7c3aed]/20' : 'border-gray-100'
  const todoHover = isDark ? 'hover:bg-[#0f3460]/60' : 'hover:bg-gray-50'
  const todoText = isDark ? 'text-gray-100' : 'text-gray-800'
  const completedText = isDark ? 'text-gray-500 line-through' : 'text-gray-400 line-through'
  const filterPill = isDark
    ? 'text-gray-400 hover:text-white hover:bg-[#7c3aed]/20'
    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
  const filterActive = 'bg-[#7c3aed] text-white'
  const footerText = isDark ? 'text-gray-500' : 'text-gray-400'
  const clearBtn = isDark
    ? 'text-gray-500 hover:text-red-400'
    : 'text-gray-400 hover:text-red-500'
  const themeBtn = isDark
    ? 'bg-[#7c3aed]/20 text-yellow-300 hover:bg-[#7c3aed]/40'
    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
  const deleteBtn = isDark ? 'text-gray-600 hover:text-red-400' : 'text-gray-300 hover:text-red-500'
  const emptyText = isDark ? 'text-gray-600' : 'text-gray-400'
  const checkboxAccent = '[accent-color:#7c3aed]'
  const addBtnClass = 'bg-[#7c3aed] hover:bg-[#6d28d9] text-white'

  return (
    <div
      className={`min-h-screen ${bg} transition-colors duration-300 flex flex-col items-center py-12 px-4`}
      data-testid="app-root"
    >
      {/* ── Header ── */}
      <div className="w-full max-w-[600px] mb-8 flex items-center justify-between">
        <div>
          <h1 className={`text-4xl font-bold tracking-tight ${headerText} transition-colors`}>
            Dark<span className="text-[#7c3aed]">Todo</span>
          </h1>
          <p className={`text-sm mt-1 ${subText}`}>Stay organised. Stay focused.</p>
        </div>
        <button
          onClick={toggleTheme}
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          data-testid="theme-toggle"
          className={`p-2.5 rounded-xl transition-all duration-200 ${themeBtn}`}
        >
          {isDark ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>

      {/* ── Main card ── */}
      <div className={`w-full max-w-[600px] ${cardBg} rounded-2xl shadow-2xl overflow-hidden transition-colors duration-300`}>

        {/* ── Input area ── */}
        <div className="p-4 flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addTodo() }}
            placeholder="What needs to be done?"
            aria-label="New todo input"
            data-testid="todo-input"
            className={`flex-1 px-4 py-3 rounded-xl border text-sm outline-none transition-all duration-200 ${inputBg}`}
          />
          <button
            onClick={addTodo}
            data-testid="add-button"
            aria-label="Add todo"
            className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${addBtnClass}`}
          >
            Add
          </button>
        </div>

        {/* ── Filter tabs ── */}
        <div className={`px-4 pb-3 flex gap-2`}>
          {(['all', 'active', 'completed'] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              data-testid={`filter-${f}`}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all duration-200 ${
                filter === f ? filterActive : filterPill
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* ── Divider ── */}
        <div className={`h-px ${isDark ? 'bg-[#7c3aed]/20' : 'bg-gray-100'}`} />

        {/* ── Todo list ── */}
        <ul data-testid="todo-list" className="min-h-[120px]">
          {filteredTodos.length === 0 ? (
            <li className={`flex items-center justify-center py-12 text-sm ${emptyText}`}>
              {filter === 'all'
                ? 'No todos yet — add one above!'
                : filter === 'active'
                ? 'No active todos.'
                : 'No completed todos.'}
            </li>
          ) : (
            filteredTodos.map((todo, idx) => (
              <li
                key={todo.id}
                data-testid="todo-item"
                className={`group flex items-center gap-3 px-4 py-3.5 transition-colors duration-150 ${todoHover} ${
                  idx !== 0 ? `border-t ${todoBorder}` : ''
                }`}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id)}
                  aria-label={`Mark "${todo.text}" as ${todo.completed ? 'incomplete' : 'complete'}`}
                  data-testid="todo-checkbox"
                  className={`w-4 h-4 rounded cursor-pointer flex-shrink-0 ${checkboxAccent}`}
                />

                {/* Text */}
                <span
                  data-testid="todo-text"
                  className={`flex-1 text-sm leading-snug transition-all duration-200 ${
                    todo.completed ? completedText : todoText
                  }`}
                >
                  {todo.text}
                </span>

                {/* Delete */}
                <button
                  onClick={() => deleteTodo(todo.id)}
                  aria-label={`Delete "${todo.text}"`}
                  data-testid="todo-delete"
                  className={`opacity-0 group-hover:opacity-100 transition-opacity duration-150 ${deleteBtn} flex-shrink-0`}
                >
                  <TrashIcon />
                </button>
              </li>
            ))
          )}
        </ul>

        {/* ── Footer ── */}
        {todos.length > 0 && (
          <>
            <div className={`h-px ${isDark ? 'bg-[#7c3aed]/20' : 'bg-gray-100'}`} />
            <div className={`px-4 py-3 flex items-center justify-between text-xs ${footerText}`}>
              <span data-testid="active-count">
                {activeCount} {activeCount === 1 ? 'item' : 'items'} left
              </span>
              {completedCount > 0 && (
                <button
                  onClick={clearCompleted}
                  data-testid="clear-completed"
                  className={`transition-colors duration-200 ${clearBtn}`}
                >
                  Clear Completed
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
