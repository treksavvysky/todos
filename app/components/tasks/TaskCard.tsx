'use client';

import type { TaskWithDetails } from '@/app/lib/types';
import TaskStatusBadge from './TaskStatusBadge';
import TaskPriorityBadge from './TaskPriorityBadge';
import ItemTypeBadge from './ItemTypeBadge';
import LabelBadge from '../labels/LabelBadge';

interface TaskCardProps {
  task: TaskWithDetails;
  isSelected: boolean;
  onSelect: (id: string) => void;
  isBulkSelected: boolean;
  onBulkSelect: (id: string) => void;
}

export default function TaskCard({ 
  task, 
  isSelected, 
  onSelect, 
  isBulkSelected, 
  onBulkSelect 
}: TaskCardProps) {
  const dueDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  const isDimmed = task.status === 'blocked' || task.status === 'waiting' || task.status === 'parked';

  return (
    <div
      onClick={() => onSelect(task.id)}
      className="w-full text-left p-3 rounded-lg border transition-all hover:shadow-sm cursor-pointer group relative"
      style={{
        background: isSelected ? 'var(--color-bg-secondary)' : 'var(--color-surface)',
        borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
      }}
    >
      <div className="flex items-start gap-3">
        <div 
          className="mt-1"
          onClick={(e) => {
            e.stopPropagation();
            onBulkSelect(task.id);
          }}
        >
          <input
            type="checkbox"
            checked={isBulkSelected}
            onChange={() => {}} // Handled by div onClick
            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3
              className={`text-sm font-medium leading-tight ${task.status === 'done' ? 'line-through opacity-60' : ''} ${isDimmed ? 'opacity-50' : ''}`}
              style={{ color: 'var(--color-text)' }}
            >
              {task.title}
            </h3>
            <TaskPriorityBadge priority={task.priority} />
          </div>

          {task.description && (
            <p
              className="text-xs mb-2 line-clamp-2"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <ItemTypeBadge itemType={task.itemType} />
            <TaskStatusBadge status={task.status} />
            {task.labels.map((label) => (
              <LabelBadge key={label.id} label={label} />
            ))}
            {dueDate && (
              <span
                className="text-xs ml-auto"
                style={{ color: isOverdue ? '#ef4444' : 'var(--color-text-muted)' }}
              >
                {isOverdue ? 'Overdue: ' : ''}{dueDate}
              </span>
            )}
            {task.comments.length > 0 && (
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {task.comments.length} comment{task.comments.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
