'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '../ThemeProvider';
import { useApp } from '../AppProvider';
import { useDebounce } from '@/app/lib/useDebounce';

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { dispatch } = useApp();
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);

  useEffect(() => {
    dispatch({ type: 'SET_FILTERS', payload: { search: debouncedSearch } });
  }, [debouncedSearch, dispatch]);

  return (
    <header className="h-14 border-b flex items-center justify-between px-4 shrink-0"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
      
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-md hover:bg-black/5 transition-colors"
          style={{ color: 'var(--color-text)' }}
        >
          ☰
        </button>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
          Task Manager
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
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
