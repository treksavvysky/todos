'use client';

import { useApp } from '../AppProvider';
import TaskCard from './TaskCard';
import EmptyState from '../ui/EmptyState';
import LoadingSpinner from '../ui/LoadingSpinner';
import type { TaskStatus } from '@/app/lib/types';

const STATUS_TABS: { value: TaskStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

export default function TaskList() {
  const { state, dispatch } = useApp();
  const currentStatus = state.filters.status || 'all';

  if (state.isLoading) return <LoadingSpinner />;

  return (
    <div className="flex flex-col h-full">
      {/* Status filter tabs */}
      <div
        className="flex gap-1 px-4 py-2 border-b shrink-0"
        style={{ borderColor: 'var(--color-border)' }}
      >
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
