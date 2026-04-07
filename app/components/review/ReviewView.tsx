'use client';

import { useMemo, useState } from 'react';
import { useApp } from '../AppProvider';
import ItemTypeBadge from '../tasks/ItemTypeBadge';
import TaskStatusBadge from '../tasks/TaskStatusBadge';
import TaskPriorityBadge from '../tasks/TaskPriorityBadge';
import {
  buildReviewSnapshot,
  lowerPriority,
  type BucketCategory,
  type BucketKey,
  type ReviewBucket,
  type ReviewSnapshot,
} from '@/app/lib/review-mode';
import type { TaskWithDetails, TaskUpdateInput } from '@/app/lib/types';

const CATEGORY_LABELS: Record<BucketCategory, string> = {
  drift: 'Drift',
  fragmentation: 'Fragmentation',
  ambiguity: 'Ambiguity',
  false_urgency: 'False urgency',
};

const CATEGORY_DESCRIPTIONS: Record<BucketCategory, string> = {
  drift: 'Backlog gets old',
  fragmentation: 'Backlog gets unstructured',
  ambiguity: 'Backlog gets fuzzy',
  false_urgency: 'Backlog gets inflated',
};

const CATEGORY_ORDER: BucketCategory[] = ['drift', 'fragmentation', 'ambiguity', 'false_urgency'];

export default function ReviewView() {
  const { state, dispatch, actions } = useApp();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const snapshot = useMemo<ReviewSnapshot>(
    () => buildReviewSnapshot(state.tasks),
    [state.tasks]
  );

  // Apply session dismissals
  const visibleSnapshot = useMemo<ReviewSnapshot>(() => {
    if (dismissedIds.size === 0) return snapshot;
    const buckets = snapshot.buckets
      .map((b) => ({ ...b, items: b.items.filter((i) => !dismissedIds.has(i.id)) }))
      .filter((b) => b.items.length > 0);
    const flaggedIds = new Set<string>();
    const perCategoryCount: Record<BucketCategory, number> = {
      drift: 0,
      fragmentation: 0,
      ambiguity: 0,
      false_urgency: 0,
    };
    for (const b of buckets) {
      for (const i of b.items) flaggedIds.add(i.id);
      perCategoryCount[b.category] += b.items.length;
    }
    return { buckets, totalFlagged: flaggedIds.size, perCategoryCount };
  }, [snapshot, dismissedIds]);

  const dismissItem = (id: string) => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const bucketsByCategory = (cat: BucketCategory): ReviewBucket[] =>
    visibleSnapshot.buckets.filter((b) => b.category === cat);

  if (visibleSnapshot.totalFlagged === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        <ReviewPulse snapshot={visibleSnapshot} />
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
      <ReviewPulse snapshot={visibleSnapshot} />

      {CATEGORY_ORDER.map((cat) => {
        const buckets = bucketsByCategory(cat);
        if (buckets.length === 0) return null;
        return (
          <section key={cat}>
            <div className="mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text)' }}>
                {CATEGORY_LABELS[cat]}
              </h2>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {CATEGORY_DESCRIPTIONS[cat]}
              </p>
            </div>
            <div className="flex flex-col gap-4">
              {buckets.map((bucket) => (
                <BucketCard
                  key={bucket.key}
                  bucket={bucket}
                  onUpdateTask={actions.updateTask}
                  onBulkUpdate={actions.bulkUpdateTasks}
                  onOpen={(id) => dispatch({ type: 'SELECT_TASK', payload: id })}
                  onDismiss={dismissItem}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

// ---- Pulse strip ----

function ReviewPulse({ snapshot }: { snapshot: ReviewSnapshot }) {
  return (
    <div className="text-xs font-medium tracking-wider uppercase flex items-center gap-3 flex-wrap" style={{ color: 'var(--color-text-muted)' }}>
      <span>
        <strong style={{ color: 'var(--color-text)' }}>{snapshot.totalFlagged}</strong> flagged
      </span>
      <span>·</span>
      <span><strong style={{ color: 'var(--color-text)' }}>{snapshot.perCategoryCount.drift}</strong> drift</span>
      <span>·</span>
      <span><strong style={{ color: 'var(--color-text)' }}>{snapshot.perCategoryCount.fragmentation}</strong> fragmentation</span>
      <span>·</span>
      <span><strong style={{ color: 'var(--color-text)' }}>{snapshot.perCategoryCount.ambiguity}</strong> ambiguity</span>
      <span>·</span>
      <span><strong style={{ color: 'var(--color-text)' }}>{snapshot.perCategoryCount.false_urgency}</strong> false urgency</span>
    </div>
  );
}

// ---- Bulk action descriptors ----

interface BulkActionDescriptor {
  label: string;
  patch: TaskUpdateInput;
}

function getBulkActions(bucketKey: BucketKey): BulkActionDescriptor[] {
  switch (bucketKey) {
    case 'stale':
      return [{ label: 'Park all', patch: { status: 'parked' } }];
    case 'long_blocked':
      return [
        { label: 'Move all to waiting', patch: { status: 'waiting' } },
        { label: 'Park all', patch: { status: 'parked' } },
      ];
    case 'stuck_active':
      return [{ label: 'Move all back to ready', patch: { status: 'ready' } }];
    case 'orphaned':
      return []; // requires bind picker — handled inline below
    case 'empty_initiative':
      return [{ label: 'Park all', patch: { status: 'parked' } }];
    case 'vague_title':
      return []; // per-item only
    case 'priority_inflation':
      return [{ label: 'Lower all urgent → high', patch: { priority: 'high' } }];
    case 'aging_high_priority':
      return [{ label: 'Lower all to medium', patch: { priority: 'medium' } }];
  }
}

// ---- Bucket card ----

function BucketCard({
  bucket,
  onUpdateTask,
  onBulkUpdate,
  onOpen,
  onDismiss,
}: {
  bucket: ReviewBucket;
  onUpdateTask: (id: string, input: TaskUpdateInput) => Promise<TaskWithDetails>;
  onBulkUpdate: (ids: string[], input: TaskUpdateInput) => Promise<void>;
  onOpen: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const { state } = useApp();
  const [showBindAll, setShowBindAll] = useState(false);
  const bulkActions = getBulkActions(bucket.key);

  const handleBulk = async (patch: TaskUpdateInput) => {
    const ids = bucket.items.map((t) => t.id);
    if (ids.length === 0) return;
    await onBulkUpdate(ids, patch);
  };

  const handleBulkBind = async (objectiveId: string) => {
    const ids = bucket.items.map((t) => t.id);
    if (ids.length === 0) return;
    await onBulkUpdate(ids, { objectiveId });
    setShowBindAll(false);
  };

  return (
    <div className="rounded-lg border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
      {/* Bucket header */}
      <div className="flex items-start justify-between gap-3 p-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{bucket.title}</h3>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-600">
              {bucket.items.length}
            </span>
          </div>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {bucket.description}
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {bulkActions.map((action) => (
            <button
              key={action.label}
              onClick={() => handleBulk(action.patch)}
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border hover:opacity-80"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            >
              {action.label}
            </button>
          ))}
          {bucket.key === 'orphaned' && state.objectives.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowBindAll((p) => !p)}
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border hover:opacity-80"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                Bind all to…
              </button>
              {showBindAll && (
                <div
                  className="absolute right-0 top-full mt-1 z-20 rounded-md border shadow-md min-w-[200px]"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
                >
                  {state.objectives.map((obj) => (
                    <button
                      key={obj.id}
                      onClick={() => handleBulkBind(obj.id)}
                      className="w-full text-left text-xs px-3 py-1.5 hover:opacity-80"
                      style={{ color: 'var(--color-text)' }}
                    >
                      {obj.objectiveType === 'mission' ? '🎯' : '🅿️'} {obj.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="flex flex-col">
        {bucket.items.map((task) => (
          <ReviewItemRow
            key={task.id}
            task={task}
            onUpdate={onUpdateTask}
            onOpen={onOpen}
            onDismiss={onDismiss}
          />
        ))}
      </div>
    </div>
  );
}

// ---- Item row ----

function ReviewItemRow({
  task,
  onUpdate,
  onOpen,
  onDismiss,
}: {
  task: TaskWithDetails;
  onUpdate: (id: string, input: TaskUpdateInput) => Promise<TaskWithDetails>;
  onOpen: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const { state } = useApp();
  const [showBind, setShowBind] = useState(false);

  const newPriority = lowerPriority(task.priority);

  return (
    <div className="flex items-center gap-3 px-3 py-2 border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
      <div className="flex-1 min-w-0">
        <div className="text-sm truncate" style={{ color: 'var(--color-text)' }}>{task.title}</div>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <ItemTypeBadge itemType={task.itemType} />
          <TaskStatusBadge status={task.status} />
          <TaskPriorityBadge priority={task.priority} />
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onUpdate(task.id, { status: 'parked' })}
          title="Park"
          className="text-[10px] font-bold px-1.5 py-1 rounded hover:bg-black/5"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          ⏸️ Park
        </button>
        <button
          onClick={() => onUpdate(task.id, { status: 'done' })}
          title="Mark done"
          className="text-[10px] font-bold px-1.5 py-1 rounded hover:bg-black/5"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          ✅ Done
        </button>
        {newPriority && (
          <button
            onClick={() => onUpdate(task.id, { priority: newPriority })}
            title={`Lower priority to ${newPriority}`}
            className="text-[10px] font-bold px-1.5 py-1 rounded hover:bg-black/5"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            ↓ {newPriority}
          </button>
        )}
        {state.objectives.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowBind((p) => !p)}
              title="Bind to objective"
              className="text-[10px] font-bold px-1.5 py-1 rounded hover:bg-black/5"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              🔗 Bind
            </button>
            {showBind && (
              <div
                className="absolute right-0 top-full mt-1 z-20 rounded-md border shadow-md min-w-[200px]"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
              >
                {state.objectives.map((obj) => (
                  <button
                    key={obj.id}
                    onClick={async () => {
                      await onUpdate(task.id, { objectiveId: obj.id });
                      setShowBind(false);
                    }}
                    className="w-full text-left text-xs px-3 py-1.5 hover:opacity-80"
                    style={{ color: 'var(--color-text)' }}
                  >
                    {obj.objectiveType === 'mission' ? '🎯' : '🅿️'} {obj.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <button
          onClick={() => onOpen(task.id)}
          title="Open details"
          className="text-[10px] font-bold px-1.5 py-1 rounded hover:bg-black/5"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Open
        </button>
        <button
          onClick={() => onDismiss(task.id)}
          title="Dismiss for this session"
          className="text-[10px] font-bold px-1.5 py-1 rounded hover:bg-black/5"
          style={{ color: 'var(--color-text-muted)' }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ---- Empty state ----

function EmptyState() {
  return (
    <div
      className="rounded-xl border border-dashed p-8 text-center flex flex-col items-center gap-3"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
    >
      <div className="text-4xl">🌿</div>
      <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
        Backlog is clean
      </h2>
      <p className="text-sm max-w-md" style={{ color: 'var(--color-text-muted)' }}>
        Nothing flagged for pruning. No drift, fragmentation, ambiguity, or inflated urgency.
        Come back here whenever the pulse starts to slip.
      </p>
    </div>
  );
}
