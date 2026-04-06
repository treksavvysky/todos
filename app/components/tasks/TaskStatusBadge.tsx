import type { TaskStatus } from '@/app/lib/types';

const config: Record<TaskStatus, { label: string; bg: string; text: string; icon?: string }> = {
  ready: { label: 'Ready', bg: '#fef3c7', text: '#92400e' },
  active: { label: 'Active', bg: '#dbeafe', text: '#1e40af' },
  blocked: { label: 'Blocked', bg: '#fee2e2', text: '#991b1b', icon: '🚫' },
  waiting: { label: 'Waiting', bg: '#ffedd5', text: '#9a3412', icon: '⏳' },
  parked: { label: 'Parked', bg: '#f1f5f9', text: '#64748b', icon: '⏸️' },
  done: { label: 'Done', bg: '#d1fae5', text: '#065f46' },
};

export default function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const c = config[status];
  return (
    <span
      className="text-xs font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {c.icon && <span>{c.icon}</span>}
      {c.label}
    </span>
  );
}
