'use client';

import { useState, useEffect } from 'react';
import { useTheme, themes, Theme } from './ThemeProvider';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

export default function TodoApp() {
  const { theme, setTheme } = useTheme();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState('');
  const currentTheme = themes[theme];

  useEffect(() => {
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
      setTodos(JSON.parse(savedTodos));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = () => {
    if (inputValue.trim() === '') return;

    const newTodo: Todo = {
      id: Date.now(),
      text: inputValue,
      completed: false,
    };

    setTodos([...todos, newTodo]);
    setInputValue('');
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTodo();
    }
  };

  const activeTodos = todos.filter(todo => !todo.completed).length;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${currentTheme.background} py-8 px-4 transition-all duration-300`}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`text-4xl font-bold mb-2 ${currentTheme.text}`}>
            My Todo List
          </h1>
          <p className={`${currentTheme.textSecondary}`}>
            {activeTodos} {activeTodos === 1 ? 'task' : 'tasks'} remaining
          </p>
        </div>

        {/* Theme Selector */}
        <div className={`${currentTheme.card} rounded-lg shadow-lg p-6 mb-6 border`}>
          <h2 className={`text-lg font-semibold mb-3 ${currentTheme.text}`}>
            Choose a Theme
          </h2>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(themes) as Theme[]).map((themeName) => (
              <button
                key={themeName}
                onClick={() => setTheme(themeName)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  theme === themeName
                    ? currentTheme.button
                    : `${currentTheme.card} border hover:opacity-80`
                }`}
              >
                {themes[themeName].name}
              </button>
            ))}
          </div>
        </div>

        {/* Add Todo Section */}
        <div className={`${currentTheme.card} rounded-lg shadow-lg p-6 mb-6 border`}>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add a new task..."
              className={`flex-1 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-opacity-50 ${currentTheme.input}`}
            />
            <button
              onClick={addTodo}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${currentTheme.button}`}
            >
              Add
            </button>
          </div>
        </div>

        {/* Todo List */}
        <div className={`${currentTheme.card} rounded-lg shadow-lg p-6 border`}>
          {todos.length === 0 ? (
            <p className={`text-center py-8 ${currentTheme.textSecondary}`}>
              No tasks yet. Add one to get started!
            </p>
          ) : (
            <ul className="space-y-3">
              {todos.map((todo) => (
                <li
                  key={todo.id}
                  className={`flex items-center gap-3 p-4 rounded-lg ${currentTheme.card} border transition-all hover:shadow-md`}
                >
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id)}
                    className={`w-5 h-5 cursor-pointer ${currentTheme.checkbox}`}
                  />
                  <span
                    className={`flex-1 ${currentTheme.text} ${
                      todo.completed ? currentTheme.completed : ''
                    }`}
                  >
                    {todo.text}
                  </span>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentTheme.buttonSecondary}`}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer Stats */}
        {todos.length > 0 && (
          <div className="mt-6 text-center">
            <p className={`${currentTheme.textSecondary}`}>
              {todos.filter(t => t.completed).length} of {todos.length} completed
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
