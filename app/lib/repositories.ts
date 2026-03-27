import { getDb } from './db';
import { generateId, nowISO } from './utils';
import type {
  Task,
  Label,
  Comment,
  TaskWithDetails,
  LabelWithCount,
  TaskCreateInput,
  TaskUpdateInput,
  LabelCreateInput,
  LabelUpdateInput,
  TaskFilters,
} from './types';

// ---- Row mapping helpers ----

function rowToTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    status: row.status as Task['status'],
    priority: row.priority as Task['priority'],
    dueDate: (row.due_date as string) || null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToLabel(row: Record<string, unknown>): Label {
  return {
    id: row.id as string,
    name: row.name as string,
    kind: row.kind as Label['kind'],
    color: row.color as string,
    createdAt: row.created_at as string,
  };
}

function rowToComment(row: Record<string, unknown>): Comment {
  return {
    id: row.id as string,
    taskId: row.task_id as string,
    content: row.content as string,
    createdAt: row.created_at as string,
  };
}

// ---- Task Repository ----

export const TaskRepository = {
  list(filters: TaskFilters = {}): TaskWithDetails[] {
    const db = getDb();
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters.status && filters.status !== 'all') {
      conditions.push('t.status = ?');
      params.push(filters.status);
    }
    if (filters.priority && filters.priority !== 'all') {
      conditions.push('t.priority = ?');
      params.push(filters.priority);
    }
    if (filters.search) {
      conditions.push('t.title LIKE ?');
      params.push(`%${filters.search}%`);
    }
    if (filters.scopeId) {
      conditions.push('EXISTS (SELECT 1 FROM task_labels tl JOIN labels l ON tl.label_id = l.id WHERE tl.task_id = t.id AND l.id = ? AND l.kind = ?)');
      params.push(filters.scopeId, 'scope');
    }
    if (filters.projectId) {
      conditions.push('EXISTS (SELECT 1 FROM task_labels tl JOIN labels l ON tl.label_id = l.id WHERE tl.task_id = t.id AND l.id = ? AND l.kind = ?)');
      params.push(filters.projectId, 'project');
    }
    if (filters.generalOnly) {
      conditions.push('NOT EXISTS (SELECT 1 FROM task_labels tl JOIN labels l ON tl.label_id = l.id WHERE tl.task_id = t.id AND l.kind = ?)');
      params.push('project');
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = db.prepare(`SELECT * FROM tasks t ${where} ORDER BY t.created_at DESC`).all(...params) as Record<string, unknown>[];

    return rows.map((row) => {
      const task = rowToTask(row);
      return {
        ...task,
        labels: TaskRepository.getLabels(task.id),
        comments: CommentRepository.listForTask(task.id),
      };
    });
  },

  getById(id: string): TaskWithDetails | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!row) return null;

    const task = rowToTask(row);
    return {
      ...task,
      labels: TaskRepository.getLabels(task.id),
      comments: CommentRepository.listForTask(task.id),
    };
  },

  create(input: TaskCreateInput): TaskWithDetails {
    const db = getDb();
    const id = generateId();
    const now = nowISO();

    db.prepare(`
      INSERT INTO tasks (id, title, description, status, priority, due_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      input.title,
      input.description || '',
      input.status || 'pending',
      input.priority || 'medium',
      input.dueDate || null,
      now,
      now,
    );

    if (input.labelIds && input.labelIds.length > 0) {
      TaskRepository.setLabels(id, input.labelIds);
    }

    return TaskRepository.getById(id)!;
  },

  update(id: string, input: TaskUpdateInput): TaskWithDetails | null {
    const db = getDb();
    const existing = db.prepare('SELECT id FROM tasks WHERE id = ?').get(id);
    if (!existing) return null;

    const sets: string[] = [];
    const params: unknown[] = [];

    if (input.title !== undefined) { sets.push('title = ?'); params.push(input.title); }
    if (input.description !== undefined) { sets.push('description = ?'); params.push(input.description); }
    if (input.status !== undefined) { sets.push('status = ?'); params.push(input.status); }
    if (input.priority !== undefined) { sets.push('priority = ?'); params.push(input.priority); }
    if (input.dueDate !== undefined) { sets.push('due_date = ?'); params.push(input.dueDate); }

    if (sets.length > 0) {
      sets.push('updated_at = ?');
      params.push(nowISO());
      params.push(id);
      db.prepare(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`).run(...params);
    }

    return TaskRepository.getById(id);
  },

  remove(id: string): boolean {
    const db = getDb();
    const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    return result.changes > 0;
  },

  getLabels(taskId: string): Label[] {
    const db = getDb();
    const rows = db.prepare(`
      SELECT l.* FROM labels l
      JOIN task_labels tl ON tl.label_id = l.id
      WHERE tl.task_id = ?
      ORDER BY l.kind, l.name
    `).all(taskId) as Record<string, unknown>[];
    return rows.map(rowToLabel);
  },

  setLabels(taskId: string, labelIds: string[]): Label[] {
    const db = getDb();
    const updateLabels = db.transaction(() => {
      db.prepare('DELETE FROM task_labels WHERE task_id = ?').run(taskId);
      const insert = db.prepare('INSERT OR IGNORE INTO task_labels (task_id, label_id) VALUES (?, ?)');
      for (const labelId of labelIds) {
        insert.run(taskId, labelId);
      }
    });
    updateLabels();
    return TaskRepository.getLabels(taskId);
  },
};

// ---- Label Repository ----

export const LabelRepository = {
  list(kind?: string): LabelWithCount[] {
    const db = getDb();
    const where = kind ? 'WHERE l.kind = ?' : '';
    const params = kind ? [kind] : [];

    const rows = db.prepare(`
      SELECT l.*, COUNT(tl.task_id) as task_count
      FROM labels l
      LEFT JOIN task_labels tl ON tl.label_id = l.id
      ${where}
      GROUP BY l.id
      ORDER BY l.kind, l.name
    `).all(...params) as Record<string, unknown>[];

    return rows.map((row) => ({
      ...rowToLabel(row),
      taskCount: row.task_count as number,
    }));
  },

  getById(id: string): Label | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM labels WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    return row ? rowToLabel(row) : null;
  },

  create(input: LabelCreateInput): Label {
    const db = getDb();
    const id = generateId();
    const now = nowISO();

    db.prepare(`
      INSERT INTO labels (id, name, kind, color, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, input.name, input.kind, input.color || '#6366f1', now);

    return LabelRepository.getById(id)!;
  },

  update(id: string, input: LabelUpdateInput): Label | null {
    const db = getDb();
    const existing = db.prepare('SELECT id FROM labels WHERE id = ?').get(id);
    if (!existing) return null;

    const sets: string[] = [];
    const params: unknown[] = [];

    if (input.name !== undefined) { sets.push('name = ?'); params.push(input.name); }
    if (input.color !== undefined) { sets.push('color = ?'); params.push(input.color); }

    if (sets.length > 0) {
      params.push(id);
      db.prepare(`UPDATE labels SET ${sets.join(', ')} WHERE id = ?`).run(...params);
    }

    return LabelRepository.getById(id);
  },

  remove(id: string): boolean {
    const db = getDb();
    const result = db.prepare('DELETE FROM labels WHERE id = ?').run(id);
    return result.changes > 0;
  },
};

// ---- Comment Repository ----

export const CommentRepository = {
  listForTask(taskId: string): Comment[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM comments WHERE task_id = ? ORDER BY created_at ASC').all(taskId) as Record<string, unknown>[];
    return rows.map(rowToComment);
  },

  create(taskId: string, content: string): Comment {
    const db = getDb();
    const id = generateId();
    const now = nowISO();

    db.prepare(`
      INSERT INTO comments (id, task_id, content, created_at)
      VALUES (?, ?, ?, ?)
    `).run(id, taskId, content, now);

    return { id, taskId, content, createdAt: now };
  },
};
