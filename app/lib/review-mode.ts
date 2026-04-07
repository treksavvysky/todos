import type { TaskWithDetails, TaskStatus, TaskPriority } from './types';

// ---- Bucket taxonomy ----

export type BucketKey =
  | 'stale'
  | 'long_blocked'
  | 'stuck_active'
  | 'orphaned'
  | 'empty_initiative'
  | 'vague_title'
  | 'priority_inflation'
  | 'aging_high_priority';

export type BucketCategory = 'drift' | 'fragmentation' | 'ambiguity' | 'false_urgency';

export interface ReviewBucket {
  key: BucketKey;
  category: BucketCategory;
  title: string;
  description: string;
  items: TaskWithDetails[];
}

export interface ReviewSnapshot {
  buckets: ReviewBucket[];
  totalFlagged: number;
  perCategoryCount: Record<BucketCategory, number>;
}

// ---- Default thresholds ----

export const DEFAULT_THRESHOLDS = {
  staleDays: 14,
  longBlockedDays: 7,
  stuckActiveDays: 5,
  agingHighPriorityDays: 14,
  urgentInflationLimit: 5,
  vagueTitleMinWords: 3,
};

export type ReviewThresholds = typeof DEFAULT_THRESHOLDS;

// ---- Helpers ----

const VAGUE_TITLE_PATTERN = /^(todo|fix|follow up|stuff|things?|misc)$/i;
const TERMINAL_STATUSES: TaskStatus[] = ['done', 'parked'];

function daysBetween(now: Date, iso: string): number {
  const ms = now.getTime() - new Date(iso).getTime();
  return ms / (1000 * 60 * 60 * 24);
}

function isTerminal(status: TaskStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

// ---- Snapshot builder ----

export function buildReviewSnapshot(
  tasks: TaskWithDetails[],
  thresholds: Partial<ReviewThresholds> = {},
  now: Date = new Date()
): ReviewSnapshot {
  const t = { ...DEFAULT_THRESHOLDS, ...thresholds };

  // Pre-compute parent → children map for empty_initiative
  const childrenByParent = new Map<string, TaskWithDetails[]>();
  for (const task of tasks) {
    if (task.parentItemId) {
      const list = childrenByParent.get(task.parentItemId) ?? [];
      list.push(task);
      childrenByParent.set(task.parentItemId, list);
    }
  }

  // ---- Drift ----

  const stale: TaskWithDetails[] = [];
  const longBlocked: TaskWithDetails[] = [];
  const stuckActive: TaskWithDetails[] = [];

  for (const task of tasks) {
    if (isTerminal(task.status)) continue;
    const ageDays = daysBetween(now, task.updatedAt);

    if (
      (task.status === 'ready' || task.status === 'blocked' || task.status === 'waiting') &&
      ageDays >= t.staleDays
    ) {
      stale.push(task);
    }

    if (
      (task.status === 'blocked' || task.status === 'waiting') &&
      ageDays >= t.longBlockedDays
    ) {
      longBlocked.push(task);
    }

    if (task.status === 'active' && ageDays >= t.stuckActiveDays) {
      stuckActive.push(task);
    }
  }

  // ---- Fragmentation ----

  const orphaned: TaskWithDetails[] = [];
  const emptyInitiative: TaskWithDetails[] = [];

  for (const task of tasks) {
    if (isTerminal(task.status)) continue;

    if (task.objectiveId === null && task.parentItemId === null) {
      orphaned.push(task);
    }

    if (
      (task.itemType === 'initiative' || task.itemType === 'maintenance') &&
      !childrenByParent.has(task.id)
    ) {
      emptyInitiative.push(task);
    }
  }

  // ---- Ambiguity ----

  const vagueTitle: TaskWithDetails[] = [];
  for (const task of tasks) {
    if (isTerminal(task.status)) continue;
    const trimmed = task.title.trim();
    if (wordCount(trimmed) < t.vagueTitleMinWords || VAGUE_TITLE_PATTERN.test(trimmed)) {
      vagueTitle.push(task);
    }
  }

  // ---- False urgency ----

  // Priority inflation: count urgent ready+active items; if > limit, flag all
  const urgentLive = tasks.filter(
    (task) => task.priority === 'urgent' && (task.status === 'ready' || task.status === 'active')
  );
  const priorityInflation = urgentLive.length > t.urgentInflationLimit ? urgentLive : [];

  // Aging high-priority: urgent/high + ready + createdAt > N days
  const agingHighPriority: TaskWithDetails[] = [];
  for (const task of tasks) {
    if (task.status !== 'ready') continue;
    if (task.priority !== 'urgent' && task.priority !== 'high') continue;
    if (daysBetween(now, task.createdAt) >= t.agingHighPriorityDays) {
      agingHighPriority.push(task);
    }
  }

  // ---- Assemble buckets ----

  const allBuckets: ReviewBucket[] = [
    {
      key: 'stale',
      category: 'drift',
      title: 'Stale items',
      description: `Not touched in ${t.staleDays}+ days. Either revive, park, or close them out.`,
      items: stale,
    },
    {
      key: 'long_blocked',
      category: 'drift',
      title: 'Long-blocked / waiting',
      description: `Blocked or waiting for ${t.longBlockedDays}+ days. The dependency may have changed — re-evaluate.`,
      items: longBlocked,
    },
    {
      key: 'stuck_active',
      category: 'drift',
      title: 'Stuck in active',
      description: `Marked active but untouched for ${t.stuckActiveDays}+ days. Either you're not really working on it, or it stalled.`,
      items: stuckActive,
    },
    {
      key: 'orphaned',
      category: 'fragmentation',
      title: 'Orphaned items',
      description: 'No objective and no parent. Anchor them to a mission, parking lot, or initiative.',
      items: orphaned,
    },
    {
      key: 'empty_initiative',
      category: 'fragmentation',
      title: 'Empty initiatives',
      description: 'Initiatives or maintenance streams with no children bound to them. Decompose or park.',
      items: emptyInitiative,
    },
    {
      key: 'vague_title',
      category: 'ambiguity',
      title: 'Vague titles',
      description: 'Titles that are too short or generic to act on. Clarify what the item actually means.',
      items: vagueTitle,
    },
    {
      key: 'priority_inflation',
      category: 'false_urgency',
      title: 'Priority inflation',
      description: `More than ${t.urgentInflationLimit} urgent items live at once. If everything is urgent, nothing is.`,
      items: priorityInflation,
    },
    {
      key: 'aging_high_priority',
      category: 'false_urgency',
      title: 'Aging high-priority items',
      description: `Tagged urgent or high but sitting ready for ${t.agingHighPriorityDays}+ days. The urgency has expired or was never real.`,
      items: agingHighPriority,
    },
  ];

  // Filter to non-empty buckets
  const buckets = allBuckets.filter((b) => b.items.length > 0);

  // Unique flagged tasks across all buckets
  const flaggedIds = new Set<string>();
  const perCategoryCount: Record<BucketCategory, number> = {
    drift: 0,
    fragmentation: 0,
    ambiguity: 0,
    false_urgency: 0,
  };

  for (const bucket of buckets) {
    for (const item of bucket.items) {
      flaggedIds.add(item.id);
    }
    perCategoryCount[bucket.category] += bucket.items.length;
  }

  return {
    buckets,
    totalFlagged: flaggedIds.size,
    perCategoryCount,
  };
}

// ---- Quick action helpers ----

const PRIORITY_LADDER: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

/**
 * Returns the next-lower priority, or null if already at the bottom.
 */
export function lowerPriority(p: TaskPriority): TaskPriority | null {
  const idx = PRIORITY_LADDER.indexOf(p);
  if (idx <= 0) return null;
  return PRIORITY_LADDER[idx - 1];
}
