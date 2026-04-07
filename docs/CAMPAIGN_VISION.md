# Campaign Vision

## Status

**Deferred.** This document captures the doctrine and integration design for treating Campaigns as a first-class concept in `todos`. No implementation work has been done. The current system collapses campaigns into `objectiveType: 'mission'` as a temporary measure.

The integration is gated on the completion of an external app: a dedicated **Campaign tracker** (e.g. the California Campaign tracker) that handles the full lifecycle of bounded operations. Once that app reaches a stable shape, this document becomes the basis for the tie-in.

## The Core Distinction

`todos` already distinguishes two objective types: **Mission** (a governing context that pulls effort) and **Parking Lot** (a holding container that preserves possibility without exerting force). Campaigns are a third object that doesn't fit cleanly into either.

| Concept | Time shape | Completion semantics | Examples |
|---|---|---|---|
| **Mission** | Perpetual | Never "completes" — stewarded indefinitely | Health, Doctrine v2, Personal Operations |
| **Campaign** | Bounded | Has a defined endpoint and a definition of done | California Campaign, Q1 Launch, Move to Austin |
| **Parking Lot** | Indefinite hold | Closes only when items are promoted out or abandoned | Someday/Maybe, Future ideas |

A Mission is a domain of perpetual intent. You don't finish Health — you maintain it. A Campaign, by contrast, is a finite operation toward a defined endpoint. When the campaign concludes, the objective itself should close, not just its child items. Treating them as the same object type collapses two genuinely different operational behaviors into one and forces the system to lie about what it's tracking.

## Why Campaigns Deserve First-Class Status

The operational consequences of conflation are real:

1. **Time pressure is a load-bearing signal.** A Mission has no target date because there is no "by when." A Campaign has one by definition. As a Campaign's target date approaches, items inside it should arguably gain recommendation weight — a deadline-aware boost in the scoring engine. Missions should never receive this boost. Without a type distinction, the engine can't tell which is which.

2. **Completion is a real state for Campaigns.** Missions never enter a `complete` state. Campaigns do. When "Move to Austin" is over, the entire objective should be archivable as a coherent unit, with its items rolling up into a summary. Right now you'd have to manually park or close the objective and there'd be no graceful "campaign complete" gesture.

3. **Review Mode should treat them differently.** A stale Mission is fine — Health doesn't need recent activity to be valid as a governing context. A stale Campaign is a pathology — "Q1 Launch" with no movement for three weeks is drifting and needs intervention. The Review Mode `stale` and `long_blocked` rules should apply to Campaigns and not to Missions. Currently the rules apply to *items*, not objectives, but with Campaigns as first-class entities the review lattice could extend to surface stale campaigns themselves.

4. **The Now view's Hot Front concept fits Campaigns naturally.** A campaign is *exactly* the kind of object that should light up as a hot front when work is moving inside it, and quietly slip into a "stalled" state when it isn't. Missions are timeless and don't really have heat — they have items inside them that have heat. Campaigns are the right level for heat to live at the container.

5. **Scope discipline is enforceable.** A Campaign with too many active items at once is overcommitted. A Mission with many active items might just be a healthy ongoing domain. Without a type distinction, the system can't apply differential WIP rules.

6. **Narrative shape.** Campaigns have arcs — beginning, middle, end. They produce stories. Missions don't — they produce ongoing stewardship. A system that wants to support reflection and after-action review needs to know which container is which.

## Proposed Data Model (when integration time comes)

This is a design sketch, not a commitment. The actual shape may evolve based on what the external Campaign tracker exposes.

```typescript
type ObjectiveType = 'mission' | 'campaign' | 'parking_lot';
type CampaignStatus = 'active' | 'complete' | 'abandoned';

interface Objective {
  id: string;
  title: string;
  objectiveType: ObjectiveType;
  description: string;
  // Campaign-only fields (null for mission and parking_lot)
  targetDate: string | null;
  campaignStatus: CampaignStatus | null;
  externalRef: string | null;       // ID in the external Campaign tracker
  externalSource: string | null;    // e.g. 'california-campaign-tracker'
  createdAt: string;
  updatedAt: string;
}
```

The two campaign-specific fields stay null for missions and parking lots. The two `external*` fields enable the tie-in: a Campaign in `todos` can be a *projection* of a campaign in the external tracker, with `externalRef` pointing back to the source of truth.

### Sidebar treatment

Three sections instead of two:

```
🎯 Missions       (perpetual)
🚩 Campaigns      (finite, time-shaped)
🅿️ Parking Lots  (indefinite hold)
```

Each campaign in the sidebar would show its target date and a small countdown indicator — "12 days left" — so the time pressure is immediately legible.

### Recommendation engine implications

A new scoring factor: **deadline proximity**. Items bound to a Campaign whose `targetDate` is within N days get a graduated boost:

| Days until target | Bonus |
|---|---|
| > 30 days | +0 |
| 14–30 days | +5 |
| 7–14 days | +10 |
| < 7 days | +15 |
| Past target | +20 (with a warning flag) |

Items bound to Missions or Parking Lots receive no deadline bonus. This preserves the doctrine: Campaigns pull harder as they approach their endpoint; Missions pull steadily; Parking Lots don't pull at all.

### Review Mode implications

Two new buckets in the False Urgency / Drift categories:

- **Stalled Campaigns** — campaigns with `campaignStatus === 'active'` whose items haven't moved in N days
- **Overdue Campaigns** — campaigns whose `targetDate` is in the past but `campaignStatus` is still `active`

These flag the campaign objective itself, not its child items. The bulk action would be "Mark complete" or "Mark abandoned" rather than "Park all."

### Now view implications

The Active Fronts section currently distinguishes Hot Fronts (🔥) from Ready Fronts (🟢). With Campaigns as first-class objects, a third visual treatment becomes possible: **Closing Fronts** (⏳) — campaigns whose target date is within the urgency window. These would render with a distinct color and a small countdown to make the time pressure unmissable.

## The External Tie-In

The integration story rests on a clear separation of responsibilities:

| App | Owns | Doesn't own |
|---|---|---|
| **Campaign tracker** (external) | Campaign lifecycle, planning, milestones, retrospectives, budget, dependencies, narrative arc | Day-to-day item execution, recommendation, review |
| **`todos`** | Items, execution states, recommendation engine, daily flow, review mode, command surface | Campaign planning, post-mortem, multi-actor coordination |

The Campaign tracker is the **source of truth** for what campaigns exist, what their target dates are, what their definitions of done are, and what their lifecycle status is. `todos` *projects* selected campaigns into its objective layer so that items can be bound to them and so the Now view, recommendation engine, and Review Mode can reason about them.

### Sync model

The minimum viable sync is one-directional and pull-based:

1. The Campaign tracker exposes a stable read API: `GET /campaigns?status=active`
2. `todos` periodically (or on demand) pulls the active campaigns and upserts them as objectives with `objectiveType: 'campaign'` and the appropriate `externalRef`
3. Items in `todos` bind to these projected objectives the same way they bind to native missions
4. When a campaign closes in the external tracker, the next sync marks the local objective `campaignStatus: 'complete'` and items inside it stop competing for attention

What `todos` does **not** do in this model:
- Create campaigns. Campaigns are created in the tracker.
- Edit campaign metadata (title, description, target date). Edits flow from the tracker.
- Push item-level data back to the tracker. The tracker doesn't care which sub-tasks happened; it cares about campaign-level milestones.

What `todos` *does* expose to the tracker (eventually, optionally):
- A read endpoint listing items bound to a given campaign so the tracker can show "current execution surface"
- A read endpoint for the recommendation engine's output for items in that campaign — useful for the tracker's own planning surface

This is a **loose coupling**: each app retains autonomy and can evolve independently. The Campaign tracker can be rebuilt without breaking `todos`. `todos` can be used standalone (with native missions only) without the tracker. The integration is additive, not load-bearing.

### What gets pushed when you complete a campaign in the tracker

When the external tracker marks a campaign complete, the next sync should:

1. Update the local objective: `campaignStatus: 'complete'`
2. Items in `done` status bound to that campaign stay as-is (history preserved)
3. Items in `ready`, `active`, `blocked`, or `waiting` get surfaced in a one-time "Campaign closing" review prompt asking the user what to do with each: keep them (re-bind elsewhere), park them, mark them done, or abandon them
4. The campaign is then archived from the active sidebar but remains accessible in a "Past Campaigns" section

This makes campaign closure a deliberate, surfaced moment — not a silent dropoff.

## Migration Path When the Tie-In Lands

Existing missions in `todos` that are *actually* campaigns (judged by name and intent) can be manually migrated by the user. There's no need for automatic detection — the user knows which of their missions are perpetual and which are bounded operations. A simple "Convert to Campaign" action on a Mission's context menu would let the user pick a target date and convert the type in place. All bound items remain bound.

## Operating Principle

> **A Mission pulls forever. A Campaign pulls toward an endpoint. A Parking Lot holds without pulling.**

That triad is the doctrine. Adding Campaigns as a first-class type isn't about adding complexity — it's about ending the fiction that the system is currently maintaining when it forces both a Mission and a campaign-shaped operation into the same container. The conceptual cost of conflation is paid in worse recommendations, less honest review feedback, and silent campaign decay. Once the external Campaign tracker is ready, this is a high-leverage cleanup.

## Open Questions for the Tie-In Phase

These are deliberately unresolved. They'll need answers when the Campaign tracker reaches a stable shape:

1. **How are campaign-level milestones represented in `todos`?** Probably as parent items with `itemType: 'initiative'` bound to the campaign objective, but the mapping needs to be confirmed once the tracker's milestone model is stable.
2. **Does `todos` support multiple external sources or just one?** If you build a second tracker later (e.g. a Personal Campaigns tracker separate from the California one), how do they coexist as `externalSource` values?
3. **What's the conflict resolution rule when sync state diverges?** If a campaign is marked complete in the tracker but `todos` has unclosed items bound to it, the system should not silently auto-close the items. The "Campaign closing" review prompt above handles this, but the exact UX needs to be specified.
4. **How does the recommendation engine handle a campaign with no items bound to it?** Probably nothing special — empty campaigns just don't influence anything. But a Review Mode bucket for "Empty active campaigns" might be useful as a hygiene signal.
5. **Should Campaign objectives appear in the MCP tool surface?** Probably yes — `list_objectives` should return them with their type and status, and the recommendation engine's deadline-aware scoring should be visible in the `recommend_next_move` factor breakdown when it fires.

## North Star

This document exists so that when the Campaign tracker is ready and the integration moment arrives, the design thinking is already done. The doctrine is captured. The data model sketch is on file. The sync model has a default shape. The migration path is mapped. None of it has to be re-derived from scratch under the pressure of an active integration sprint.

When that day comes: read this, refine it against whatever the tracker actually exposes, and build it.

Until then: keep using `mission` as the placeholder, and tolerate the mild fiction that "California Campaign" is the same kind of object as "Health." The system will tell the truth eventually.
