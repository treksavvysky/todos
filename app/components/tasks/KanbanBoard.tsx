'use client';

import { useState } from 'react';
import { useApp } from '../AppProvider';
import TaskCard from './TaskCard';
import TaskStatusBadge from './TaskStatusBadge';
import { ITEM_TYPE_OPTIONS } from './ItemTypeBadge';
import type { TaskStatus, ItemType, TaskWithDetails } from '@/app/lib/types';

const WIP_LIMITS: Record<string, number> = {
  'active': 3,
};

// Kanban columns map to execution states:
// To Do = ready + blocked (blocked shown dimmed)
// In Progress = active
// Done = done
// waiting = hidden by default, toggleable into To Do
// parked = never shown
type KanbanColumn = 'todo' | 'in_progress' | 'done';

const COLUMN_CONFIG: { key: KanbanColumn; label: string; icon: string }[] = [
  { key: 'todo', label: 'To Do', icon: '📥' },
  { key: 'in_progress', label: 'In Progress', icon: '⚡' },
  { key: 'done', label: 'Done', icon: '✅' },
];

const LANE_ORDER: ItemType[] = ['action', 'decision', 'initiative', 'idea', 'maintenance'];

function getColumnForStatus(status: TaskStatus): KanbanColumn | null {
  switch (status) {
    case 'ready': return 'todo';
    case 'blocked': return 'todo';
    case 'waiting': return 'todo'; // only when showWaiting is true
    case 'active': return 'in_progress';
    case 'done': return 'done';
    case 'parked': return null; // never shown
  }
}

export default function KanbanBoard() {
  const { state, dispatch, actions } = useApp();
  const [collapsedLanes, setCollapsedLanes] = useState<Set<ItemType>>(new Set());
  const [showWaiting, setShowWaiting] = useState(false);

  // Filter visible tasks (exclude parked, conditionally exclude waiting)
  const visibleTasks = state.tasks.filter(t => {
    if (t.status === 'parked') return false;
    if (t.status === 'waiting' && !showWaiting) return false;
    return true;
  });

  // Group tasks by item type, then by kanban column within each lane
  const tasksByTypeAndColumn = LANE_ORDER.reduce((acc, type) => {
    const typeTasks = visibleTasks.filter(t => t.itemType === type);
    const byColumn: Record<KanbanColumn, TaskWithDetails[]> = { todo: [], in_progress: [], done: [] };
    for (const task of typeTasks) {
      const col = getColumnForStatus(task.status);
      if (col) byColumn[col].push(task);
    }
    acc[type] = { tasks: typeTasks, byColumn };
    return acc;
  }, {} as Record<ItemType, { tasks: TaskWithDetails[]; byColumn: Record<KanbanColumn, TaskWithDetails[]> }>);

  // Global WIP count
  const globalActive = visibleTasks.filter(t => t.status === 'active');

  const handleMoveTask = async (taskId: string, newStatus: TaskStatus) => {
    const limit = WIP_LIMITS[newStatus];
    if (limit && globalActive.length >= limit) {
      const task = state.tasks.find(t => t.id === taskId);
      if (!task || task.status !== newStatus) {
        dispatch({
          type: 'ADD_TOAST',
          payload: {
            message: `WIP Limit Reached! Finish existing active tasks before adding more.`,
            type: 'error'
          }
        });
        return;
      }
    }
    await actions.updateTask(taskId, { status: newStatus });
  };

  const toggleLane = (type: ItemType) => {
    setCollapsedLanes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const activeLanes = LANE_ORDER.filter(type => tasksByTypeAndColumn[type].tasks.length > 0);
  const lanesToRender = activeLanes.length > 0 ? activeLanes : LANE_ORDER;

  // Counts per column (across all lanes)
  const columnCounts: Record<KanbanColumn, number> = { todo: 0, in_progress: 0, done: 0 };
  for (const type of LANE_ORDER) {
    const data = tasksByTypeAndColumn[type];
    columnCounts.todo += data.byColumn.todo.length;
    columnCounts.in_progress += data.byColumn.in_progress.length;
    columnCounts.done += data.byColumn.done.length;
  }

  const waitingCount = state.tasks.filter(t => t.status === 'waiting').length;
  const parkedCount = state.tasks.filter(t => t.status === 'parked').length;

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      {/* Column headers (sticky) */}
      <div className="sticky top-0 z-10 flex items-center px-4 pt-4 pb-2 gap-4" style={{ background: 'var(--color-bg)' }}>
        <div className="w-[140px] shrink-0 flex items-center gap-2">
          {/* Visibility toggles */}
          <button
            onClick={() => setShowWaiting(prev => !prev)}
            className="text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors"
            style={{
              borderColor: showWaiting ? '#9a3412' : 'var(--color-border)',
              backgroundColor: showWaiting ? '#ffedd5' : 'transparent',
              color: showWaiting ? '#9a3412' : 'var(--color-text-muted)',
            }}
            title={showWaiting ? 'Hide waiting items' : 'Show waiting items'}
          >
            ⏳ {waitingCount}
          </button>
          {parkedCount > 0 && (
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ color: 'var(--color-text-muted)' }}
              title={`${parkedCount} parked item${parkedCount !== 1 ? 's' : ''} (hidden)`}
            >
              ⏸️ {parkedCount}
            </span>
          )}
        </div>
        {COLUMN_CONFIG.map((col) => {
          const count = columnCounts[col.key];
          const limit = col.key === 'in_progress' ? WIP_LIMITS['active'] : undefined;
          const isNearLimit = limit && count >= limit;
          return (
            <div key={col.key} className="flex-1 min-w-[200px] flex items-center gap-2 px-2">
              <span className="text-sm">{col.icon}</span>
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text)' }}>
                {col.label}
              </h3>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isNearLimit ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}
              >
                {count}{limit ? ` / ${limit}` : ''}
              </span>
            </div>
          );
        })}
      </div>

      {/* Swim lanes */}
      <div className="flex flex-col gap-1 px-4 pb-4">
        {lanesToRender.map((type) => {
          const laneConfig = ITEM_TYPE_OPTIONS.find(o => o.value === type)!;
          const laneData = tasksByTypeAndColumn[type];
          const isCollapsed = collapsedLanes.has(type);
          const totalInLane = laneData.tasks.length;

          return (
            <div key={type} className="border rounded-lg" style={{ borderColor: 'var(--color-border)' }}>
              {/* Lane header */}
              <button
                onClick={() => toggleLane(type)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:opacity-80 transition-opacity"
                style={{ background: 'var(--color-bg-secondary)' }}
              >
                <span className="text-xs transition-transform" style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>
                  ▼
                </span>
                <span className="text-sm">{laneConfig.icon}</span>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text)' }}>
                  {laneConfig.label}s
                </span>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-600">
                  {totalInLane}
                </span>
              </button>

              {/* Lane content - kanban columns */}
              {!isCollapsed && (
                <div className="flex gap-4 p-3">
                  <div className="w-[140px] shrink-0" />
                  {COLUMN_CONFIG.map((col) => {
                    const columnTasks = laneData.byColumn[col.key];

                    return (
                      <div key={col.key} className="flex-1 min-w-[200px]">
                        <div
                          className="flex flex-col gap-2 p-2 rounded-lg border border-dashed min-h-[60px]"
                          style={{ borderColor: 'var(--color-border)' }}
                        >
                          {columnTasks.map((task) => (
                            <div
                              key={task.id}
                              className={`relative group ${task.status === 'blocked' || task.status === 'waiting' ? 'opacity-60' : ''}`}
                            >
                              {/* Blocked/Waiting overlay badge */}
                              {(task.status === 'blocked' || task.status === 'waiting') && (
                                <div className="absolute top-1 left-1 z-10">
                                  <TaskStatusBadge status={task.status} />
                                </div>
                              )}

                              <TaskCard
                                task={task}
                                isSelected={state.selectedTaskId === task.id}
                                isBulkSelected={state.bulkSelection.has(task.id)}
                                onSelect={(id) => dispatch({ type: 'SELECT_TASK', payload: id })}
                                onBulkSelect={(id) => dispatch({ type: 'TOGGLE_BULK_SELECT', payload: id })}
                                objectives={state.objectives}
                              />

                              {/* Quick Move Controls */}
                              <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                {col.key !== 'todo' && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleMoveTask(task.id, 'ready'); }}
                                    className="p-1 rounded bg-white shadow-sm border hover:bg-slate-50 text-[10px] flex items-center justify-center w-6 h-6"
                                    title="Move to To Do"
                                  >
                                    ⬅️
                                  </button>
                                )}
                                {col.key !== 'in_progress' && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleMoveTask(task.id, 'active'); }}
                                    className="p-1 rounded bg-white shadow-sm border hover:bg-slate-50 text-[10px] flex items-center justify-center w-6 h-6"
                                    title="Move to In Progress"
                                  >
                                    🚀
                                  </button>
                                )}
                                {col.key !== 'done' && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleMoveTask(task.id, 'done'); }}
                                    className="p-1 rounded bg-white shadow-sm border hover:bg-slate-50 text-[10px] flex items-center justify-center w-6 h-6"
                                    title="Move to Done"
                                  >
                                    ➡️
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}

                          {columnTasks.length === 0 && (
                            <div className="flex items-center justify-center text-xs opacity-20 italic py-2">
                              —
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
