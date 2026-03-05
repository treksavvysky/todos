'use client';

import { useTheme } from '../ThemeProvider';
import { useApp } from '../AppProvider';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { state, dispatch } = useApp();

  return (
    <header className="h-14 border-b flex items-center justify-between px-4 shrink-0"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
      <h1 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
        Task Manager
      </h1>

      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search tasks..."
          value={state.filters.search || ''}
          onChange={(e) => dispatch({ type: 'SET_FILTERS', payload: { search: e.target.value } })}
          className="text-sm rounded-md px-3 py-1.5 border outline-none focus:ring-2 focus:ring-indigo-400 w-48"
          style={{
            background: 'var(--color-bg)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text)',
          }}
        />

        <button
          onClick={toggleTheme}
          className="p-2 rounded-md hover:opacity-80 transition-opacity text-sm"
          style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>
    </header>
  );
}
