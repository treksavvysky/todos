// ---- Enums ----

export type TaskStatus = 'ready' | 'active' | 'blocked' | 'waiting' | 'parked' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ItemType = 'action' | 'decision' | 'initiative' | 'idea' | 'maintenance';
export type LabelKind = 'scope' | 'project';

// ---- Core Entities ----

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  itemType: ItemType;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
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
  dueDate?: string | null;
  labelIds?: string[];
}

export interface TaskUpdateInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  itemType?: ItemType;
  dueDate?: string | null;
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

export type TaskSortBy = 'created_at' | 'due_date' | 'priority' | 'title';
export type SortOrder = 'asc' | 'desc';

// ---- Filter Shape ----

export interface TaskFilters {
  status?: TaskStatus | 'all';
  priority?: TaskPriority | 'all';
  itemType?: ItemType | 'all';
  scopeId?: string | null;
  projectId?: string | null;
  generalOnly?: boolean;
  search?: string;
  sortBy?: TaskSortBy;
  sortOrder?: SortOrder;
}
