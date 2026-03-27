# Task Manager Project (Next.js 15)

This is a comprehensive task management application built with Next.js 15, React 19, and SQLite. It features task categorization with labels (scopes and projects), status and priority tracking, and a commenting system.

## Project Overview

*   **Framework:** [Next.js 15](https://nextjs.org) (App Router)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Frontend:** [React 19](https://react.dev), [Tailwind CSS v4](https://tailwindcss.com), [Geist Fonts](https://vercel.com/font)
*   **Backend:** Next.js API Routes, [better-sqlite3](https://github.com/WiseLibs/node-better-sqlite3)
*   **Database:** SQLite (local file at `data/tasks.db`)
*   **State Management:** React Context API + `useReducer` for global application state.
*   **Theming:** Custom theme support (Light/Dark) using CSS variables and Tailwind CSS v4.

## Architecture

The project follows a clean architecture for both frontend and backend:

*   **API Layer (`app/api/`):** Standard Next.js Route Handlers.
*   **Service Layer (`app/lib/repositories.ts`):** Encapsulates all database operations using the Repository pattern.
*   **Data Model (`app/lib/types.ts`):** Centralized TypeScript interfaces for core entities (`Task`, `Label`, `Comment`) and API input/output shapes.
*   **State Management (`app/components/AppProvider.tsx`):** Orchestrates global UI state and API interactions through a `useApp` hook.
*   **Component Organization (`app/components/`):**
    *   `tasks/`: Task-specific components (List, Detail, Form, Dashboard).
    *   `labels/`: Label management components.
    *   `layout/`: Structural components (Header, Sidebar).
    *   `ui/`: Reusable primitive components (Modals, Toasts, Loaders).

## Building and Running

### Key Commands

*   **Development:** `npm run dev` (uses Turbopack for fast builds).
*   **Production Build:** `npm run build` (uses Turbopack).
*   **Start Production Server:** `npm run start`.
*   **Linting:** `npm run lint`.

### Database Setup

*   The database is automatically initialized and migrated on the first run.
*   Database schema and initial seed data for "Scope" labels are defined in `app/lib/db.ts`.
*   Data is stored locally in `data/tasks.db` (git-ignored).

## Development Conventions

### Coding Style & Patterns

*   **Server Logic:** Keep database operations within `repositories.ts`. Avoid direct `better-sqlite3` calls in API routes.
*   **Client State:** Use the `useApp` hook to access global state and trigger actions (e.g., `actions.createTask`).
*   **Styling:** Prefer Tailwind CSS v4 utility classes. For themed colors, use the CSS variables defined in `app/globals.css` (e.g., `var(--color-primary)`).
*   **Identifiers:** Use the `generateId` utility from `app/lib/utils.ts` for generating unique IDs for new entities.
*   **Types:** Always use the interfaces defined in `app/lib/types.ts` to ensure type safety across the stack.

### Testing

*   *Note: Currently, there are no automated tests (Jest/Vitest/Playwright) configured in the project. (TODO: Add testing framework).*

### Project Structure

```
├── app/
│   ├── api/             # API Route Handlers
│   ├── components/      # UI Components (Feature-organized)
│   ├── lib/             # Core logic (db, types, repositories, utils)
│   └── layout.tsx       # Root layout with ThemeProvider
├── data/                # SQLite database storage (git-ignored)
├── docs/                # Project documentation and roadmap
└── public/              # Static assets
```

## Roadmap & Improvements

For detailed information on planned features and identified areas for improvement, refer to:
*   `docs/ROADMAP.md`: High-priority tasks (Search Debounce, Error Toasts, Sidebar Management).
*   `docs/improvements.md`: Comprehensive list of functional and architectural enhancements.
