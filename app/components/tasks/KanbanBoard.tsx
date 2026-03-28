'use client';

import { useApp } from '../AppProvider';
import TaskCard from './TaskCard';
import type { TaskStatus, TaskWithDetails } from '@/app/lib/types';

const WIP_LIMITS: Partial<Record<TaskStatus, number>> = {
  'in_progress': 3,
};

const COLUMN_CONFIG: { status: TaskStatus; label: string; icon: string }[] = [
  { status: 'pending', label: 'To Do', icon: '📥' },
  { status: 'in_progress', label: 'In Progress', icon: '⚡' },
  { status: 'completed', label: 'Done', icon: '✅' },
];

export default function KanbanBoard() {
  const { state, dispatch, actions } = useApp();

  const tasksByStatus = COLUMN_CONFIG.reduce((acc, col) => {
    acc[col.status] = state.tasks.filter(t => t.status === col.status);
    return acc;
  }, {} as Record<TaskStatus, TaskWithDetails[]>);

  const handleMoveTask = async (taskId: string, newStatus: TaskStatus) => {
    // Check WIP limits
    const limit = WIP_LIMITS[newStatus];
    if (limit && tasksByStatus[newStatus].length >= limit) {
      dispatch({ 
        type: 'ADD_TOAST', 
        payload: { 
          message: `WIP Limit Reached! Finish existing tasks in ${newStatus.replace('_', ' ')} before adding more.`, 
          type: 'error' 
        } 
      });
      return;
    }

    await actions.updateTask(taskId, { status: newStatus });
  };

  return (
    <div className="flex-1 flex overflow-x-auto overflow-y-hidden p-4 gap-4 bg-slate-50/50">
      {COLUMN_CONFIG.map((col) => {
        const columnTasks = tasksByStatus[col.status];
        const limit = WIP_LIMITS[col.status];
        const isNearLimit = limit && columnTasks.length === limit;

        return (
          <div 
            key={col.status}
            className="flex-1 min-w-[300px] max-w-[400px] flex flex-col gap-3"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">{col.icon}</span>
                <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--color-text)' }}>
                  {col.label}
                </h3>
                <span 
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isNearLimit ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}
                >
                  {columnTasks.length}{limit ? ` / ${limit}` : ''}
                </span>
              </div>
            </div>

            {/* Tasks Container */}
            <div 
              className="flex-1 overflow-y-auto flex flex-col gap-2 p-2 rounded-lg border-2 border-dashed transition-colors"
              style={{ 
                borderColor: isNearLimit ? 'rgba(217, 119, 6, 0.2)' : 'var(--color-border)',
                background: isNearLimit ? 'rgba(217, 119, 6, 0.02)' : 'transparent'
              }}
            >
              {columnTasks.map((task) => (
                <div key={task.id} className="relative group">
                  <TaskCard
                    task={task}
                    isSelected={state.selectedTaskId === task.id}
                    isBulkSelected={state.bulkSelection.has(task.id)}
                    onSelect={(id) => dispatch({ type: 'SELECT_TASK', payload: id })}
                    onBulkSelect={(id) => dispatch({ type: 'TOGGLE_BULK_SELECT', payload: id })}
                  />
                  
                  {/* Quick Move Controls */}
                  <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    {col.status !== 'pending' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleMoveTask(task.id, 'pending'); }}
                        className="p-1 rounded bg-white shadow-sm border hover:bg-slate-50 text-[10px] flex items-center justify-center w-6 h-6"
                        title="Move to To Do"
                      >
                        ⬅️
                      </button>
                    )}
                    {col.status !== 'in_progress' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleMoveTask(task.id, 'in_progress'); }}
                        className="p-1 rounded bg-white shadow-sm border hover:bg-slate-50 text-[10px] flex items-center justify-center w-6 h-6"
                        title="Move to In Progress"
                      >
                        🚀
                      </button>
                    )}
                    {col.status !== 'completed' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleMoveTask(task.id, 'completed'); }}
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
                <div className="flex-1 flex items-center justify-center text-xs opacity-30 italic">
                  Empty
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
