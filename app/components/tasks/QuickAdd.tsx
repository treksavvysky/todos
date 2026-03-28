'use client';

import { useState, useEffect } from 'react';
import { useApp } from '../AppProvider';
import { parseTaskIntent } from '@/app/lib/intent-parser';
import { parseIntentAI } from '@/app/lib/api-client';
import { useDebounce } from '@/app/lib/useDebounce';
import Modal from '../ui/Modal';
import TaskPriorityBadge from './TaskPriorityBadge';
import LabelBadge from '../labels/LabelBadge';
import type { TaskCreateInput } from '@/app/lib/types';

interface QuickAddProps {
  onClose: () => void;
}

export default function QuickAdd({ onClose }: QuickAddProps) {
  const { state, actions } = useApp();
  const [input, setInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiTasks, setAiTasks] = useState<TaskCreateInput[]>([]);
  const [heuristicResult, setHeuristicResult] = useState<ReturnType<typeof parseTaskIntent> | null>(null);
  
  const debouncedInput = useDebounce(input, 800);

  // Heuristic parsing (Instant)
  useEffect(() => {
    if (input.trim()) {
      setHeuristicResult(parseTaskIntent(input, state.labels));
    } else {
      setHeuristicResult(null);
      setAiTasks([]);
    }
  }, [input, state.labels]);

  // AI parsing (Debounced)
  useEffect(() => {
    const runAiParse = async () => {
      if (!debouncedInput.trim() || debouncedInput.length < 5) return;
      
      setIsAiLoading(true);
      try {
        const { tasks } = await parseIntentAI(debouncedInput, state.labels);
        setAiTasks(tasks);
      } catch (err) {
        console.error('AI parsing failed', err);
      } finally {
        setIsAiLoading(false);
      }
    };

    runAiParse();
  }, [debouncedInput, state.labels]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prefer AI tasks if available, otherwise fallback to heuristic
    const tasksToCreate = aiTasks.length > 0 
      ? aiTasks 
      : heuristicResult 
        ? [heuristicResult.task] 
        : [];

    if (tasksToCreate.length === 0) return;

    try {
      await Promise.all(tasksToCreate.map(t => actions.createTask(t)));
      onClose();
    } catch (err) {
      console.error('Quick add failed', err);
    }
  };

  const tasksPreview = aiTasks.length > 0 ? aiTasks : heuristicResult ? [heuristicResult.task] : [];

  return (
    <Modal title="Brain-Dump (AI Quick Add)" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="relative">
            <input
              autoFocus
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. Need to buy eggs tomorrow and call mom ASAP"
              className="w-full px-4 py-3 text-lg border rounded-lg outline-none focus:ring-2 focus:ring-indigo-400"
              style={{
                background: 'var(--color-bg)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            />
            {isAiLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <span className="text-[10px] font-medium text-indigo-500 animate-pulse">AI is thinking...</span>
              </div>
            )}
          </div>
          <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
            Type naturally. AI will extract multiple tasks, dates, priorities, and labels.
          </p>
        </div>

        {tasksPreview.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-1" style={{ color: 'var(--color-text-muted)' }}>
              {aiTasks.length > 0 ? `AI Extracted ${aiTasks.length} Task${aiTasks.length > 1 ? 's' : ''}` : 'Heuristic Preview'}
            </span>
            <div 
              className="max-h-60 overflow-y-auto rounded-lg border p-2 flex flex-col gap-2"
              style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
            >
              {tasksPreview.map((task, idx) => (
                <div 
                  key={idx}
                  className="p-3 rounded-md border shadow-sm flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-200"
                  style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                >
                  <h4 className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{task.title}</h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    <TaskPriorityBadge priority={task.priority || 'medium'} />
                    {task.dueDate && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100 flex items-center gap-1">
                        📅 {task.dueDate}
                      </span>
                    )}
                    {task.labelIds?.map(id => {
                      const label = state.labels.find(l => l.id === id);
                      return label ? <LabelBadge key={id} label={label} /> : null;
                    })}
                  </div>
                </div>
              ))}
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
            disabled={!input.trim() || isAiLoading}
            className="px-6 py-2 text-sm font-medium rounded-md text-white disabled:opacity-50 transition-all shadow-sm"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {aiTasks.length > 1 ? `Create ${aiTasks.length} Tasks` : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
