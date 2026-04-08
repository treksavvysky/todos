import type { TaskWithDetails, ObjectiveWithCounts } from './types';
import {
  recommendNextMove,
  rankParkingCandidates,
  buildEngineContext,
  type Recommendation,
  type ParkingSuggestion,
} from './recommendation-engine';

export type FrontHeat = 'hot' | 'ready';

// Re-exported for backwards compatibility with existing imports.
// Scoring lives in recommendation-engine.ts now.
export type ScoredMove = Recommendation<TaskWithDetails>;
export type ParkingMove = ParkingSuggestion<TaskWithDetails>;

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
  coolingCount: number;
}

export interface NowSnapshot {
  recommendedMove: ScoredMove | null;
  activeFronts: ActiveFront[];
  openDecisions: TaskWithDetails[];
  parkingSuggestions: ParkingMove[];
  blockers: TaskWithDetails[];
  waiting: TaskWithDetails[];
  pulse: NowPulse;
}

/**
 * Defensive normalizer: only items with status === 'ready' are eligible
 * for the recommendation engine. Re-exported for any external callers.
 */
export function normalizeReady(tasks: TaskWithDetails[]): TaskWithDetails[] {
  return tasks.filter((t) => t.status === 'ready');
}

// ---- Snapshot builder ----

export function buildNowSnapshot(
  tasks: TaskWithDetails[],
  objectives: ObjectiveWithCounts[]
): NowSnapshot {
  // Compute front membership for the active-fronts UI section
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
  activeFronts.sort((a, b) => {
    if (a.heat === b.heat) return a.objective.title.localeCompare(b.objective.title);
    return a.heat === 'hot' ? -1 : 1;
  });

  // Recommendation comes from the engine — single source of truth
  const recommendedMove = recommendNextMove(tasks);

  // Parking pressure: cooling candidates that should leave the active field.
  // Reuses the engine's shared EngineContext shape (hot fronts, live siblings)
  // to protect items that belong to momentum and surface the ones that don't.
  const parkingCtx = buildEngineContext(tasks);
  const parkingSuggestions = rankParkingCandidates(tasks, parkingCtx);

  // Open decisions: ready decisions, bound first
  const readyCandidates = normalizeReady(tasks);
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
    coolingCount: parkingSuggestions.length,
  };

  return {
    recommendedMove,
    activeFronts,
    openDecisions,
    parkingSuggestions,
    blockers,
    waiting,
    pulse,
  };
}
