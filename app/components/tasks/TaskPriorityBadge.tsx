import type { TaskPriority } from '@/app/lib/types';

const config: Record<TaskPriority, { label: string; color: string }> = {
  low: { label: 'Low', color: '#94a3b8' },
  medium: { label: 'Medium', color: '#3b82f6' },
  high: { label: 'High', color: '#f97316' },
  urgent: { label: 'Urgent', color: '#ef4444' },
};

export default function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  const c = config[priority];
  return (
    <span className="flex items-center gap-1 text-xs" style={{ color: c.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} />
      {c.label}
    </span>
  );
}
