# Doctrinal Tightening

## Purpose

This document defines the next maturity phase of `todos` after completion of the Command Core.

The Command Core established the structural truth of the system:
- not all work is the same
- not all work is actionable
- work must be anchored
- lists do not guide action
- recommendations should be inspectable
- backlogs decay and require pruning

Those principles are now implemented.

What remains is doctrinal tightening: shaping the product so that the philosophy of Layered Convergence is not only visible in the model, but increasingly expressed in user behavior.

## The Distinction

There is a difference between:

- a system that **contains** doctrine
- a system that **applies** doctrine

`todos` has already achieved the first. It is no longer a generic task manager. Its structure, views, and review model clearly express a different understanding of work.

The unfinished task is the second: making the app exert steady force in favor of coherence.

## Definition

**Doctrinal tightening** means weaving convergent pressure into existing surfaces so that the system naturally favors:
- binding over drift
- pruning over accumulation
- consequence over vague completion
- review over neglect
- narrowing over endless expansion

This is not the addition of arbitrary friction. It is the intentional shaping of the environment so that the user is more likely to operate in alignment with the philosophy the app represents.

## Governing Principle

Use **asymmetrical friction**.

That means:
- coherent actions should be easier
- incoherent actions should remain possible, but feel weaker, riskier, or slightly more costly
- the app should bias, not imprison

The user remains sovereign. The system simply stops pretending that all choices are equally healthy.

## Why This Matters

A philosophy fails in software when it appears in labels but not in behavior.

A product can have:
- item types
- states
- recommendation logic
- review screens
- clean architecture

and still function as a permissive container for fragmentation.

That is the danger now. The ontology is strong. The surfaces are real. But convergence is still too often a matter of user discipline rather than system pressure.

Doctrinal tightening exists to reduce that gap.

## Areas of Tightening

## 1. Binding Pressure

### Problem
The system currently detects orphaned work after creation instead of resisting it at entry.

### Doctrine
Unbound work is weak work. A system committed to convergence should prefer anchored creation over post-hoc repair.

### Product implication
- objective context should be suggested during creation
- orphan creation should trigger visible weak-signal treatment
- the user should feel the difference between bound and unbound work immediately

### Principle
Do not outlaw orphans. Make them feel provisional.

---

## 2. Review Pressure

### Problem
Review Mode exists, but stewardship is still elective and easy to ignore.

### Doctrine
A command system should not hide its own decay.

### Product implication
- visible review debt from primary navigation
- eventual indicators of last review recency
- persistent acknowledgment state where appropriate

### Principle
Neglect should be visible. Maintenance should be ambient.

---

## 3. Parking Pressure

### Problem
The system can park work, but it does not yet help the user identify what should leave the active field.

### Doctrine
Convergence requires exclusion, not merely prioritization.

### Product implication
- suggest parking candidates from the Now view or related surfaces
- identify stale, low-force, weakly bound, or cooling items for removal from active consideration
- make parking a strategic act, not a cleanup afterthought

### Principle
A system that only ranks work is still serving accumulation.

---

## 4. Decision Consequence

### Problem
Decisions are typed as distinct objects, but once completed they collapse into generic closure.

### Doctrine
A decision is not merely a finished item. It is a branching event with consequences.

### Product implication
- capture a concise “chosen path” upon resolution
- optionally spawn or bind follow-on actions
- preserve some memory of what was decided, not only that a status changed

### Principle
Closure without consequence erases the meaning of a decision.

---

## 5. Persistent Stewardship Memory

### Problem
Review acknowledgments are session-only, which weakens the sense of stewardship across time.

### Doctrine
The system should remember what has been seen, judged, and deferred.

### Product implication
- persist review acknowledgment metadata
- distinguish “untouched decay” from “seen and temporarily tolerated”
- reduce unnecessary repetition without hiding structural problems

### Principle
Memory should support judgment, not replace it.

---

## 6. Directional Recommendation

### Problem
The recommendation engine identifies the strongest move now, but not the likely sequence that follows.

### Doctrine
Convergence is often a path, not a point.

### Product implication
- support short recommendation chains where useful
- expose a near-term path without pretending to do full planning
- preserve inspectability and deterministic logic

### Principle
The next move matters. The next path matters more.

## Product Standard

A tightened system should increasingly do the following:

- make weak structure visible at the moment it appears
- surface maintenance debt without requiring deliberate search
- help narrow the field, not just sort it
- preserve the consequences of decisions
- reduce the burden of self-policing by shaping the environment itself

## What Tightening Is Not

Doctrinal tightening is not:
- moralizing at the user
- adding rigid validation for its own sake
- punishing experimentation
- hiding flexibility behind opinionated defaults
- replacing judgment with automation

The goal is not to create a stern machine.  
The goal is to create an environment where coherence is easier to sustain.

## Heuristic for Future Design Decisions

When evaluating a feature or refinement, ask:

1. Does this reduce fragmentation or merely reorganize it?
2. Does this make the coherent path easier?
3. Does this make drift more visible?
4. Does this preserve user sovereignty while improving structure?
5. Does this deepen convergence, or just add surface area?

If the answer is no, it is probably not doctrinal tightening.

## Immediate High-Leverage Targets

The following are the clearest next moves:

1. creation-time binding pressure
2. visible review debt
3. parking suggestions in operational views
4. decision outcome capture
5. persistent review state
6. short-range recommendation chains

These are not random enhancements. They are the pressure points where doctrine can be translated into behavior.

## Closing Statement

The Command Core proved that `todos` could escape the category of task manager.

Doctrinal tightening is the next proof:
that the system can do more than describe convergence —
it can quietly, steadily, and practically pull the user toward it.