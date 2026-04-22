// ---- Enums ----

export type TaskStatus = 'ready' | 'active' | 'blocked' | 'waiting' | 'parked' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ItemType = 'action' | 'decision' | 'initiative' | 'idea' | 'maintenance';
export type ObjectiveType = 'mission' | 'parking_lot';
export type LabelKind = 'scope' | 'project';

// ---- Core Entities ----

export interface Objective {
  id: string;
  title: string;
  objectiveType: ObjectiveType;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  itemType: ItemType;
  objectiveId: string | null;
  parentItemId: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  // Set automatically when status transitions to 'done'; cleared when status
  // transitions away from 'done'. Can be overridden explicitly via an update
  // (useful for backdating retroactive completions).
  completedAt: string | null;
}

export interface Label {
  id: string;
  name: string;
  kind: LabelKind;
  color: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  taskId: string;
  content: string;
  createdAt: string;
}

// ---- API Request Shapes ----

export interface TaskCreateInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  itemType?: ItemType;
  objectiveId?: string | null;
  parentItemId?: string | null;
  dueDate?: string | null;
  labelIds?: string[];
}

export interface TaskUpdateInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  itemType?: ItemType;
  objectiveId?: string | null;
  parentItemId?: string | null;
  dueDate?: string | null;
  // Explicit override for retroactive/backdated completion. If omitted, the
  // repository auto-manages completedAt based on status transitions.
  completedAt?: string | null;
}

export interface ObjectiveCreateInput {
  title: string;
  objectiveType: ObjectiveType;
  description?: string;
}

export interface ObjectiveUpdateInput {
  title?: string;
  description?: string;
}

export interface LabelCreateInput {
  name: string;
  kind: LabelKind;
  color?: string;
}

export interface LabelUpdateInput {
  name?: string;
  color?: string;
}

// ---- API Response Shapes ----

export interface TaskWithDetails extends Task {
  labels: Label[];
  comments: Comment[];
}

export interface LabelWithCount extends Label {
  taskCount: number;
}

export interface ObjectiveWithCounts extends Objective {
  itemCount: number;
}

export type TaskSortBy = 'created_at' | 'due_date' | 'priority' | 'title';
export type SortOrder = 'asc' | 'desc';

// ---- Filter Shape ----

export interface TaskFilters {
  status?: TaskStatus | 'all';
  priority?: TaskPriority | 'all';
  itemType?: ItemType | 'all';
  objectiveId?: string | null;
  parentItemId?: string | null;
  orphanedOnly?: boolean;
  scopeId?: string | null;
  projectId?: string | null;
  generalOnly?: boolean;
  search?: string;
  sortBy?: TaskSortBy;
  sortOrder?: SortOrder;
}
