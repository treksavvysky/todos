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
  const { state, dispatch, actions } = useApp();
  const currentStatus = state.filters.status || 'all';
  const currentSortBy = state.filters.sortBy || 'created_at';
  const currentSortOrder = state.filters.sortOrder || 'desc';

  const selectedCount = state.bulkSelection.size;
  const isAllSelected = state.tasks.length > 0 && selectedCount === state.tasks.length;

  if (state.isLoading) return <LoadingSpinner />;

  const handleSortByChange = (value: TaskSortBy) => {
    dispatch({ type: 'SET_FILTERS', payload: { sortBy: value } });
  };

  const toggleSortOrder = () => {
    const nextOrder: SortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
    dispatch({ type: 'SET_FILTERS', payload: { sortOrder: nextOrder } });
  };

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      dispatch({ type: 'CLEAR_BULK_SELECT' });
    } else {
      dispatch({ type: 'SET_BULK_SELECT', payload: state.tasks.map(t => t.id) });
    }
  };

  const handleBulkUpdateStatus = (status: TaskStatus) => {
    actions.bulkUpdateTasks(Array.from(state.bulkSelection), { status });
  };

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedCount} tasks?`)) {
      actions.bulkDeleteTasks(Array.from(state.bulkSelection));
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Bulk Action Bar */}
      {selectedCount > 0 && (
        <div 
          className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-2 shadow-md"
          style={{ background: 'var(--color-primary)', color: '#ffffff' }}
        >
          <div className="flex items-center gap-3">
            <input 
              type="checkbox" 
              checked={isAllSelected} 
              onChange={handleToggleSelectAll}
              className="w-4 h-4 rounded border-white/30 bg-white/20 text-white focus:ring-offset-0 focus:ring-white"
            />
            <span className="text-sm font-semibold">{selectedCount} selected</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex bg-white/10 rounded overflow-hidden border border-white/20">
              <button 
                onClick={() => handleBulkUpdateStatus('pending')}
                className="px-2 py-1 text-[10px] uppercase font-bold hover:bg-white/10 border-r border-white/20"
              >
                Pending
              </button>
              <button 
                onClick={() => handleBulkUpdateStatus('in_progress')}
                className="px-2 py-1 text-[10px] uppercase font-bold hover:bg-white/10 border-r border-white/20"
              >
                In Progress
              </button>
              <button 
                onClick={() => handleBulkUpdateStatus('completed')}
                className="px-2 py-1 text-[10px] uppercase font-bold hover:bg-white/10"
              >
                Completed
              </button>
            </div>
            
            <button 
              onClick={handleBulkDelete}
              className="p-1.5 rounded hover:bg-red-500 transition-colors"
              title="Delete selected"
            >
              🗑️
            </button>
            
            <button 
              onClick={() => dispatch({ type: 'CLEAR_BULK_SELECT' })}
              className="ml-2 text-xs font-bold hover:underline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filters and Sorting Bar */}
      <div
        className="flex flex-col border-b shrink-0"
        style={{ borderColor: 'var(--color-border)' }}
      >
        {/* Status filter tabs */}
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex gap-1 items-center">
            <input 
              type="checkbox" 
              checked={isAllSelected} 
              onChange={handleToggleSelectAll}
              className="mr-2 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              title="Select all visible"
            />
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
              isBulkSelected={state.bulkSelection.has(task.id)}
              onSelect={(id) => dispatch({ type: 'SELECT_TASK', payload: id })}
              onBulkSelect={(id) => dispatch({ type: 'TOGGLE_BULK_SELECT', payload: id })}
            />
          ))
        )}
      </div>
    </div>
  );
}
