# Roadmap

Three priority improvements for the next iteration.

---

## 1. Search Debounce

**Problem:** Every keystroke in the search input dispatches `SET_FILTERS` immediately, which triggers the `useEffect` in `AppProvider.tsx:149` to call `fetchTasks()` on every character typed. This creates unnecessary API calls and can cause UI jank on slower connections.

**Current behavior** (`app/components/layout/Header.tsx:22`):
```tsx
onChange={(e) => dispatch({ type: 'SET_FILTERS', payload: { search: e.target.value } })}
```

### Implementation

**Step 1: Create a `useDebounce` hook**

Create `app/lib/useDebounce.ts`:
- Accept a value and a delay (default 300ms)
- Return the debounced value using `useState` + `useEffect` with `setTimeout`/`clearTimeout`

**Step 2: Apply debounce in Header**

Modify `app/components/layout/Header.tsx`:
- Add local `searchInput` state for the raw input value
- The `onChange` handler updates `searchInput` (instant, for responsive typing)
- Pass `searchInput` through `useDebounce(searchInput, 300)`
- A `useEffect` watching the debounced value dispatches `SET_FILTERS`

**Step 3: Decouple search from filter effect**

Modify `app/components/AppProvider.tsx`:
- No changes needed — the `useEffect` at line 149 already reacts to `state.filters` changes, so debouncing at the dispatch site is sufficient

### Files to modify
| File | Change |
|------|--------|
| `app/lib/useDebounce.ts` | New file: custom hook |
| `app/components/layout/Header.tsx` | Local state for input, debounced dispatch |

### Verification
- Type quickly in the search box — network tab should show a single request after typing stops, not one per keystroke
- Clearing the search field should immediately show all tasks (debounce the empty string too, or treat empty as instant)

---

## 2. Error Toast Notifications

**Problem:** API errors are captured in `AppState.error` (`AppProvider.tsx:137`) but never rendered. When a task creation fails or the backend is unreachable, the user sees nothing.

### Implementation

**Step 1: Create a Toast component**

Create `app/components/ui/Toast.tsx`:
- Renders a fixed-position notification at the bottom-right of the screen
- Props: `message`, `type` ('error' | 'success'), `onDismiss`
- Auto-dismisses after 5 seconds via `useEffect` with `setTimeout`
- Red background for errors, green for success
- Close button for manual dismissal

**Step 2: Add toast state to the reducer**

Modify `app/components/AppProvider.tsx`:
- Add `toasts: { id: string; message: string; type: 'error' | 'success' }[]` to `AppState`
- Add actions: `ADD_TOAST` (appends with generated id) and `REMOVE_TOAST` (filters by id)
- In each `actions` method (createTask, updateTask, deleteTask, etc.), wrap the catch block to dispatch `ADD_TOAST` with the error message
- Optionally dispatch success toasts for create/delete operations

**Step 3: Render toasts in TaskDashboard**

Modify `app/components/tasks/TaskDashboard.tsx`:
- Import and render a toast container that maps over `state.toasts`
- Each toast auto-dismisses by dispatching `REMOVE_TOAST`

### Files to create/modify
| File | Change |
|------|--------|
| `app/components/ui/Toast.tsx` | New file: toast notification component |
| `app/components/AppProvider.tsx` | Add `toasts` to state, `ADD_TOAST`/`REMOVE_TOAST` actions, dispatch in catch blocks |
| `app/components/tasks/TaskDashboard.tsx` | Render toast container |
| `app/lib/types.ts` | Optional: add `Toast` interface |

### Verification
- Stop the dev server and try creating a task — an error toast should appear
- Create a task successfully — a success toast should appear briefly
- Multiple errors in rapid succession should stack without overlapping
- Toasts auto-dismiss after 5 seconds

---

## 3. Sidebar Label Management (Edit/Delete)

**Problem:** The API already supports updating (`PATCH /api/labels/[id]`) and deleting (`DELETE /api/labels/[id]`) labels, but the sidebar only allows creating new labels and filtering by them. There is no way to rename, recolor, or remove a scope or project through the UI.

### Implementation

**Step 1: Add a context menu component**

Create `app/components/ui/ContextMenu.tsx`:
- Renders a floating menu anchored to a click position
- Props: `items: { label: string; onClick: () => void; danger?: boolean }[]`, `position: { x: number; y: number }`, `onClose`
- Closes on outside click or Escape key
- Items: "Edit" and "Delete"

**Step 2: Add edit mode to LabelForm**

Modify `app/components/labels/LabelForm.tsx`:
- Accept optional `label` prop for editing an existing label
- When `label` is provided: pre-fill name and color, change button text to "Save", call `actions.updateLabel` instead of `actions.createLabel`
- The `kind` field is read-only when editing (kind is immutable after creation)

**Step 3: Wire context menu into Sidebar**

Modify `app/components/layout/Sidebar.tsx`:
- Add state for `contextMenu: { labelId: string; x: number; y: number } | null`
- Add `onContextMenu` (right-click) handler on each label button in both the scopes and projects lists
- Render `ContextMenu` when state is set, with "Edit" and "Delete" options
- "Edit" opens `LabelForm` in edit mode (pass the existing label)
- "Delete" opens `ConfirmDialog`, then calls `actions.deleteLabel`
- Add state for `editingLabel` to track which label is being edited

**Step 4: Protect default scopes (optional)**

The four seed scopes (Personal, Work, Financial, Health) could be made non-deletable:
- Add a `deletable` flag to the context menu logic based on whether the label is a seed scope
- Or simply allow full management and let users recreate defaults if needed

### Files to create/modify
| File | Change |
|------|--------|
| `app/components/ui/ContextMenu.tsx` | New file: reusable right-click context menu |
| `app/components/labels/LabelForm.tsx` | Add edit mode (accept optional existing label, call updateLabel) |
| `app/components/layout/Sidebar.tsx` | Add context menu state, right-click handlers, wire edit/delete flows |

### Verification
- Right-click a scope in the sidebar — context menu appears with "Edit" and "Delete"
- Click "Edit" — LabelForm opens pre-filled with current name and color
- Change the name and save — sidebar updates immediately
- Click "Delete" — confirmation dialog appears
- Confirm delete — label is removed from sidebar, tasks that had this label lose it
- Right-click a project — same behavior
- Test that deleting a label with tasks assigned updates task counts correctly
