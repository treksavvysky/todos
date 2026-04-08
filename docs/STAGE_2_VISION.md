# Stage 2 Vision — Convergence Pressure

## Purpose

Stage 1 established the **Command Core** of `todos`. The system now has the structural foundations required to function as a deterministic personal command system:

- structured item types
- explicit execution states
- objective and parent binding
- command-first Now view
- deterministic recommendation engine
- Review Mode

That work is complete.

Stage 2 is not about broadening the product with more generic features. It is about making the existing system more faithful to the doctrine behind it. The next task is to ensure that `todos` does not merely **represent** convergence, but begins to **apply pressure toward it**.

## The Core Problem

A structurally correct system is not yet a convergent system.

Today, `todos` can show the user the shape of the situation, recommend a next move, and reveal areas of drift. But much of convergence remains optional. A user can still:

- create unbound items without meaningful friction
- allow review debt to accumulate invisibly
- overinflate urgency without pushback
- complete decisions without recording outcomes
- keep weak or stale work active longer than it deserves
- use the system correctly only when consciously choosing to do so

This means the app captures the **form** of Layered Convergence more strongly than its **discipline**.

Stage 2 exists to close that gap.

## Product Thesis

Stage 2 introduces **convergence pressure**.

The system should increasingly make the coherent path the path of least resistance. It should not become rigid, punitive, or bureaucratic. It should remain low-friction and practical. But it should begin to shape behavior through asymmetrical friction:

- coherent behavior becomes easier
- divergent behavior becomes slightly more uncomfortable
- drift becomes more visible
- weak structure becomes more obvious
- commitment becomes easier than accumulation

The goal is not to control the user. The goal is to bias the environment toward coherence.

## Strategic Objective

Move `todos` from a **structurally correct command surface** to an **operationally insistent convergence engine**.

## Design Principles

### 1. Shape behavior without blocking agency
The system should guide, nudge, and expose consequences. It should not become heavy-handed. Most doctrinal pressure should take the form of:
- defaults
- warnings
- visual pressure
- suggested corrective actions
- review visibility

Hard blocks should be rare.

### 2. Apply pressure upstream
The highest-leverage place to reduce divergence is at creation time. It is better to prevent weak structure from entering the system than to clean it up later.

### 3. Make stewardship ambient
Review should not be a hidden maintenance tool. The user should feel the state of the system from the main surfaces of the app.

### 4. Completion should mean consequence
When a decision is resolved, the system should capture the chosen path and make downstream effects visible.

### 5. Preserve clarity over cleverness
Stage 2 should deepen the existing deterministic architecture, not obscure it with automation. Recommendation logic, review pressure, and binding nudges should remain inspectable and explainable.

### 6. Keep the command loop tight
The app should continue to answer, with increasing force:
- What matters now?
- What should be ignored for now?
- What is drifting?
- What is weakly structured?
- What move would increase coherence?

## Stage 2 Focus Areas

## 1. Creation-Time Binding Pressure

The system should gently resist the creation of orphaned work.

Current state:
- orphaned items are detected later in Review Mode
- users can create unbound items with no meaningful pressure

Desired behavior:
- objective selection is suggested or preselected during creation
- unbound creation produces a visible warning or weak-signal treatment
- the system makes binding easier than leaving work unanchored

This is not about forbidding orphaned items. It is about making structure the default.

## 2. Review Pressure Visibility

Review is first-class in concept but passive in practice.

Current state:
- Review Mode exists as a separate destination
- review debt is only visible when the user goes looking for it

Desired behavior:
- flagged counts visible from anywhere
- clear indication of unresolved review debt
- eventual memory of review recency and review state

The user should not have to remember to remember.

## 3. Parking as Orientation, Not Just Cleanup

The system currently supports parking, but mostly as a corrective gesture.

Current state:
- parking is manual
- the Now view does not help answer “what should be ignored for now?”

Desired behavior:
- the system can suggest parking candidates
- cooling fronts, stale low-value ready items, and weakly anchored work can be surfaced for consideration
- parking becomes part of active orientation, not just backlog maintenance

A convergent system must narrow, not merely rank.

## 4. Decision Resolution with Outcomes

Decisions are currently typed correctly, but they collapse into generic closure when completed.

Current state:
- a decision becomes `done`
- no required or suggested capture of the chosen path
- no direct follow-on structure

Desired behavior:
- decision completion prompts for a concise recorded outcome
- the chosen path can optionally generate follow-on work
- the system preserves the difference between “decision made” and “task finished”

This is essential if decisions are to remain first-class objects.

## 5. Persistent Stewardship Memory

The current system supports review actions but not durable review state.

Current state:
- dismissals are session-only
- no lasting record of recent review

Desired behavior:
- review actions can persist
- the system can distinguish between neglected problems and recently acknowledged ones
- review fatigue is reduced without hiding real debt

## 6. Recommendation Beyond Snapshot

The recommendation engine is strong, but still point-in-time.

Current state:
- the engine identifies the best current move
- it does not yet express short-range sequence or path

Desired behavior:
- optional visibility into the next likely move after the current one
- clearer expression of why certain moves create downstream coherence
- better support for directional momentum, not just local ranking

The system should begin to answer not only “what next?” but also “what next, then what?”

## Non-Goals for Stage 2

Stage 2 is not primarily about:
- broad AI expansion
- adding generic collaboration features
- visual redesign for its own sake
- complex automation workflows
- replacing the external campaign tracker
- increasing feature volume without increasing doctrinal force

The focus is tightening, not sprawling.

## Success Criteria

Stage 2 will be successful when:

- users are less likely to create orphaned work
- review debt is visible without entering Review Mode
- the system helps identify what should leave the active field
- decisions preserve outcomes, not just completion
- the convergent path feels easier than the divergent one
- the app applies steady force toward coherence without becoming oppressive

## North Star

Stage 1 made `todos` structurally different from a to-do list.

Stage 2 should make it behaviorally different.

The system should not merely allow convergence. It should increasingly make convergence the path of least resistance.