# Improvement Items

Identified areas for enhancement, grouped by category.

---

## Functional Gaps

### 1. Label editing and deletion from the UI
The API supports `PATCH /api/labels/[id]` and `DELETE /api/labels/[id]`, but the sidebar has no UI for renaming, recoloring, or removing scopes/projects. Hover or right-click context menus on sidebar items would expose this functionality.

### 2. Task sorting options
Tasks are currently sorted by `created_at DESC` only. Adding sort controls (by priority, due date, status, title) would improve usability as the task list grows.

### 3. Mobile sidebar access
The sidebar uses `hidden md:block`, making scope/project filtering and label creation inaccessible on small screens. A hamburger menu or slide-out drawer would fix this.

### 4. Due date time component
The date input captures day only. Optional time-of-day or recurring due date support may be needed depending on use case.

### 5. Bulk operations
Multi-select for batch status changes, label assignment, or deletion would save time when managing many tasks.

---

## Data Integrity & Robustness

### 6. Backend input sanitization
API routes perform basic presence checks but lack length limits, type validation for enum fields (status, priority), and thorough trimming. Tightening validation would prevent bad data from entering the database.

### 7. Error display in the UI
`AppState` carries an `error` field but nothing renders it. A toast or notification component is needed to surface API failures to the user.

### 8. Optimistic updates
Every mutation currently waits for the API round-trip then refetches. For frequent actions like status toggles and comment adds, optimistic local state updates with rollback on failure would improve perceived performance.

---

## Architecture

### 9. Search debounce
Each keystroke in the search bar dispatches `SET_FILTERS`, triggering an API call via `useEffect`. Intentional debounce (300ms) is needed to avoid excessive requests.

### 10. N+1 queries in task listing
`TaskRepository.list()` fetches all tasks then calls `getLabels()` and `listForTask()` per row. A single JOIN query returning all data in one pass would be more efficient at scale.

### 11. Pagination
The task list loads everything at once. Cursor-based pagination or virtual scrolling would be necessary once the dataset reaches hundreds of tasks.

---

## Polish

### 12. Keyboard shortcuts
Shortcuts such as `n` for new task, `Escape` to close the detail panel, and arrow keys for list navigation would improve power-user efficiency.

### 13. Empty state for detail panel
When no task is selected, the right column is blank. A placeholder with usage tips or quick actions would improve the first-run experience.

### 14. Kanban view
A drag-and-drop board with columns for Pending, In Progress, and Completed as an alternative to the list view.
