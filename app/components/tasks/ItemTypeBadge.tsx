import type { ItemType } from '@/app/lib/types';

const config: Record<ItemType, { label: string; color: string; icon: string }> = {
  action: { label: 'Action', color: '#3b82f6', icon: '⚡' },
  decision: { label: 'Decision', color: '#f59e0b', icon: '⚖️' },
  initiative: { label: 'Initiative', color: '#8b5cf6', icon: '🎯' },
  idea: { label: 'Idea', color: '#22c55e', icon: '💡' },
  maintenance: { label: 'Maintenance', color: '#6b7280', icon: '🔧' },
};

export default function ItemTypeBadge({ itemType }: { itemType: ItemType }) {
  const c = config[itemType];
  return (
    <span
      className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full"
      style={{ backgroundColor: `${c.color}18`, color: c.color }}
    >
      <span>{c.icon}</span>
      {c.label}
    </span>
  );
}

export const ITEM_TYPE_OPTIONS: { value: ItemType; label: string; icon: string }[] = [
  { value: 'action', label: 'Action', icon: '⚡' },
  { value: 'decision', label: 'Decision', icon: '⚖️' },
  { value: 'initiative', label: 'Initiative', icon: '🎯' },
  { value: 'idea', label: 'Idea', icon: '💡' },
  { value: 'maintenance', label: 'Maintenance', icon: '🔧' },
];
