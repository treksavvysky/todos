'use client';

import { useState } from 'react';
import { ThemeProvider } from './components/ThemeProvider';
import TodoApp from './components/TodoApp';

export default function Home() {
  return (
    <ThemeProvider>
      <TodoApp />
    </ThemeProvider>
  );
}
