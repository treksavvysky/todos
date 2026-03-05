'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
  type Dispatch,
} from 'react';
import type {
  TaskWithDetails,
  LabelWithCount,
  TaskFilters,
  TaskCreateInput,
  TaskUpdateInput,
  LabelCreateInput,
  LabelUpdateInput,
} from '@/app/lib/types';
import * as api from '@/app/lib/api-client';

// ---- State ----

interface AppState {
  tasks: TaskWithDetails[];
  labels: LabelWithCount[];
  filters: TaskFilters;
  selectedTaskId: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AppState = {
  tasks: [],
  labels: [],
  filters: { status: 'all', priority: 'all', scopeId: null, projectId: null, search: '' },
  selectedTaskId: null,
  isLoading: true,
  error: null,
};

// ---- Actions ----

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TASKS'; payload: TaskWithDetails[] }
  | { type: 'SET_LABELS'; payload: LabelWithCount[] }
  | { type: 'SET_FILTERS'; payload: Partial<TaskFilters> }
  | { type: 'SELECT_TASK'; payload: string | null }
  | { type: 'UPSERT_TASK'; payload: TaskWithDetails }
  | { type: 'REMOVE_TASK'; payload: string }
  | { type: 'UPSERT_LABEL'; payload: LabelWithCount }
  | { type: 'REMOVE_LABEL'; payload: string };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_TASKS':
      return { ...state, tasks: action.payload };
    case 'SET_LABELS':
      return { ...state, labels: action.payload };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'SELECT_TASK':
      return { ...state, selectedTaskId: action.payload };
    case 'UPSERT_TASK': {
      const exists = state.tasks.some((t) => t.id === action.payload.id);
      const tasks = exists
        ? state.tasks.map((t) => (t.id === action.payload.id ? action.payload : t))
        : [action.payload, ...state.tasks];
      return { ...state, tasks };
    }
    case 'REMOVE_TASK': {
      const tasks = state.tasks.filter((t) => t.id !== action.payload);
      const selectedTaskId = state.selectedTaskId === action.payload ? null : state.selectedTaskId;
      return { ...state, tasks, selectedTaskId };
    }
    case 'UPSERT_LABEL': {
      const exists = state.labels.some((l) => l.id === action.payload.id);
      const labels = exists
        ? state.labels.map((l) => (l.id === action.payload.id ? action.payload : l))
        : [...state.labels, action.payload];
      return { ...state, labels };
    }
    case 'REMOVE_LABEL':
      return { ...state, labels: state.labels.filter((l) => l.id !== action.payload) };
    default:
      return state;
  }
}

// ---- Context ----

interface AppContextType {
  state: AppState;
  dispatch: Dispatch<Action>;
  actions: AppActions;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ---- Actions (API + dispatch) ----

interface AppActions {
  loadData: () => Promise<void>;
  createTask: (input: TaskCreateInput) => Promise<TaskWithDetails>;
  updateTask: (id: string, input: TaskUpdateInput) => Promise<TaskWithDetails>;
  deleteTask: (id: string) => Promise<void>;
  setTaskLabels: (taskId: string, labelIds: string[]) => Promise<void>;
  addComment: (taskId: string, content: string) => Promise<void>;
  createLabel: (input: LabelCreateInput) => Promise<void>;
  updateLabel: (id: string, input: LabelUpdateInput) => Promise<void>;
  deleteLabel: (id: string) => Promise<void>;
}

// ---- Provider ----

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const loadData = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const [tasks, labels] = await Promise.all([
        api.fetchTasks(state.filters),
        api.fetchLabels(),
      ]);
      dispatch({ type: 'SET_TASKS', payload: tasks });
      dispatch({ type: 'SET_LABELS', payload: labels });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Failed to load data' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refetch tasks when filters change (skip initial)
  useEffect(() => {
    if (state.isLoading) return;
    const fetchFiltered = async () => {
      try {
        const tasks = await api.fetchTasks(state.filters);
        dispatch({ type: 'SET_TASKS', payload: tasks });
      } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Failed to fetch tasks' });
      }
    };
    fetchFiltered();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.filters]);

  const actions: AppActions = {
    loadData,

    createTask: async (input) => {
      const task = await api.createTask(input);
      dispatch({ type: 'UPSERT_TASK', payload: task });
      // Refresh labels to update counts
      const labels = await api.fetchLabels();
      dispatch({ type: 'SET_LABELS', payload: labels });
      return task;
    },

    updateTask: async (id, input) => {
      const task = await api.updateTask(id, input);
      dispatch({ type: 'UPSERT_TASK', payload: task });
      return task;
    },

    deleteTask: async (id) => {
      await api.deleteTask(id);
      dispatch({ type: 'REMOVE_TASK', payload: id });
      const labels = await api.fetchLabels();
      dispatch({ type: 'SET_LABELS', payload: labels });
    },

    setTaskLabels: async (taskId, labelIds) => {
      await api.setTaskLabels(taskId, labelIds);
      // Refetch the task to get updated labels
      const task = await api.fetchTask(taskId);
      dispatch({ type: 'UPSERT_TASK', payload: task });
      const labels = await api.fetchLabels();
      dispatch({ type: 'SET_LABELS', payload: labels });
    },

    addComment: async (taskId, content) => {
      await api.addComment(taskId, content);
      const task = await api.fetchTask(taskId);
      dispatch({ type: 'UPSERT_TASK', payload: task });
    },

    createLabel: async (input) => {
      await api.createLabel(input);
      const labels = await api.fetchLabels();
      dispatch({ type: 'SET_LABELS', payload: labels });
    },

    updateLabel: async (id, input) => {
      await api.updateLabel(id, input);
      const labels = await api.fetchLabels();
      dispatch({ type: 'SET_LABELS', payload: labels });
    },

    deleteLabel: async (id) => {
      await api.deleteLabel(id);
      const labels = await api.fetchLabels();
      dispatch({ type: 'SET_LABELS', payload: labels });
      // Refetch tasks since label removal may affect them
      const tasks = await api.fetchTasks(state.filters);
      dispatch({ type: 'SET_TASKS', payload: tasks });
    },
  };

  return (
    <AppContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
