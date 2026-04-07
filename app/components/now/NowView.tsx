'use client';

import { useMemo, useState } from 'react';
import { useApp } from '../AppProvider';
import TaskCard from '../tasks/TaskCard';
import ItemTypeBadge from '../tasks/ItemTypeBadge';
import TaskStatusBadge from '../tasks/TaskStatusBadge';
import TaskPriorityBadge from '../tasks/TaskPriorityBadge';
import { buildNowSnapshot, type ActiveFront, type NowPulse, type ScoredMove } from '@/app/lib/now-view';
import type { TaskWithDetails, ObjectiveWithCounts } from '@/app/lib/types';

export default function NowView() {
  const { state, dispatch, actions } = useApp();

  const snapshot = useMemo(
    () => buildNowSnapshot(state.tasks, state.objectives),
    [state.tasks, state.objectives]
  );

  const objectiveMap = useMemo(() => {
    const m = new Map<string, ObjectiveWithCounts>();
    for (const o of state.objectives) m.set(o.id, o);
    return m;
  }, [state.objectives]);

  const hasNothingReady = snapshot.pulse.readyCount === 0;

  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
      <OperationalPulse pulse={snapshot.pulse} />

      {hasNothingReady ? (
        <EmptyState pulse={snapshot.pulse} />
      ) : (
        <>
          {snapshot.recommendedMove && (
            <RecommendedMoveCard
              move={snapshot.recommendedMove}
              objective={snapshot.recommendedMove.task.objectiveId ? objectiveMap.get(snapshot.recommendedMove.task.objectiveId) : undefined}
              onMarkActive={() => actions.updateTask(snapshot.recommendedMove!.task.id, { status: 'active' })}
              onMarkDone={() => actions.updateTask(snapshot.recommendedMove!.task.id, { status: 'done' })}
              onOpen={() => dispatch({ type: 'SELECT_TASK', payload: snapshot.recommendedMove!.task.id })}
            />
          )}
        </>
      )}

      {snapshot.activeFronts.length > 0 && (
        <section>
          <SectionHeader title="Active Fronts" count={snapshot.activeFronts.length} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {snapshot.activeFronts.map((front) => (
              <ActiveFrontCard key={front.objective.id} front={front} dispatch={dispatch} objectives={state.objectives} />
            ))}
          </div>
        </section>
      )}

      {snapshot.openDecisions.length > 0 && (
        <section>
          <SectionHeader title="Open Decisions" count={snapshot.openDecisions.length} />
          <div className="flex flex-col gap-2">
            {snapshot.openDecisions.map((d) => (
              <DecisionRow
                key={d.id}
                task={d}
                objective={d.objectiveId ? objectiveMap.get(d.objectiveId) : undefined}
                onClick={() => dispatch({ type: 'SELECT_TASK', payload: d.id })}
              />
            ))}
          </div>
        </section>
      )}

      {(snapshot.blockers.length > 0 || snapshot.waiting.length > 0) && (
        <HoldingPattern
          blockers={snapshot.blockers}
          waiting={snapshot.waiting}
          objectives={state.objectives}
          dispatch={dispatch}
        />
      )}
    </div>
  );
}

// ---- Operational Pulse ----

function OperationalPulse({ pulse }: { pulse: NowPulse }) {
  return (
    <div
      className="text-xs font-medium tracking-wider uppercase flex items-center gap-3"
      style={{ color: 'var(--color-text-muted)' }}
    >
      <span><strong style={{ color: 'var(--color-text)' }}>{pulse.readyCount}</strong> ready</span>
      <span>·</span>
      <span><strong style={{ color: 'var(--color-text)' }}>{pulse.activeFrontCount}</strong> active fronts</span>
      <span>·</span>
      <span><strong style={{ color: 'var(--color-text)' }}>{pulse.blockedCount}</strong> blocked</span>
      <span>·</span>
      <span><strong style={{ color: 'var(--color-text)' }}>{pulse.waitingCount}</strong> waiting</span>
    </div>
  );
}

// ---- Section Header ----

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
        {title}
      </h2>
      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-600">
        {count}
      </span>
    </div>
  );
}

// ---- Recommended Next Move (hero card) ----

function RecommendedMoveCard({
  move,
  objective,
  onMarkActive,
  onMarkDone,
  onOpen,
}: {
  move: ScoredMove;
  objective?: ObjectiveWithCounts;
  onMarkActive: () => void;
  onMarkDone: () => void;
  onOpen: () => void;
}) {
  const { task, reasons } = move;

  return (
    <div
      className="rounded-xl border-2 p-5 flex flex-col gap-3"
      style={{
        borderColor: 'var(--color-primary)',
        background: 'var(--color-surface)',
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full text-white" style={{ background: 'var(--color-primary)' }}>
          ★ Recommended Next Move
        </span>
      </div>

      <h2 className="text-xl font-bold leading-tight" style={{ color: 'var(--color-text)' }}>
        {task.title}
      </h2>

      {task.description && (
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {task.description}
        </p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <ItemTypeBadge itemType={task.itemType} />
        <TaskStatusBadge status={task.status} />
        <TaskPriorityBadge priority={task.priority} />
        {objective && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-muted)' }}>
            {objective.objectiveType === 'mission' ? '🎯' : '🅿️'} {objective.title}
          </span>
        )}
      </div>

      {reasons.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
            Why this:
          </span>
          {reasons.map((r) => (
            <span
              key={r}
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}
            >
              {r}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button
          onClick={onMarkActive}
          className="px-3 py-1.5 text-xs font-bold rounded-md text-white"
          style={{ background: 'var(--color-primary)' }}
        >
          🚀 Start
        </button>
        <button
          onClick={onMarkDone}
          className="px-3 py-1.5 text-xs font-bold rounded-md border"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
        >
          ✅ Done
        </button>
        <button
          onClick={onOpen}
          className="px-3 py-1.5 text-xs font-bold rounded-md border ml-auto"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
        >
          Open
        </button>
      </div>
    </div>
  );
}

// ---- Active Front Card ----

function ActiveFrontCard({
  front,
  dispatch,
  objectives,
}: {
  front: ActiveFront;
  dispatch: ReturnType<typeof useApp>['dispatch'];
  objectives: ObjectiveWithCounts[];
}) {
  const isHot = front.heat === 'hot';
  const items = isHot ? front.activeItems.slice(0, 2) : front.readyItems.slice(0, 2);

  return (
    <div
      className="rounded-lg border p-3 flex flex-col gap-2"
      style={{
        borderColor: isHot ? 'var(--color-primary)' : 'var(--color-border)',
        background: 'var(--color-surface)',
        borderWidth: isHot ? '2px' : '1px',
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span>{isHot ? '🔥' : '🟢'}</span>
          <h3 className="text-sm font-bold truncate" style={{ color: 'var(--color-text)' }}>
            {front.objective.title}
          </h3>
        </div>
        <span className="text-[10px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
          {front.activeItems.length}A · {front.readyItems.length}R
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        {items.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            isSelected={false}
            isBulkSelected={false}
            onSelect={(id) => dispatch({ type: 'SELECT_TASK', payload: id })}
            onBulkSelect={() => {}}
            objectives={objectives}
          />
        ))}
      </div>
    </div>
  );
}

// ---- Decision Row ----

function DecisionRow({
  task,
  objective,
  onClick,
}: {
  task: TaskWithDetails;
  objective?: ObjectiveWithCounts;
  onClick: () => void;
}) {
  const isUnbound = !task.objectiveId && !task.parentItemId;

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2 rounded-md border flex items-center gap-3 transition-colors hover:opacity-80"
      style={{
        borderColor: 'var(--color-border)',
        background: 'var(--color-surface)',
        opacity: isUnbound ? 0.6 : 1,
      }}
    >
      <span>⚖️</span>
      <span className="flex-1 text-sm" style={{ color: 'var(--color-text)' }}>{task.title}</span>
      {objective && (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-muted)' }}>
          {objective.objectiveType === 'mission' ? '🎯' : '🅿️'} {objective.title}
        </span>
      )}
      {isUnbound && (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600">
          ⚠ Unbound
        </span>
      )}
    </button>
  );
}

// ---- Holding Pattern (collapsed by default) ----

function HoldingPattern({
  blockers,
  waiting,
  objectives,
  dispatch,
}: {
  blockers: TaskWithDetails[];
  waiting: TaskWithDetails[];
  objectives: ObjectiveWithCounts[];
  dispatch: ReturnType<typeof useApp>['dispatch'];
}) {
  const [expanded, setExpanded] = useState(false);
  const total = blockers.length + waiting.length;

  return (
    <section>
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center gap-2 mb-2 hover:opacity-80"
      >
        <span className="text-xs transition-transform" style={{ transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
          ▼
        </span>
        <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
          Holding Pattern
        </h2>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-600">
          {total}
        </span>
        <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
          ({blockers.length} blocked · {waiting.length} waiting)
        </span>
      </button>

      {expanded && (
        <div className="flex flex-col gap-2 opacity-70">
          {blockers.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isSelected={false}
              isBulkSelected={false}
              onSelect={(id) => dispatch({ type: 'SELECT_TASK', payload: id })}
              onBulkSelect={() => {}}
              objectives={objectives}
            />
          ))}
          {waiting.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isSelected={false}
              isBulkSelected={false}
              onSelect={(id) => dispatch({ type: 'SELECT_TASK', payload: id })}
              onBulkSelect={() => {}}
              objectives={objectives}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ---- Empty State ----

function EmptyState({ pulse }: { pulse: NowPulse }) {
  return (
    <div
      className="rounded-xl border border-dashed p-8 text-center flex flex-col items-center gap-3"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
    >
      <div className="text-4xl">🌅</div>
      <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
        Nothing ready right now
      </h2>
      <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
        {pulse.blockedCount} blocked · {pulse.waitingCount} waiting · {pulse.activeFrontCount} active fronts
      </p>
      <p className="text-xs max-w-md" style={{ color: 'var(--color-text-muted)' }}>
        Either everything is in motion, in holding, or you have nothing on the deck.
        Switch to the list view to add new ready work, or unblock items in the holding pattern.
      </p>
    </div>
  );
}
