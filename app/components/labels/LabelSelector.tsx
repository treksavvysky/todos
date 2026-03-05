'use client';

import { useApp } from '../AppProvider';
import type { Label } from '@/app/lib/types';

interface LabelSelectorProps {
  selectedLabels: Label[];
  taskId: string;
}

export default function LabelSelector({ selectedLabels, taskId }: LabelSelectorProps) {
  const { state, actions } = useApp();
  const selectedIds = new Set(selectedLabels.map((l) => l.id));

  const handleToggle = async (labelId: string) => {
    const newIds = selectedIds.has(labelId)
      ? [...selectedIds].filter((id) => id !== labelId)
      : [...selectedIds, labelId];
    await actions.setTaskLabels(taskId, newIds);
  };

  const scopes = state.labels.filter((l) => l.kind === 'scope');
  const projects = state.labels.filter((l) => l.kind === 'project');

  return (
    <div className="flex flex-col gap-3">
      {scopes.length > 0 && (
        <div>
          <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Scopes</p>
          <div className="flex flex-wrap gap-1.5">
            {scopes.map((label) => {
              const active = selectedIds.has(label.id);
              return (
                <button
                  key={label.id}
                  onClick={() => handleToggle(label.id)}
                  className="text-xs px-2 py-0.5 rounded-full border transition-colors"
                  style={{
                    borderColor: label.color,
                    backgroundColor: active ? label.color : 'transparent',
                    color: active ? '#ffffff' : label.color,
                  }}
                >
                  {label.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {projects.length > 0 && (
        <div>
          <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Projects</p>
          <div className="flex flex-wrap gap-1.5">
            {projects.map((label) => {
              const active = selectedIds.has(label.id);
              return (
                <button
                  key={label.id}
                  onClick={() => handleToggle(label.id)}
                  className="text-xs px-2 py-0.5 rounded-full border transition-colors"
                  style={{
                    borderColor: label.color,
                    backgroundColor: active ? label.color : 'transparent',
                    color: active ? '#ffffff' : label.color,
                  }}
                >
                  {label.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
