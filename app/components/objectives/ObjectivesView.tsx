'use client';

import { useState } from 'react';
import { useApp } from '../AppProvider';
import TaskCard from '../tasks/TaskCard';
import type { ObjectiveWithCounts } from '@/app/lib/types';

export default function ObjectivesView() {
  const { state, dispatch } = useApp();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Group tasks by objective
  const tasksByObjective = new Map<string, typeof state.tasks>();
  const orphanedTasks = state.tasks.filter(t => !t.objectiveId && !t.parentItemId);

  for (const obj of state.objectives) {
    tasksByObjective.set(obj.id, state.tasks.filter(t => t.objectiveId === obj.id));
  }

  // Group parent items (initiatives/maintenance) and their children
  const parentItems = state.tasks.filter(t => t.itemType === 'initiative' || t.itemType === 'maintenance');
  const childrenByParent = new Map<string, typeof state.tasks>();
  for (const parent of parentItems) {
    childrenByParent.set(parent.id, state.tasks.filter(t => t.parentItemId === parent.id));
  }

  const missions = state.objectives.filter(o => o.objectiveType === 'mission');
  const parkingLots = state.objectives.filter(o => o.objectiveType === 'parking_lot');

  const renderObjectiveCard = (obj: ObjectiveWithCounts) => {
    const tasks = tasksByObjective.get(obj.id) || [];
    const isExpanded = expandedIds.has(obj.id);
    const icon = obj.objectiveType === 'mission' ? '🎯' : '🅿️';

    return (
      <div key={obj.id} className="border rounded-lg" style={{ borderColor: 'var(--color-border)' }}>
        <button
          onClick={() => toggleExpand(obj.id)}
          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:opacity-80 transition-opacity"
          style={{ background: 'var(--color-bg-secondary)' }}
        >
          <span className="text-xs transition-transform" style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
            ▼
          </span>
          <span className="text-lg">{icon}</span>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{obj.title}</h3>
            {obj.description && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{obj.description}</p>
            )}
          </div>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
            {tasks.length}
          </span>
        </button>

        {isExpanded && (
          <div className="p-3 flex flex-col gap-2">
            {tasks.length === 0 ? (
              <p className="text-xs italic px-2 py-4 text-center" style={{ color: 'var(--color-text-muted)' }}>
                No items bound to this objective
              </p>
            ) : (
              tasks.map(task => (
                <div key={task.id}>
                  <TaskCard
                    task={task}
                    isSelected={state.selectedTaskId === task.id}
                    isBulkSelected={state.bulkSelection.has(task.id)}
                    onSelect={(id) => dispatch({ type: 'SELECT_TASK', payload: id })}
                    onBulkSelect={(id) => dispatch({ type: 'TOGGLE_BULK_SELECT', payload: id })}
                    objectives={state.objectives}
                  />
                  {/* Show children if this is a parent item */}
                  {(task.itemType === 'initiative' || task.itemType === 'maintenance') && (childrenByParent.get(task.id)?.length ?? 0) > 0 && (
                    <div className="ml-6 mt-1 flex flex-col gap-1 border-l-2 pl-3" style={{ borderColor: 'var(--color-border)' }}>
                      {childrenByParent.get(task.id)!.map(child => (
                        <TaskCard
                          key={child.id}
                          task={child}
                          isSelected={state.selectedTaskId === child.id}
                          isBulkSelected={state.bulkSelection.has(child.id)}
                          onSelect={(id) => dispatch({ type: 'SELECT_TASK', payload: id })}
                          onBulkSelect={(id) => dispatch({ type: 'TOGGLE_BULK_SELECT', payload: id })}
                          objectives={state.objectives}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
      {/* Missions */}
      {missions.length > 0 && (
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--color-text-muted)' }}>
            Missions
          </h2>
          <div className="flex flex-col gap-2">
            {missions.map(renderObjectiveCard)}
          </div>
        </div>
      )}

      {/* Parking Lots */}
      {parkingLots.length > 0 && (
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--color-text-muted)' }}>
            Parking Lot
          </h2>
          <div className="flex flex-col gap-2">
            {parkingLots.map(renderObjectiveCard)}
          </div>
        </div>
      )}

      {/* Orphaned */}
      {orphanedTasks.length > 0 && (
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider mb-2 px-1 text-amber-600">
            ⚠️ Unbound Items ({orphanedTasks.length})
          </h2>
          <div className="flex flex-col gap-2">
            {orphanedTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                isSelected={state.selectedTaskId === task.id}
                isBulkSelected={state.bulkSelection.has(task.id)}
                onSelect={(id) => dispatch({ type: 'SELECT_TASK', payload: id })}
                onBulkSelect={(id) => dispatch({ type: 'TOGGLE_BULK_SELECT', payload: id })}
                objectives={state.objectives}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
