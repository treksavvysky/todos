'use client';

import { useState } from 'react';
import { useApp } from '../AppProvider';
import type { LabelKind } from '@/app/lib/types';

const PRESET_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#6366f1', '#a855f7', '#ec4899'];

interface LabelFormProps {
  kind: LabelKind;
  onClose: () => void;
}

export default function LabelForm({ kind, onClose }: LabelFormProps) {
  const { actions } = useApp();
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError('');
    try {
      await actions.createLabel({ name: name.trim(), kind, color });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="border rounded-lg p-3"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-secondary)' }}
    >
      <h3 className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
        New {kind === 'scope' ? 'Scope' : 'Project'}
      </h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="w-full px-2 py-1 text-sm border rounded outline-none focus:ring-2 focus:ring-indigo-400"
          style={{
            background: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text)',
          }}
          autoFocus
        />
        <div className="flex gap-1">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="w-5 h-5 rounded-full border-2 transition-transform"
              style={{
                backgroundColor: c,
                borderColor: color === c ? 'var(--color-text)' : 'transparent',
                transform: color === c ? 'scale(1.2)' : 'scale(1)',
              }}
            />
          ))}
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="text-xs px-2 py-1 rounded hover:opacity-80"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim() || submitting}
            className="text-xs px-2 py-1 rounded text-white disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Create
          </button>
        </div>
      </form>
    </div>
  );
}
