'use client';

import { useState, useCallback, useEffect } from 'react';
import { useApp } from '../AppProvider';
import Header from '../layout/Header';
import Sidebar from '../layout/Sidebar';
import TaskList from './TaskList';
import KanbanBoard from './KanbanBoard';
import ObjectivesView from '../objectives/ObjectivesView';
import NowView from '../now/NowView';
import ReviewView from '../review/ReviewView';
import TaskDetail from './TaskDetail';
import TaskForm from './TaskForm';
import QuickAdd from './QuickAdd';
import { ToastContainer } from '../ui/Toast';
import Drawer from '../ui/Drawer';

export default function TaskDashboard() {
  const { state, dispatch } = useApp();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'now' | 'list' | 'kanban' | 'objectives' | 'review'>('now');

  const dismissToast = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_TOAST', payload: id });
  }, [dispatch]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName);
      if (isInput) return;

      if (e.key === 'n') {
        e.preventDefault();
        setShowQuickAdd(true);
      } else if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowQuickAdd(true);
      } else if (e.key === 's') {
        e.preventDefault();
        document.getElementById('task-search-input')?.focus();
      } else if (e.key === 'Escape') {
        dispatch({ type: 'SELECT_TASK', payload: null });
        setIsMenuOpen(false);
        setShowTaskForm(false);
        setShowQuickAdd(false);
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (state.tasks.length === 0) return;
        e.preventDefault();
        
        const currentIndex = state.selectedTaskId 
          ? state.tasks.findIndex(t => t.id === state.selectedTaskId)
          : -1;
        
        let nextIndex = 0;
        if (e.key === 'ArrowDown') {
          nextIndex = currentIndex < state.tasks.length - 1 ? currentIndex + 1 : 0;
        } else {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : state.tasks.length - 1;
        }
        
        const nextTask = state.tasks[nextIndex];
        if (nextTask) {
          dispatch({ type: 'SELECT_TASK', payload: nextTask.id });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, state.tasks, state.selectedTaskId]);

  return (
    <div className="h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
      <Header onMenuClick={() => setIsMenuOpen(true)} />

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Mobile Sidebar Drawer */}
        <Drawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} title="Task Manager">
          <Sidebar onSelect={() => setIsMenuOpen(false)} />
        </Drawer>

        {/* Main task list */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* New task button bar */}
          <div
            className="flex items-center justify-between px-4 py-2 border-b"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center gap-4">
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {state.tasks.length} task{state.tasks.length !== 1 ? 's' : ''}
              </span>
              
              <div className="flex rounded-md p-0.5 border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-secondary)' }}>
                <button
                  onClick={() => setViewMode('now')}
                  className="px-2 py-1 text-[10px] font-bold rounded transition-all"
                  style={{
                    backgroundColor: viewMode === 'now' ? 'var(--color-primary)' : 'transparent',
                    color: viewMode === 'now' ? '#ffffff' : 'var(--color-text-muted)',
                  }}
                >
                  NOW
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className="px-2 py-1 text-[10px] font-bold rounded transition-all"
                  style={{
                    backgroundColor: viewMode === 'list' ? 'var(--color-primary)' : 'transparent',
                    color: viewMode === 'list' ? '#ffffff' : 'var(--color-text-muted)',
                  }}
                >
                  LIST
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className="px-2 py-1 text-[10px] font-bold rounded transition-all"
                  style={{
                    backgroundColor: viewMode === 'kanban' ? 'var(--color-primary)' : 'transparent',
                    color: viewMode === 'kanban' ? '#ffffff' : 'var(--color-text-muted)',
                  }}
                >
                  KANBAN
                </button>
                <button
                  onClick={() => setViewMode('objectives')}
                  className="px-2 py-1 text-[10px] font-bold rounded transition-all"
                  style={{
                    backgroundColor: viewMode === 'objectives' ? 'var(--color-primary)' : 'transparent',
                    color: viewMode === 'objectives' ? '#ffffff' : 'var(--color-text-muted)',
                  }}
                >
                  OBJECTIVES
                </button>
                <button
                  onClick={() => setViewMode('review')}
                  className="px-2 py-1 text-[10px] font-bold rounded transition-all"
                  style={{
                    backgroundColor: viewMode === 'review' ? 'var(--color-primary)' : 'transparent',
                    color: viewMode === 'review' ? '#ffffff' : 'var(--color-text-muted)',
                  }}
                >
                  REVIEW
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowQuickAdd(true)}
              className="px-3 py-1.5 text-sm rounded-md text-white"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              + Quick Add
            </button>
          </div>

          {viewMode === 'now' && <NowView />}
          {viewMode === 'list' && <TaskList />}
          {viewMode === 'kanban' && <KanbanBoard />}
          {viewMode === 'objectives' && <ObjectivesView />}
          {viewMode === 'review' && <ReviewView />}
        </div>

        {/* Detail panel (Always shown on large screens) */}
        <div className="hidden lg:block shrink-0">
          <TaskDetail />
        </div>
      </div>

      {/* Mobile detail overlay (Only shown when a task is selected) */}
      {state.selectedTaskId && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md">
            <TaskDetail />
          </div>
        </div>
      )}

      {showTaskForm && <TaskForm onClose={() => setShowTaskForm(false)} />}
      {showQuickAdd && <QuickAdd onClose={() => setShowQuickAdd(false)} />}

      <ToastContainer toasts={state.toasts} onDismiss={dismissToast} />
    </div>
  );
}
