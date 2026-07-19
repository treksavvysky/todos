import type { TaskStatus, TaskPriority, ItemType, ObjectiveType, CampaignStatus } from './types';

// ---- Minimal operational shape ----

/**
 * The minimal task shape the engine consumes. Callers (NowView, MCP tool)
 * pass existing Task / TaskWithDetails objects — they satisfy this shape
 * structurally. Keeping the engine narrow prevents drift back into view logic.
 */
export interface EngineTask {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  itemType: ItemType;
  objectiveId: string | null;
  parentItemId: string | null;
  createdAt: string;
}

/**
 * The minimal objective shape the engine consumes for campaign deadline
 * pressure. Objective / ObjectiveWithCounts satisfy this structurally.
 */
export interface EngineObjective {
  id: string;
  objectiveType: ObjectiveType;
  targetDate: string | null;
  campaignStatus: CampaignStatus | null;
}

export interface ScoreFactor {
  key: string;
  label: string;
  points: number;
}

export interface Recommendation<T extends EngineTask = EngineTask> {
  task: T;
  score: number;
  factors: ScoreFactor[];
  narrative: string;
}

interface LiveCounts {
  ready: number;
  blocked: number;
  waiting: number;
  active: number;
}

export interface EngineContext {
  hotFrontObjectiveIds: Set<string>;
  readyFrontObjectiveIds: Set<string>;
  liveSiblingsByObjective: Map<string, LiveCounts>;
  liveSiblingsByParent: Map<string, LiveCounts>;
  stuckChildrenByParent: Map<string, number>;
  // objectiveId → target date for *active* campaigns only. Missions and
  // parking lots never appear here — deadline pressure is campaign-shaped.
  campaignTargetByObjective: Map<string, string>;
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
const DECISION_NUDGE = 8;
const STALENESS_BOOST = 5;
const STALENESS_DAYS = 7;

// Campaign deadline proximity — graduated boost as the target date nears.
// Missions never receive this: they have no "by when".
const CAMPAIGN_DEADLINE_TIERS: { maxDays: number; points: number }[] = [
  { maxDays: 3, points: 20 },
  { maxDays: 7, points: 15 },
  { maxDays: 14, points: 10 },
  { maxDays: 30, points: 5 },
];
const CAMPAIGN_OVERDUE_BOOST = 25;
// Items on a campaign this close to target are never suggested for parking.
const CAMPAIGN_PARK_SHIELD_DAYS = 14;

// Sibling weights for the decision unblock heuristic
const SIBLING_BLOCKED_WEIGHT = 3;
const SIBLING_WAITING_WEIGHT = 2;
const SIBLING_READY_WEIGHT = 1;
const SIBLING_ACTIVE_WEIGHT = 0;
const DECISION_UNBLOCK_CAP = 18;

// Parent unblock (per stuck child)
const PARENT_STUCK_CHILD_WEIGHT = 5;
const PARENT_UNBLOCK_CAP = 20;

// ---- Helpers ----

function emptyCounts(): LiveCounts {
  return { ready: 0, blocked: 0, waiting: 0, active: 0 };
}

function bumpCount(counts: LiveCounts, status: TaskStatus): void {
  if (status === 'ready') counts.ready += 1;
  else if (status === 'blocked') counts.blocked += 1;
  else if (status === 'waiting') counts.waiting += 1;
  else if (status === 'active') counts.active += 1;
  // 'done' and 'parked' are intentionally excluded — no leverage value
}

function daysUntil(dateISO: string): number {
  const target = new Date(dateISO).getTime();
  return Math.ceil((target - Date.now()) / (24 * 60 * 60 * 1000));
}

function campaignDeadlineFactor(task: EngineTask, ctx: EngineContext): ScoreFactor | null {
  if (!task.objectiveId) return null;
  const targetDate = ctx.campaignTargetByObjective.get(task.objectiveId);
  if (!targetDate) return null;

  const days = daysUntil(targetDate);
  if (days < 0) {
    return { key: 'campaign_overdue', label: 'Campaign past target', points: CAMPAIGN_OVERDUE_BOOST };
  }
  for (const tier of CAMPAIGN_DEADLINE_TIERS) {
    if (days <= tier.maxDays) {
      return {
        key: 'campaign_deadline',
        label: `Campaign target in ${days} day${days === 1 ? '' : 's'}`,
        points: tier.points,
      };
    }
  }
  return null;
}

function isStale(createdAt: string): boolean {
  const created = new Date(createdAt).getTime();
  const ageMs = Date.now() - created;
  return ageMs > STALENESS_DAYS * 24 * 60 * 60 * 1000;
}

function priorityLabel(p: TaskPriority): string {
  return `${p.charAt(0).toUpperCase()}${p.slice(1)} priority`;
}

function weightSiblings(counts: LiveCounts | undefined, excludeStatus: TaskStatus): number {
  if (!counts) return 0;
  // Subtract one from the matching status to exclude the candidate itself
  const ready = counts.ready - (excludeStatus === 'ready' ? 1 : 0);
  const blocked = counts.blocked - (excludeStatus === 'blocked' ? 1 : 0);
  const waiting = counts.waiting - (excludeStatus === 'waiting' ? 1 : 0);
  const active = counts.active - (excludeStatus === 'active' ? 1 : 0);
  return (
    Math.max(0, blocked) * SIBLING_BLOCKED_WEIGHT +
    Math.max(0, waiting) * SIBLING_WAITING_WEIGHT +
    Math.max(0, ready) * SIBLING_READY_WEIGHT +
    Math.max(0, active) * SIBLING_ACTIVE_WEIGHT
  );
}

// ---- Public API ----

export function normalizeReady<T extends EngineTask>(tasks: T[]): T[] {
  return tasks.filter((t) => t.status === 'ready');
}

export function buildEngineContext<T extends EngineTask>(
  tasks: T[],
  objectives?: EngineObjective[]
): EngineContext {
  const campaignTargetByObjective = new Map<string, string>();
  if (objectives) {
    for (const o of objectives) {
      if (o.objectiveType === 'campaign' && o.campaignStatus === 'active' && o.targetDate) {
        campaignTargetByObjective.set(o.id, o.targetDate);
      }
    }
  }

  const hotFrontObjectiveIds = new Set<string>();
  const readyFrontObjectiveIds = new Set<string>();
  const liveSiblingsByObjective = new Map<string, LiveCounts>();
  const liveSiblingsByParent = new Map<string, LiveCounts>();
  const stuckChildrenByParent = new Map<string, number>();

  for (const t of tasks) {
    // Front membership (objective only)
    if (t.objectiveId) {
      if (t.status === 'active') hotFrontObjectiveIds.add(t.objectiveId);
      else if (t.status === 'ready') readyFrontObjectiveIds.add(t.objectiveId);
    }

    // Live sibling counts (exclude done/parked)
    if (t.status !== 'done' && t.status !== 'parked') {
      if (t.objectiveId) {
        let counts = liveSiblingsByObjective.get(t.objectiveId);
        if (!counts) {
          counts = emptyCounts();
          liveSiblingsByObjective.set(t.objectiveId, counts);
        }
        bumpCount(counts, t.status);
      }
      if (t.parentItemId) {
        let counts = liveSiblingsByParent.get(t.parentItemId);
        if (!counts) {
          counts = emptyCounts();
          liveSiblingsByParent.set(t.parentItemId, counts);
        }
        bumpCount(counts, t.status);
      }
    }

    // Stuck children for parent unblock
    if (t.parentItemId && (t.status === 'blocked' || t.status === 'waiting')) {
      stuckChildrenByParent.set(
        t.parentItemId,
        (stuckChildrenByParent.get(t.parentItemId) ?? 0) + 1
      );
    }
  }

  return {
    hotFrontObjectiveIds,
    readyFrontObjectiveIds,
    liveSiblingsByObjective,
    liveSiblingsByParent,
    stuckChildrenByParent,
    campaignTargetByObjective,
  };
}

export function scoreTask<T extends EngineTask>(task: T, ctx: EngineContext): Recommendation<T> {
  const factors: ScoreFactor[] = [];

  // Priority
  const priorityPoints = PRIORITY_WEIGHT[task.priority];
  factors.push({ key: 'priority', label: priorityLabel(task.priority), points: priorityPoints });

  // Front alignment
  if (task.objectiveId && ctx.hotFrontObjectiveIds.has(task.objectiveId)) {
    factors.push({ key: 'hot_front', label: 'Hot front', points: HOT_FRONT_BOOST });
  } else if (task.objectiveId && ctx.readyFrontObjectiveIds.has(task.objectiveId)) {
    factors.push({ key: 'ready_front', label: 'Ready front', points: READY_FRONT_BOOST });
  }

  // Bound
  if (task.objectiveId || task.parentItemId) {
    factors.push({ key: 'bound', label: 'Bound to objective', points: BOUND_BOOST });
  }

  // Campaign deadline proximity
  const deadlineFactor = campaignDeadlineFactor(task, ctx);
  if (deadlineFactor) factors.push(deadlineFactor);

  // Decision nudge + sibling unblock
  if (task.itemType === 'decision') {
    factors.push({ key: 'decision_nudge', label: 'Decision', points: DECISION_NUDGE });

    // Sibling unblock — combine objective siblings and parent siblings
    let unblockRaw = 0;
    if (task.objectiveId) {
      unblockRaw += weightSiblings(ctx.liveSiblingsByObjective.get(task.objectiveId), task.status);
    }
    if (task.parentItemId) {
      unblockRaw += weightSiblings(ctx.liveSiblingsByParent.get(task.parentItemId), task.status);
    }
    const unblockPoints = Math.min(unblockRaw, DECISION_UNBLOCK_CAP);
    if (unblockPoints > 0) {
      factors.push({
        key: 'unblock_decision',
        label: `Unblocks ${unblockPoints >= DECISION_UNBLOCK_CAP ? 'many' : unblockRaw} live sibling${unblockRaw === 1 ? '' : 's'}`,
        points: unblockPoints,
      });
    }
  }

  // Parent unblock for initiative/maintenance items
  if (task.itemType === 'initiative' || task.itemType === 'maintenance') {
    const stuck = ctx.stuckChildrenByParent.get(task.id) ?? 0;
    if (stuck > 0) {
      const points = Math.min(stuck * PARENT_STUCK_CHILD_WEIGHT, PARENT_UNBLOCK_CAP);
      factors.push({
        key: 'unblock_parent',
        label: `Advances ${stuck} stuck child${stuck === 1 ? '' : 'ren'}`,
        points,
      });
    }
  }

  // Staleness
  if (isStale(task.createdAt)) {
    factors.push({ key: 'staleness', label: 'Aging (>7 days)', points: STALENESS_BOOST });
  }

  // Sort factors by point contribution descending
  factors.sort((a, b) => b.points - a.points);

  const score = factors.reduce((sum, f) => sum + f.points, 0);
  const narrative = buildNarrative(task, factors);

  return { task, score, factors, narrative };
}

function buildNarrative<T extends EngineTask>(task: T, factors: ScoreFactor[]): string {
  if (factors.length === 0) return 'A ready item with no scoring signals.';

  const top = factors[0];
  const second = factors[1];

  // Phrase fragments by factor key
  const phrase = (f: ScoreFactor): string => {
    switch (f.key) {
      case 'hot_front':       return 'bound to a hot front';
      case 'ready_front':     return 'bound to a ready front';
      case 'bound':           return 'anchored to an objective';
      case 'priority':        return `your ${task.priority}-priority candidate`;
      case 'decision_nudge':  return 'a pending decision';
      case 'unblock_decision':return f.label.toLowerCase();
      case 'unblock_parent':  return f.label.toLowerCase();
      case 'campaign_deadline': return f.label.toLowerCase().replace('campaign target', 'on a campaign closing');
      case 'campaign_overdue':  return 'on a campaign past its target';
      case 'staleness':       return 'aging on the deck';
      default:                return f.label.toLowerCase();
    }
  };

  const parts: string[] = [phrase(top)];
  if (second && second.points > 0 && second.key !== top.key) {
    parts.push(phrase(second));
  }

  // Capitalize first letter
  const sentence = `${parts.join(' and ')}.`;
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

export function rankRecommendations<T extends EngineTask>(
  tasks: T[],
  ctx?: EngineContext,
  objectives?: EngineObjective[]
): Recommendation<T>[] {
  const context = ctx ?? buildEngineContext(tasks, objectives);
  const candidates = normalizeReady(tasks);
  const scored = candidates.map((t) => scoreTask(t, context));
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(a.task.createdAt).getTime() - new Date(b.task.createdAt).getTime();
  });
  return scored;
}

export function recommendNextMove<T extends EngineTask>(
  tasks: T[],
  objectives?: EngineObjective[]
): Recommendation<T> | null {
  const ranked = rankRecommendations(tasks, undefined, objectives);
  return ranked[0] ?? null;
}

// ---- Parking pressure (inverse heat) -----------------------------------
//
// The recommendation engine answers "what matters now?". The parking engine
// answers the inverse: "what should leave the active field?". Both are part
// of convergence — a system that only ranks work is still serving
// accumulation.
//
// Parking is orientation, not cleanup. Review Mode handles structural decay
// (orphans, vague titles, empty initiatives, 14+ day drift). Parking Pressure
// handles a softer signal: items sitting in the active field without
// justification — cooling fronts, low-value ready items, long-held work.
//
// Eligible candidates: ready / blocked / waiting. Active items are in motion
// and should not be pushed aside. Done / parked are already out of field.
//
// Hard gates (never suggest parking):
//   - status is active / done / parked
//   - priority is urgent
//   - task is on a hot front (momentum protects the whole objective)
//   - task is fresh (< 3 days old — hasn't had time to prove itself)
//
// Coolness factors accumulate from the eligible pool. An item is surfaced
// only if its total coolness clears PARK_THRESHOLD.

const PARK_STALE_DAYS = 10;           // softer than Review's 14-day stale
const PARK_LONG_HELD_DAYS = 5;        // softer than Review's 7-day long_blocked
const PARK_FRESH_DAYS = 3;            // items newer than this are protected
const PARK_CROWDED_READY_THRESHOLD = 5; // objective has this many ready siblings
const PARK_THRESHOLD = 5;             // minimum coolness to surface

const COOL_STALE = 5;
const COOL_LONG_BLOCKED = 6;
const COOL_LONG_WAITING = 5;
const COOL_LOW_PRIORITY = 4;
const COOL_UNBOUND = 3;
const COOL_CROWDED_READY = 2;

export interface ParkingSuggestion<T extends EngineTask = EngineTask> {
  task: T;
  coolness: number;
  reasons: ScoreFactor[];
  topReason: string;
}

function ageDays(createdAt: string): number {
  return (Date.now() - new Date(createdAt).getTime()) / (24 * 60 * 60 * 1000);
}

export function scoreCoolness<T extends EngineTask>(
  task: T,
  ctx: EngineContext
): ParkingSuggestion<T> | null {
  // Hard gates
  if (task.status === 'active' || task.status === 'done' || task.status === 'parked') return null;
  if (task.priority === 'urgent') return null;
  if (task.objectiveId && ctx.hotFrontObjectiveIds.has(task.objectiveId)) return null;
  // Never park items on a campaign nearing (or past) its target — deadline
  // pressure means everything bound to it stays in the field until it closes.
  if (task.objectiveId) {
    const targetDate = ctx.campaignTargetByObjective.get(task.objectiveId);
    if (targetDate && daysUntil(targetDate) <= CAMPAIGN_PARK_SHIELD_DAYS) return null;
  }

  const age = ageDays(task.createdAt);
  if (age < PARK_FRESH_DAYS) return null;

  const reasons: ScoreFactor[] = [];

  // Aged in the active field (ready / blocked / waiting)
  if (age >= PARK_STALE_DAYS) {
    reasons.push({
      key: 'cool_stale',
      label: `Aged ${Math.floor(age)} days`,
      points: COOL_STALE,
    });
  }

  // Long-held statuses — stuck in holding without movement
  if (task.status === 'blocked' && age >= PARK_LONG_HELD_DAYS) {
    reasons.push({ key: 'cool_long_blocked', label: 'Long-blocked', points: COOL_LONG_BLOCKED });
  }
  if (task.status === 'waiting' && age >= PARK_LONG_HELD_DAYS) {
    reasons.push({ key: 'cool_long_waiting', label: 'Long-waiting', points: COOL_LONG_WAITING });
  }

  // Low priority sitting in the active field
  if (task.priority === 'low') {
    reasons.push({ key: 'cool_low_priority', label: 'Low priority', points: COOL_LOW_PRIORITY });
  }

  // Weakly anchored work
  if (!task.objectiveId && !task.parentItemId) {
    reasons.push({ key: 'cool_unbound', label: 'Unbound', points: COOL_UNBOUND });
  }

  // Crowded ready front — weaker items on a bloated objective can be parked
  if (task.status === 'ready' && task.objectiveId) {
    const counts = ctx.liveSiblingsByObjective.get(task.objectiveId);
    if (counts && counts.ready >= PARK_CROWDED_READY_THRESHOLD) {
      reasons.push({
        key: 'cool_crowded',
        label: 'Crowded ready front',
        points: COOL_CROWDED_READY,
      });
    }
  }

  if (reasons.length === 0) return null;

  reasons.sort((a, b) => b.points - a.points);
  const coolness = reasons.reduce((sum, r) => sum + r.points, 0);
  if (coolness < PARK_THRESHOLD) return null;

  return {
    task,
    coolness,
    reasons,
    topReason: reasons[0].label,
  };
}

export function rankParkingCandidates<T extends EngineTask>(
  tasks: T[],
  ctx?: EngineContext
): ParkingSuggestion<T>[] {
  const context = ctx ?? buildEngineContext(tasks);
  const suggestions: ParkingSuggestion<T>[] = [];
  for (const t of tasks) {
    const s = scoreCoolness(t, context);
    if (s) suggestions.push(s);
  }
  suggestions.sort((a, b) => {
    if (b.coolness !== a.coolness) return b.coolness - a.coolness;
    // Tiebreak: older items first (cooler by age)
    return new Date(a.task.createdAt).getTime() - new Date(b.task.createdAt).getTime();
  });
  return suggestions;
}
