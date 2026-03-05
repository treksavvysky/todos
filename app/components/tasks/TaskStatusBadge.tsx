import type { TaskStatus } from '@/app/lib/types';

const config: Record<TaskStatus, { label: string; bg: string; text: string }> = {
  pending: { label: 'Pending', bg: '#fef3c7', text: '#92400e' },
  in_progress: { label: 'In Progress', bg: '#dbeafe', text: '#1e40af' },
  completed: { label: 'Completed', bg: '#d1fae5', text: '#065f46' },
};

export default function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const c = config[status];
  return (
    <span
      className="text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {c.label}
    </span>
  );
}
