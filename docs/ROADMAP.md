# Roadmap

Current status of priority improvements.

---

## ✅ Completed in Recent Iterations

*   **Search Debounce:** (`app/lib/useDebounce.ts`) Search input is now debounced (300ms).
*   **Error Toast Notifications:** (`app/components/ui/Toast.tsx`) Feedback on success/error.
*   **Sidebar Label Management:** Edit/Delete scopes and projects from the UI.
*   **Task Sorting:** Added sorting by Title, Priority, Due Date, and Creation Date.
*   **Detail Panel Empty State:** Onboarding tips when no task is selected.
*   **General Task View:** Inbox/General filters for project-free tasks.
*   **Mobile Sidebar Access:** Hamburger menu and responsive drawer.
*   **Keyboard Shortcuts:** `n`, `s`, `Esc`, and arrow key navigation.
*   **Bulk Operations:** Multi-select for batch status updates and deletion.

---

## 🚀 Next Priority: Performance & Robustness

### 1. Optimistic Updates
**Problem:** Every action waits for API confirmation before updating the UI, which can feel slow.
**Plan:** Update local state immediately on actions like status toggles, task creation, and comments. Roll back state if the API call fails.

### 2. Backend Input Sanitization
**Problem:** API routes lack strict validation and trimming for incoming data.
**Plan:** Implement robust validation for task and label inputs (length limits, enum checks, whitespace trimming).

### 3. N+1 Queries Optimization
**Problem:** `TaskRepository.list()` performs multiple database queries per task row.
**Plan:** Refactor the repository to use single-pass JOIN queries to fetch tasks along with their labels and comment counts.

---

## 🎨 Future Polish

- **Kanban View:** A drag-and-drop board for status management.
- **Due Date Time Component:** Support for specific times and recurring tasks.
- **Pagination:** Implement cursor-based loading for large task lists.
