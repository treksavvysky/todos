'use client';

import { useState } from 'react';
import { useApp } from '../AppProvider';
import TaskStatusBadge from './TaskStatusBadge';
import TaskPriorityBadge from './TaskPriorityBadge';
import LabelSelector from '../labels/LabelSelector';
import CommentList from '../comments/CommentList';
import CommentForm from '../comments/CommentForm';
import ConfirmDialog from '../ui/ConfirmDialog';
import type { TaskStatus, TaskPriority } from '@/app/lib/types';

export default function TaskDetail() {
  const { state, dispatch, actions } = useApp();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const task = state.tasks.find((t) => t.id === state.selectedTaskId) ?? null;

  if (!task) {
    return (
      <aside
        className="w-[360px] shrink-0 border-l flex flex-col items-center justify-center p-8 text-center"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
      >
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 text-2xl">
          🎯
        </div>
        <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
          No Task Selected
        </h3>
        <p className="text-xs leading-relaxed mb-6" style={{ color: 'var(--color-text-secondary)' }}>
          Select a task from the list to view its details, add comments, or manage labels.
        </p>
        
        <div className="w-full space-y-3 text-left">
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
            Quick Tips & Shortcuts
          </p>
          <ul className="text-xs space-y-2" style={{ color: 'var(--color-text-secondary)' }}>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span><strong>Right-click</strong> sidebar labels to edit or delete.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Press <kbd className="border px-1 rounded bg-slate-50">n</kbd> for a <strong>New Task</strong>.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Press <kbd className="border px-1 rounded bg-slate-50">s</kbd> to <strong>Search</strong>.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Use <kbd className="border px-1 rounded bg-slate-50">↑</kbd><kbd className="border px-1 rounded bg-slate-50">↓</kbd> to <strong>Navigate</strong> tasks.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Press <kbd className="border px-1 rounded bg-slate-50">Esc</kbd> to <strong>Deselect</strong> or close.</span>
            </li>
          </ul>
        </div>
      </aside>
    );
  }

  const handleFieldChange = async (field: string, value: string | null) => {
    await actions.updateTask(task.id, { [field]: value });
  };

  const handleDelete = async () => {
    await actions.deleteTask(task.id);
    setConfirmDelete(false);
  };

  const handleAddComment = async (content: string) => {
    await actions.addComment(task.id, content);
  };

  return (
    <aside
      className="w-[360px] shrink-0 border-l overflow-y-auto flex flex-col"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Task Detail</h2>
        <button
          onClick={() => dispatch({ type: 'SELECT_TASK', payload: null })}
          className="text-lg leading-none hover:opacity-70"
          style={{ color: 'var(--color-text-muted)' }}
        >
          &times;
        </button>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-4">
        {/* Title */}
        <EditableField
          value={task.title}
          onSave={(v) => handleFieldChange('title', v)}
          inputType="text"
          label="Title"
        />

        {/* Description */}
        <EditableField
          value={task.description}
          onSave={(v) => handleFieldChange('description', v)}
          inputType="textarea"
          label="Description"
          placeholder="Add a description..."
        />

        {/* Status */}
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>Status</label>
          <div className="flex gap-1.5">
            {(['pending', 'in_progress', 'completed'] as TaskStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => handleFieldChange('status', s)}
                className={task.status === s ? 'opacity-100' : 'opacity-40 hover:opacity-70'}
              >
                <TaskStatusBadge status={s} />
              </button>
            ))}
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>Priority</label>
          <div className="flex gap-2">
            {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map((p) => (
              <button
                key={p}
                onClick={() => handleFieldChange('priority', p)}
                className={`transition-opacity ${task.priority === p ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
              >
                <TaskPriorityBadge priority={p} />
              </button>
            ))}
          </div>
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>Due Date</label>
          <input
            type="date"
            value={task.dueDate || ''}
            onChange={(e) => handleFieldChange('dueDate', e.target.value || null)}
            className="px-2 py-1 text-sm border rounded outline-none"
            style={{
              background: 'var(--color-bg)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text)',
            }}
          />
        </div>

        {/* Labels */}
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
            Scopes & Projects
          </label>
          <LabelSelector selectedLabels={task.labels} taskId={task.id} />
        </div>

        {/* Comments */}
        <div className="border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
            Comments ({task.comments.length})
          </label>
          <div className="flex flex-col gap-3">
            <CommentList comments={task.comments} />
            <CommentForm onSubmit={handleAddComment} />
          </div>
        </div>

        {/* Delete */}
        <div className="border-t pt-4 mt-auto" style={{ borderColor: 'var(--color-border)' }}>
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-xs text-red-500 hover:text-red-600"
          >
            Delete this task
          </button>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete Task"
          message={`Are you sure you want to delete "${task.title}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </aside>
  );
}

// ---- Inline editable field ----

function EditableField({
  value,
  onSave,
  inputType,
  label,
  placeholder,
}: {
  value: string;
  onSave: (value: string) => Promise<void>;
  inputType: 'text' | 'textarea';
  label: string;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const handleBlur = async () => {
    setEditing(false);
    if (draft !== value) {
      await onSave(draft);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputType === 'text') {
      (e.target as HTMLElement).blur();
    }
    if (e.key === 'Escape') {
      setDraft(value);
      setEditing(false);
    }
  };

  const style = {
    background: 'var(--color-bg)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-text)',
  };

  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </label>
      {editing ? (
        inputType === 'textarea' ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            rows={3}
            className="w-full px-2 py-1 text-sm border rounded outline-none resize-none"
            style={style}
            autoFocus
          />
        ) : (
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full px-2 py-1 text-sm border rounded outline-none"
            style={style}
            autoFocus
          />
        )
      ) : (
        <div
          onClick={() => { setDraft(value); setEditing(true); }}
          className="cursor-pointer px-2 py-1 rounded hover:opacity-80 min-h-[28px]"
          style={{ background: 'var(--color-bg-secondary)' }}
        >
          {value ? (
            <span className="text-sm" style={{ color: 'var(--color-text)' }}>{value}</span>
          ) : (
            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{placeholder || 'Click to edit'}</span>
          )}
        </div>
      )}
    </div>
  );
}
