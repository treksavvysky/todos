import Database from 'better-sqlite3';
import path from 'path';
import { generateId } from './utils';

const DB_PATH = path.join(process.cwd(), 'data', 'tasks.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');

  runMigrations(_db);

  return _db;
}

function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'in_progress', 'completed')),
      priority TEXT NOT NULL DEFAULT 'medium'
        CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
      due_date TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS labels (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      kind TEXT NOT NULL CHECK (kind IN ('scope', 'project')),
      color TEXT NOT NULL DEFAULT '#6366f1',
      created_at TEXT NOT NULL,
      UNIQUE(name, kind)
    );

    CREATE TABLE IF NOT EXISTS task_labels (
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      label_id TEXT NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
      PRIMARY KEY (task_id, label_id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
    CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
    CREATE INDEX IF NOT EXISTS idx_labels_kind ON labels(kind);
    CREATE INDEX IF NOT EXISTS idx_task_labels_task ON task_labels(task_id);
    CREATE INDEX IF NOT EXISTS idx_task_labels_label ON task_labels(label_id);
    CREATE INDEX IF NOT EXISTS idx_comments_task ON comments(task_id);
  `);

  seedDefaults(db);
}

function seedDefaults(db: Database.Database): void {
  const existing = db.prepare('SELECT COUNT(*) as count FROM labels WHERE kind = ?').get('scope') as { count: number };
  if (existing.count > 0) return;

  const insert = db.prepare('INSERT INTO labels (id, name, kind, color, created_at) VALUES (?, ?, ?, ?, ?)');
  const now = new Date().toISOString();

  const defaults = [
    { id: generateId(), name: 'Personal', color: '#22c55e' },
    { id: generateId(), name: 'Work', color: '#3b82f6' },
    { id: generateId(), name: 'Financial', color: '#eab308' },
    { id: generateId(), name: 'Health', color: '#ef4444' },
  ];

  const seedAll = db.transaction(() => {
    for (const scope of defaults) {
      insert.run(scope.id, scope.name, 'scope', scope.color, now);
    }
  });

  seedAll();
}
