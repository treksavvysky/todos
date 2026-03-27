'use client';

import { useApp } from '../AppProvider';
import TaskCard from './TaskCard';
import EmptyState from '../ui/EmptyState';
import LoadingSpinner from '../ui/LoadingSpinner';
import type { TaskStatus, TaskSortBy, SortOrder } from '@/app/lib/types';

const STATUS_TABS: { value: TaskStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

const SORT_OPTIONS: { value: TaskSortBy; label: string }[] = [
  { value: 'created_at', label: 'Date Created' },
  { value: 'due_date', label: 'Due Date' },
  { value: 'priority', label: 'Priority' },
  { value: 'title', label: 'Title' },
];

export default function TaskList() {
  const { state, dispatch } = useApp();
  const currentStatus = state.filters.status || 'all';
  const currentSortBy = state.filters.sortBy || 'created_at';
  const currentSortOrder = state.filters.sortOrder || 'desc';

  if (state.isLoading) return <LoadingSpinner />;

  const handleSortByChange = (value: TaskSortBy) => {
    dispatch({ type: 'SET_FILTERS', payload: { sortBy: value } });
  };

  const toggleSortOrder = () => {
    const nextOrder: SortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
    dispatch({ type: 'SET_FILTERS', payload: { sortOrder: nextOrder } });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Filters and Sorting Bar */}
      <div
        className="flex flex-col border-b shrink-0"
        style={{ borderColor: 'var(--color-border)' }}
      >
        {/* Status filter tabs */}
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex gap-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => dispatch({ type: 'SET_FILTERS', payload: { status: tab.value } })}
                className="px-3 py-1 text-xs font-medium rounded-md transition-colors"
                style={{
                  background: currentStatus === tab.value ? 'var(--color-primary)' : 'transparent',
                  color: currentStatus === tab.value ? '#ffffff' : 'var(--color-text-secondary)',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort controls */}
          <div className="flex items-center gap-2">
            <select
              value={currentSortBy}
              onChange={(e) => handleSortByChange(e.target.value as TaskSortBy)}
              className="text-xs bg-transparent border-none outline-none cursor-pointer font-medium"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  Sort by {opt.label}
                </option>
              ))}
            </select>
            <button
              onClick={toggleSortOrder}
              title={currentSortOrder === 'asc' ? 'Ascending' : 'Descending'}
              className="p-1 rounded hover:bg-black/5 transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {currentSortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Task cards */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        {state.tasks.length === 0 ? (
          <EmptyState message="No tasks found. Create one to get started." />
        ) : (
          state.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isSelected={state.selectedTaskId === task.id}
              onSelect={(id) => dispatch({ type: 'SELECT_TASK', payload: id })}
            />
          ))
        )}
      </div>
    </div>
  );
}
