'use client';

import { useState } from 'react';
import { useApp } from '../AppProvider';
import Header from '../layout/Header';
import Sidebar from '../layout/Sidebar';
import TaskList from './TaskList';
import TaskDetail from './TaskDetail';
import TaskForm from './TaskForm';

export default function TaskDashboard() {
  const { state } = useApp();
  const [showTaskForm, setShowTaskForm] = useState(false);

  return (
    <div className="h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
      <Header />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Main task list */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* New task button bar */}
          <div
            className="flex items-center justify-between px-4 py-2 border-b"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {state.tasks.length} task{state.tasks.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => setShowTaskForm(true)}
              className="px-3 py-1.5 text-sm rounded-md text-white"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              + New Task
            </button>
          </div>

          <TaskList />
        </div>

        {/* Detail panel */}
        {state.selectedTaskId && (
          <div className="hidden lg:block">
            <TaskDetail />
          </div>
        )}
      </div>

      {/* Mobile detail overlay */}
      {state.selectedTaskId && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md">
            <TaskDetail />
          </div>
        </div>
      )}

      {showTaskForm && <TaskForm onClose={() => setShowTaskForm(false)} />}
    </div>
  );
}
