# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run Commands

```bash
npm run dev          # Dev server with Turbopack (Next.js 15)
npm run build        # Production build (uses --turbopack)
npm run start        # Start production server
npm run lint         # ESLint with TypeScript rules
npm run mcp:start    # Start MCP server (stdio transport)
```

Docker: `docker compose up --build` — runs on port 8153, mounts `./data` for persistent SQLite.

No test framework is configured.

## Architecture

Full-stack Next.js 15 (App Router) + React 19 task management app with SQLite (better-sqlite3) and Gemini AI integration.

### Data Layer

- **SQLite database** in `data/` directory, WAL mode, initialized on first access in `app/lib/db.ts`
- **Repository pattern** in `app/lib/repositories.ts` — `TaskRepository`, `LabelRepository`, `CommentRepository` with direct SQL (no ORM)
- **Types** in `app/lib/types.ts` — core entities (Task, Label, Comment) plus input/filter types
- Labels have a `kind` field: either `'scope'` (seeded defaults: Personal, Work, Financial, Health) or `'project'` (user-created)

### API Routes (`app/api/`)

Standard REST for tasks, labels, and comments. Three AI endpoints:
- `ai/parse-intent` — natural language → structured task JSON (Gemini 2.5 Flash)
- `ai/decompose` — task → markdown checklist of sub-tasks
- `ai/garden` — analyzes full backlog for insights/recommendations

AI endpoints require `GEMINI_API_KEY` env var. Fallback heuristic parser in `app/lib/intent-parser.ts`.

### Frontend State

- Context API + `useReducer` in `app/components/AppProvider.tsx` — holds tasks, labels, filters, selected task, toasts
- `app/lib/api-client.ts` — typed fetch wrapper used by all components
- Two views: task list and kanban board (toggled in `TaskDashboard.tsx`)
- Tailwind CSS v4 with CSS custom properties for dark/light theming in `globals.css`

### MCP Server (`mcp/`)

Stdio-based Model Context Protocol server exposing task CRUD tools for AI agents (Claude Desktop, Gemini CLI). Shares the same database and repository layer.

## Key Conventions

- `next.config.ts` marks `better-sqlite3` as a server external package
- Catch blocks use `err: unknown` with `instanceof Error` checks (ESLint enforces no `any`)
- Unused function params prefixed with underscore (e.g., `_request`)
- API error responses follow `{ error: string }` shape with appropriate status codes
