'use client';

import { useMemo, useState } from 'react';
import { useApp } from '../AppProvider';
import Modal from '../ui/Modal';
import { ITEM_TYPE_OPTIONS } from './ItemTypeBadge';
import type { TaskPriority, ItemType } from '@/app/lib/types';

interface TaskFormProps {
  onClose: () => void;
}

export default function TaskForm({ onClose }: TaskFormProps) {
  const { state, actions } = useApp();

  // Binding pressure: default to the first mission so new work is anchored by
  // default. Missions are preferred over parking lots because missions pull;
  // parking lots hold. If no missions exist, fall back to the first objective
  // of any kind, then to empty (which will show the orphan warning).
  const defaultObjectiveId = useMemo(() => {
    const firstMission = state.objectives.find((o) => o.objectiveType === 'mission');
    if (firstMission) return firstMission.id;
    return state.objectives[0]?.id ?? '';
  }, [state.objectives]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [itemType, setItemType] = useState<ItemType>('action');
  const [objectiveId, setObjectiveId] = useState(defaultObjectiveId);
  const [parentItemId, setParentItemId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const toggleLabel = (id: string) => {
    setSelectedLabelIds((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      await actions.createTask({
        title: title.trim(),
        description: description.trim(),
        priority,
        itemType,
        objectiveId: objectiveId || undefined,
        parentItemId: parentItemId || undefined,
        dueDate: dueDate || undefined,
        labelIds: selectedLabelIds,
      });
      onClose();
    } catch {
      // Error handled by AppProvider
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    background: 'var(--color-bg)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-text)',
  };

  return (
    <Modal title="New Task" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-md outline-none focus:ring-2 focus:ring-indigo-400"
            style={inputStyle}
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-sm border rounded-md outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            style={inputStyle}
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full px-3 py-2 text-sm border rounded-md outline-none"
              style={inputStyle}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-md outline-none"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Item Type */}
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            Item Type
          </label>
          <div className="flex flex-wrap gap-2">
            {ITEM_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setItemType(opt.value)}
                className="text-xs px-2.5 py-1 rounded-full border transition-colors"
                style={{
                  borderColor: itemType === opt.value ? 'var(--color-primary)' : 'var(--color-border)',
                  backgroundColor: itemType === opt.value ? 'var(--color-primary)' : 'transparent',
                  color: itemType === opt.value ? '#ffffff' : 'var(--color-text-secondary)',
                }}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Objective + Parent binding */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Objective
            </label>
            <select
              value={objectiveId}
              onChange={(e) => setObjectiveId(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-md outline-none"
              style={{
                ...inputStyle,
                borderColor: objectiveId === '' && !parentItemId
                  ? 'var(--color-warning, #d97706)'
                  : inputStyle.borderColor,
              }}
            >
              <option value="">⚠ Unbound (provisional)</option>
              {state.objectives.map((obj) => (
                <option key={obj.id} value={obj.id}>
                  {obj.objectiveType === 'mission' ? '🎯' : '🅿️'} {obj.title}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Parent Item
            </label>
            <select
              value={parentItemId}
              onChange={(e) => setParentItemId(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-md outline-none"
              style={inputStyle}
            >
              <option value="">None</option>
              {state.tasks
                .filter((t) => t.itemType === 'initiative' || t.itemType === 'maintenance')
                .map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))
              }
            </select>
          </div>
        </div>

        {/* Weak-signal warning for unbound creation */}
        {!objectiveId && !parentItemId && (
          <div
            className="text-[11px] px-3 py-2 rounded-md border flex items-start gap-2"
            style={{
              borderColor: 'var(--color-warning, #d97706)',
              color: 'var(--color-warning, #d97706)',
              background: 'rgba(217, 119, 6, 0.06)',
            }}
          >
            <span className="leading-tight">⚠</span>
            <span className="leading-tight">
              This item will be created <strong>unbound</strong>. Unbound work is provisional — it
              drifts more easily and gets flagged in Review Mode. Consider anchoring it to an
              objective or parent item.
            </span>
          </div>
        )}

        {/* Label selector */}
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            Scopes & Projects
          </label>
          <div className="flex flex-wrap gap-2">
            {state.labels.map((label) => {
              const isSelected = selectedLabelIds.includes(label.id);
              return (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => toggleLabel(label.id)}
                  className="text-xs px-2.5 py-1 rounded-full border transition-colors"
                  style={{
                    borderColor: label.color,
                    backgroundColor: isSelected ? label.color : 'transparent',
                    color: isSelected ? '#ffffff' : label.color,
                  }}
                >
                  {label.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm rounded-md border hover:opacity-80"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title.trim() || submitting}
            className="px-4 py-1.5 text-sm rounded-md text-white disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {submitting ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
