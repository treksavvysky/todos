'use client';

import { useState, useEffect } from 'react';
import { useApp } from '../AppProvider';
import { parseTaskIntent } from '@/app/lib/intent-parser';
import Modal from '../ui/Modal';
import TaskPriorityBadge from './TaskPriorityBadge';
import LabelBadge from '../labels/LabelBadge';

interface QuickAddProps {
  onClose: () => void;
}

export default function QuickAdd({ onClose }: QuickAddProps) {
  const { state, actions } = useApp();
  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState<ReturnType<typeof parseTaskIntent> | null>(null);

  useEffect(() => {
    if (input.trim()) {
      setParsed(parseTaskIntent(input, state.labels));
    } else {
      setParsed(null);
    }
  }, [input, state.labels]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsed || !input.trim()) return;

    try {
      await actions.createTask(parsed.task);
      onClose();
    } catch (err) {
      console.error('Quick add failed', err);
    }
  };

  return (
    <Modal title="Brain-Dump (Quick Add)" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <input
            autoFocus
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. Call mom tomorrow high priority Personal"
            className="w-full px-4 py-3 text-lg border rounded-lg outline-none focus:ring-2 focus:ring-indigo-400"
            style={{
              background: 'var(--color-bg)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text)',
            }}
          />
          <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
            Type naturally. We'll extract dates, priority, and labels automatically.
          </p>
        </div>

        {parsed && (
          <div 
            className="p-4 rounded-lg border flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200"
            style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                Intent Preview
              </span>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                {(parsed.confidence * 100).toFixed(0)}% Match
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <h4 className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{parsed.task.title}</h4>
              <div className="flex items-center gap-2 flex-wrap">
                <TaskPriorityBadge priority={parsed.task.priority!} />
                {parsed.task.dueDate && (
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                    📅 {parsed.task.dueDate}
                  </span>
                )}
                {parsed.task.labelIds?.map(id => {
                  const label = state.labels.find(l => l.id === id);
                  return label ? <LabelBadge key={id} label={label} /> : null;
                })}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
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
            disabled={!input.trim()}
            className="px-6 py-2 text-sm font-medium rounded-md text-white disabled:opacity-50 transition-all shadow-sm"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Create Task
          </button>
        </div>
      </form>
    </Modal>
  );
}
