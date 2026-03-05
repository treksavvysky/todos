'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Theme = 'ocean' | 'sunset' | 'forest' | 'lavender' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const themes = {
  ocean: {
    name: 'Ocean Blue',
    background: 'from-blue-100 to-cyan-100',
    card: 'bg-white/80 backdrop-blur-sm border-blue-200',
    text: 'text-gray-800',
    textSecondary: 'text-gray-600',
    button: 'bg-blue-500 hover:bg-blue-600 text-white',
    buttonSecondary: 'bg-red-500 hover:bg-red-600 text-white',
    input: 'bg-white border-blue-300 text-gray-800 placeholder-gray-400',
    checkbox: 'accent-blue-500',
    completed: 'line-through text-gray-400',
  },
  sunset: {
    name: 'Sunset Orange',
    background: 'from-orange-100 to-pink-100',
    card: 'bg-white/80 backdrop-blur-sm border-orange-200',
    text: 'text-gray-800',
    textSecondary: 'text-gray-600',
    button: 'bg-orange-500 hover:bg-orange-600 text-white',
    buttonSecondary: 'bg-pink-500 hover:bg-pink-600 text-white',
    input: 'bg-white border-orange-300 text-gray-800 placeholder-gray-400',
    checkbox: 'accent-orange-500',
    completed: 'line-through text-gray-400',
  },
  forest: {
    name: 'Forest Green',
    background: 'from-green-100 to-emerald-100',
    card: 'bg-white/80 backdrop-blur-sm border-green-200',
    text: 'text-gray-800',
    textSecondary: 'text-gray-600',
    button: 'bg-green-600 hover:bg-green-700 text-white',
    buttonSecondary: 'bg-red-500 hover:bg-red-600 text-white',
    input: 'bg-white border-green-300 text-gray-800 placeholder-gray-400',
    checkbox: 'accent-green-600',
    completed: 'line-through text-gray-400',
  },
  lavender: {
    name: 'Lavender Dreams',
    background: 'from-purple-100 to-pink-100',
    card: 'bg-white/80 backdrop-blur-sm border-purple-200',
    text: 'text-gray-800',
    textSecondary: 'text-gray-600',
    button: 'bg-purple-500 hover:bg-purple-600 text-white',
    buttonSecondary: 'bg-pink-500 hover:bg-pink-600 text-white',
    input: 'bg-white border-purple-300 text-gray-800 placeholder-gray-400',
    checkbox: 'accent-purple-500',
    completed: 'line-through text-gray-400',
  },
  dark: {
    name: 'Dark Mode',
    background: 'from-gray-900 to-gray-800',
    card: 'bg-gray-800/80 backdrop-blur-sm border-gray-700',
    text: 'text-gray-100',
    textSecondary: 'text-gray-400',
    button: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    buttonSecondary: 'bg-red-600 hover:bg-red-700 text-white',
    input: 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400',
    checkbox: 'accent-indigo-500',
    completed: 'line-through text-gray-500',
  },
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('ocean');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && themes[savedTheme]) {
      setTheme(savedTheme);
    }
  }, []);

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
