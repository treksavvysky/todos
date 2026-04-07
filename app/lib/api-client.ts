import type {
  TaskWithDetails,
  Objective,
  ObjectiveWithCounts,
  LabelWithCount,
  Label,
  Comment,
  TaskCreateInput,
  TaskUpdateInput,
  ObjectiveCreateInput,
  ObjectiveUpdateInput,
  LabelCreateInput,
  LabelUpdateInput,
  TaskFilters,
} from './types';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

// ---- Tasks ----

export async function fetchTasks(filters: TaskFilters = {}): Promise<TaskWithDetails[]> {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters.priority && filters.priority !== 'all') params.set('priority', filters.priority);
  if (filters.itemType && filters.itemType !== 'all') params.set('itemType', filters.itemType);
  if (filters.objectiveId) params.set('objectiveId', filters.objectiveId);
  if (filters.parentItemId) params.set('parentItemId', filters.parentItemId);
  if (filters.orphanedOnly) params.set('orphanedOnly', 'true');
  if (filters.scopeId) params.set('scopeId', filters.scopeId);
  if (filters.projectId) params.set('projectId', filters.projectId);
  if (filters.generalOnly) params.set('generalOnly', 'true');
  if (filters.search) params.set('search', filters.search);
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);

  const qs = params.toString();
  const data = await request<{ tasks: TaskWithDetails[] }>(`/api/tasks${qs ? `?${qs}` : ''}`);
  return data.tasks;
}

export async function fetchTask(id: string): Promise<TaskWithDetails> {
  return request<TaskWithDetails>(`/api/tasks/${id}`);
}

export async function createTask(input: TaskCreateInput): Promise<TaskWithDetails> {
  return request<TaskWithDetails>('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateTask(id: string, input: TaskUpdateInput): Promise<TaskWithDetails> {
  return request<TaskWithDetails>(`/api/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteTask(id: string): Promise<void> {
  await request(`/api/tasks/${id}`, { method: 'DELETE' });
}

export async function setTaskLabels(taskId: string, labelIds: string[]): Promise<Label[]> {
  const data = await request<{ labels: Label[] }>(`/api/tasks/${taskId}/labels`, {
    method: 'PUT',
    body: JSON.stringify({ labelIds }),
  });
  return data.labels;
}

export async function addComment(taskId: string, content: string): Promise<Comment> {
  return request<Comment>(`/api/tasks/${taskId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

// ---- Objectives ----

export async function fetchObjectives(): Promise<ObjectiveWithCounts[]> {
  const data = await request<{ objectives: ObjectiveWithCounts[] }>('/api/objectives');
  return data.objectives;
}

export async function createObjective(input: ObjectiveCreateInput): Promise<Objective> {
  return request<Objective>('/api/objectives', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateObjective(id: string, input: ObjectiveUpdateInput): Promise<Objective> {
  return request<Objective>(`/api/objectives/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteObjective(id: string): Promise<void> {
  await request(`/api/objectives/${id}`, { method: 'DELETE' });
}

// ---- Labels ----

export async function fetchLabels(kind?: string): Promise<LabelWithCount[]> {
  const qs = kind ? `?kind=${kind}` : '';
  const data = await request<{ labels: LabelWithCount[] }>(`/api/labels${qs}`);
  return data.labels;
}

export async function createLabel(input: LabelCreateInput): Promise<Label> {
  return request<Label>('/api/labels', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateLabel(id: string, input: LabelUpdateInput): Promise<Label> {
  return request<Label>(`/api/labels/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteLabel(id: string): Promise<void> {
  await request(`/api/labels/${id}`, { method: 'DELETE' });
}

// ---- AI ----

export async function parseIntentAI(input: string, labels: Label[]): Promise<{ tasks: TaskCreateInput[] }> {
  return request<{ tasks: TaskCreateInput[] }>('/api/ai/parse-intent', {
    method: 'POST',
    body: JSON.stringify({ input, labels }),
  });
}

export async function decomposeTaskAI(title: string, description?: string): Promise<{ checklist: string }> {
  return request<{ checklist: string }>('/api/ai/decompose', {
    method: 'POST',
    body: JSON.stringify({ title, description }),
  });
}

export async function gardenBacklogAI(): Promise<{ insights: string }> {
  return request<{ insights: string }>('/api/ai/garden', {
    method: 'POST',
  });
}
