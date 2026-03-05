import type { Label } from '@/app/lib/types';

export default function LabelBadge({ label }: { label: Label }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border"
      style={{ borderColor: label.color, color: label.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: label.color }} />
      {label.name}
    </span>
  );
}
