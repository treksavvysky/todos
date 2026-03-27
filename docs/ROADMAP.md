# Roadmap

Current status of priority improvements.

---

## ✅ Completed in Recent Iterations

*   **Search Debounce:** (`app/lib/useDebounce.ts`) Search input is now debounced (300ms) to reduce API calls.
*   **Error Toast Notifications:** (`app/components/ui/Toast.tsx`) Global notification system for success and error messages.
*   **Sidebar Label Management:** Added context menus (right-click) to edit and delete scopes and projects.
*   **Task Sorting:** Added sorting by Title, Priority, Due Date, and Creation Date with ASC/DESC toggle.
*   **Detail Panel Empty State:** Added helpful tips and quick actions when no task is selected.
*   **General Task View:** Added "Inbox" and "General" filters to the sidebar for project-free tasks.

---

## 🚀 Next Priority: Mobile Access & Polish

### 1. Mobile Sidebar Access
**Problem:** The sidebar is currently hidden on mobile (`hidden md:block`), making it impossible to switch scopes/projects or manage labels on small screens.
**Plan:** Implement a "Hamburger" menu in the `Header` that toggles a slide-out drawer or overlay containing the `Sidebar` content.

### 2. Keyboard Shortcuts
**Problem:** Power users need faster ways to navigate.
**Plan:** Add global listeners for:
- `n`: New Task
- `s`: Focus Search
- `Esc`: Clear selection / close modal
- `↑ / ↓`: Navigate task list

### 3. Bulk Operations
**Problem:** Managing many tasks one-by-one is tedious.
**Plan:** 
- Add checkboxes to `TaskCard`.
- Show a "Bulk Action" bar when 1+ tasks are selected.
- Support batch status changes, label assignment, and deletion.
