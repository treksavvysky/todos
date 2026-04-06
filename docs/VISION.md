# `todos` Vision

## Purpose

`todos` is not a traditional to-do app. It is a **local-first personal command system** designed to reduce fragmentation, clarify priorities, and help the user converge on the next meaningful move.

The project began as a task manager and evolved into something more structurally ambitious: a software implementation of the principles behind **Layered Convergence**. Its purpose is not to help users collect more tasks. Its purpose is to help them organize work according to its true nature, bind actions to larger intent, and maintain coherence across projects, decisions, and daily execution.

## Problem

Most productivity tools flatten everything into one generic list. Actions, decisions, projects, ideas, and maintenance obligations are treated as the same kind of object. This creates cognitive drag, weak prioritization, and a constant sense of fragmentation.

Users do not primarily need a larger backlog. They need a system that helps answer:

- What matters now?
- What is actionable?
- What is blocked?
- What is merely an idea?
- What belongs to the current mission?
- What should be ignored for now?

`todos` exists to solve that problem.

## Product Thesis

A useful execution system must do four things well:

1. **Represent different kinds of work correctly**
2. **Show the current operational picture clearly**
3. **Bind lower-level action to higher-level intent**
4. **Reduce divergence over time**

This means `todos` should behave less like a list manager and more like a **command surface for directed self-organization**.

## Core Product Principles

### 1. Structured Work Model
The system must distinguish between different item types, including:
- actions
- decisions
- projects
- ideas
- maintenance

These are not cosmetic labels. They are different operational objects and must be modeled as such.

### 2. Command-First UX
The primary interface should orient the user, not overwhelm them. The default view should emphasize:
- current mission
- active fronts
- ready actions
- blocked or waiting items
- key decisions
- recommended next move

The home screen should answer “What is the shape of the situation?” rather than “How many unfinished items exist?”

### 3. Objective Binding
Active work should belong to a meaningful parent context such as:
- mission
- project
- maintenance stream
- parking lot

This prevents drift and preserves coherence between strategic direction and immediate action.

### 4. Convergence Over Accumulation
The system should help narrow possibilities into committed movement. It should prioritize:
- blocker removal
- branch collapse
- stale item cleanup
- clarification of vague work
- focus on the highest-leverage next move

### 5. Review as a First-Class Capability
Sustained coherence requires pruning. The product should support structured review workflows that detect:
- stale items
- orphaned items
- blocked clusters
- excessive active fronts
- vague or unresolved entries

## Technical Direction

### Local-First by Default
The application should remain fast, private, and dependable. Local-first architecture is a feature, not an implementation detail. A command system must feel immediate.

### Low Friction, High Signal
The system should increase clarity without creating bureaucracy. Added structure must improve decision quality and execution, not produce administrative overhead.

### Simple Rules Before Complex Automation
The product should begin with strong data models, clean workflows, and deterministic heuristics. Sophisticated automation can come later. First, the system must prove that it improves convergence.

### Build for Real Use
This project is being built as a practical instrument for real-life use, not as a generic productivity exercise. Product decisions should be grounded in operational usefulness.

## Near-Term Product Direction

The next stage of `todos` should focus on building the **Command Core**:

- structured item types
- explicit execution states
- parent objective binding
- command-first “Now” view
- recommended next move logic
- review mode for stale, blocked, and orphaned items

These features form the minimum viable implementation of the product thesis.

## Long-Term Direction

In its mature form, `todos` should become a convergence engine that helps users move from fragmented effort to coherent action. It should serve as a practical software layer between philosophy and execution: a tool that translates intent into structure, structure into focus, and focus into meaningful progress.

## North Star

`todos` exists to transform fragmented effort into coherent movement.

All product, UX, and engineering decisions in this repository should be evaluated against that standard.