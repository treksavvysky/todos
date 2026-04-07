import type { TaskWithDetails, ObjectiveWithCounts, TaskPriority } from './types';

export type FrontHeat = 'hot' | 'ready';

export interface ScoredMove {
  task: TaskWithDetails;
  score: number;
  reasons: string[];
}

export interface ActiveFront {
  objective: ObjectiveWithCounts;
  heat: FrontHeat;
  activeItems: TaskWithDetails[];
  readyItems: TaskWithDetails[];
}

export interface NowPulse {
  readyCount: number;
  activeFrontCount: number;
  blockedCount: number;
  waitingCount: number;
}

export interface NowSnapshot {
  recommendedMove: ScoredMove | null;
  activeFronts: ActiveFront[];
  openDecisions: TaskWithDetails[];
  blockers: TaskWithDetails[];
  waiting: TaskWithDetails[];
  pulse: NowPulse;
}

// ---- Scoring constants ----

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  urgent: 40,
  high: 25,
  medium: 15,
  low: 5,
};

const HOT_FRONT_BOOST = 30;
const READY_FRONT_BOOST = 15;
const BOUND_BOOST = 10;
const DECISION_NUDGE = 12;
const STALENESS_BOOST = 5;
const STALENESS_DAYS = 7;

// ---- Helpers ----

/**
 * Defensive normalizer: only items with status === 'ready' are eligible.
 * Keeps the scoring function conceptually pure even if upstream data drifts.
 */
export function normalizeReady(tasks: TaskWithDetails[]): TaskWithDetails[] {
  return tasks.filter((t) => t.status === 'ready');
}

function isStale(createdAt: string): boolean {
  const created = new Date(createdAt).getTime();
  const ageMs = Date.now() - created;
  return ageMs > STALENESS_DAYS * 24 * 60 * 60 * 1000;
}

function priorityLabel(p: TaskPriority): string {
  return p.charAt(0).toUpperCase() + p.slice(1);
}

// ---- Scoring ----

export function scoreReadyItem(
  task: TaskWithDetails,
  context: {
    hotFrontObjectiveIds: Set<string>;
    readyFrontObjectiveIds: Set<string>;
  }
): ScoredMove {
  let score = 0;
  const reasons: string[] = [];

  // Priority (always present)
  const priorityScore = PRIORITY_WEIGHT[task.priority];
  score += priorityScore;
  if (task.priority === 'urgent' || task.priority === 'high') {
    reasons.push(priorityLabel(task.priority));
  }

  // Front alignment
  if (task.objectiveId && context.hotFrontObjectiveIds.has(task.objectiveId)) {
    score += HOT_FRONT_BOOST;
    reasons.push('Hot front');
  } else if (task.objectiveId && context.readyFrontObjectiveIds.has(task.objectiveId)) {
    score += READY_FRONT_BOOST;
    reasons.push('Ready front');
  }

  // Bound (objective or parent item)
  if (task.objectiveId || task.parentItemId) {
    score += BOUND_BOOST;
    if (!reasons.some((r) => r.includes('front'))) {
      reasons.push('Bound');
    }
  }

  // Decision nudge — modest, not sovereign
  if (task.itemType === 'decision') {
    score += DECISION_NUDGE;
    reasons.push('Decision');
  }

  // Staleness nudge
  if (isStale(task.createdAt)) {
    score += STALENESS_BOOST;
    reasons.push('Aging');
  }

  return { task, score, reasons };
}

// ---- Snapshot builder ----

export function buildNowSnapshot(
  tasks: TaskWithDetails[],
  objectives: ObjectiveWithCounts[]
): NowSnapshot {
  // Compute front membership
  const hotFrontObjectiveIds = new Set<string>();
  const readyFrontObjectiveIds = new Set<string>();

  for (const t of tasks) {
    if (!t.objectiveId) continue;
    if (t.status === 'active') hotFrontObjectiveIds.add(t.objectiveId);
    else if (t.status === 'ready') readyFrontObjectiveIds.add(t.objectiveId);
  }

  // Build active fronts (hot first, then ready-only)
  const activeFronts: ActiveFront[] = [];
  for (const obj of objectives) {
    const isHot = hotFrontObjectiveIds.has(obj.id);
    const isReady = readyFrontObjectiveIds.has(obj.id);
    if (!isHot && !isReady) continue;

    const objTasks = tasks.filter((t) => t.objectiveId === obj.id);
    activeFronts.push({
      objective: obj,
      heat: isHot ? 'hot' : 'ready',
      activeItems: objTasks.filter((t) => t.status === 'active'),
      readyItems: objTasks.filter((t) => t.status === 'ready'),
    });
  }
  // Hot first, then ready
  activeFronts.sort((a, b) => {
    if (a.heat === b.heat) return a.objective.title.localeCompare(b.objective.title);
    return a.heat === 'hot' ? -1 : 1;
  });

  // Score ready candidates
  const readyCandidates = normalizeReady(tasks);
  const scored = readyCandidates.map((t) =>
    scoreReadyItem(t, { hotFrontObjectiveIds, readyFrontObjectiveIds })
  );

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // Tie-breaker: oldest createdAt wins
    return new Date(a.task.createdAt).getTime() - new Date(b.task.createdAt).getTime();
  });

  const recommendedMove = scored[0] ?? null;

  // Open decisions: ready decisions, bound first
  const openDecisions = readyCandidates
    .filter((t) => t.itemType === 'decision')
    .sort((a, b) => {
      const aBound = a.objectiveId || a.parentItemId ? 0 : 1;
      const bBound = b.objectiveId || b.parentItemId ? 0 : 1;
      if (aBound !== bBound) return aBound - bBound;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

  const blockers = tasks.filter((t) => t.status === 'blocked');
  const waiting = tasks.filter((t) => t.status === 'waiting');

  const pulse: NowPulse = {
    readyCount: readyCandidates.length,
    activeFrontCount: activeFronts.length,
    blockedCount: blockers.length,
    waitingCount: waiting.length,
  };

  return {
    recommendedMove,
    activeFronts,
    openDecisions,
    blockers,
    waiting,
    pulse,
  };
}
