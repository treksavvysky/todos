'use client';

import { useState } from 'react';
import { useApp } from '../AppProvider';
import type { LabelKind, LabelWithCount } from '@/app/lib/types';

const PRESET_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#6366f1', '#a855f7', '#ec4899'];

interface LabelFormProps {
  kind: LabelKind;
  onClose: () => void;
  label?: LabelWithCount;
}

export default function LabelForm({ kind, onClose, label }: LabelFormProps) {
  const { actions } = useApp();
  const [name, setName] = useState(label?.name ?? '');
  const [color, setColor] = useState(label?.color ?? PRESET_COLORS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isEditing = label != null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError('');
    try {
      if (isEditing) {
        await actions.updateLabel(label.id, { name: name.trim(), color });
      } else {
        await actions.createLabel({ name: name.trim(), kind, color });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : isEditing ? 'Failed to update' : 'Failed to create');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="p-1"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Personal, Work, Project X"
            className="w-full px-3 py-2 text-sm border rounded-md outline-none focus:ring-2 focus:ring-indigo-400"
            style={{
              background: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text)',
            }}
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Color</label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center"
                style={{
                  backgroundColor: c,
                  borderColor: color === c ? 'var(--color-text)' : 'transparent',
                  transform: color === c ? 'scale(1.1)' : 'scale(1)',
                }}
              >
                {color === c && <span className="text-white text-xs">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-xs text-red-500 bg-red-50 p-2 rounded">{error}</p>}

        <div className="flex justify-end gap-3 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-md hover:opacity-80 transition-opacity"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim() || submitting}
            className="px-4 py-2 text-sm font-medium rounded-md text-white disabled:opacity-50 transition-opacity"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {submitting ? 'Saving...' : isEditing ? 'Save Changes' : `Create ${kind === 'scope' ? 'Scope' : 'Project'}`}
          </button>
        </div>
      </form>
    </div>
  );
}
