'use client';

import type { TaskWithDetails } from '@/app/lib/types';
import TaskStatusBadge from './TaskStatusBadge';
import TaskPriorityBadge from './TaskPriorityBadge';
import LabelBadge from '../labels/LabelBadge';

interface TaskCardProps {
  task: TaskWithDetails;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export default function TaskCard({ task, isSelected, onSelect }: TaskCardProps) {
  const dueDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';

  return (
    <button
      onClick={() => onSelect(task.id)}
      className="w-full text-left p-3 rounded-lg border transition-all hover:shadow-sm"
      style={{
        background: isSelected ? 'var(--color-bg-secondary)' : 'var(--color-surface)',
        borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h3
          className={`text-sm font-medium leading-tight ${task.status === 'completed' ? 'line-through opacity-60' : ''}`}
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
    </button>
  );
}
