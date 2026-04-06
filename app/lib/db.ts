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
      status TEXT NOT NULL DEFAULT 'ready'
        CHECK (status IN ('ready', 'active', 'blocked', 'waiting', 'parked', 'done')),
      priority TEXT NOT NULL DEFAULT 'medium'
        CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
      item_type TEXT NOT NULL DEFAULT 'action'
        CHECK (item_type IN ('action', 'decision', 'initiative', 'idea', 'maintenance')),
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

  // Migration: add item_type column to existing databases
  const columns = db.prepare("PRAGMA table_info(tasks)").all() as { name: string }[];
  if (!columns.some(c => c.name === 'item_type')) {
    db.exec("ALTER TABLE tasks ADD COLUMN item_type TEXT DEFAULT 'action'");
  }

  db.exec("CREATE INDEX IF NOT EXISTS idx_tasks_item_type ON tasks(item_type)");

  // Migration: rebuild tasks table to update CHECK constraint for new execution states
  // SQLite doesn't support ALTER CHECK, so we must rebuild the table
  const tableSQL = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='tasks'").get() as { sql: string } | undefined;
  if (tableSQL && tableSQL.sql.includes("'pending'")) {
    // Disable foreign keys during rebuild to preserve task_labels and comments
    db.pragma('foreign_keys = OFF');
    db.exec(`
      CREATE TABLE tasks_new (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'ready'
          CHECK (status IN ('ready', 'active', 'blocked', 'waiting', 'parked', 'done')),
        priority TEXT NOT NULL DEFAULT 'medium'
          CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        item_type TEXT NOT NULL DEFAULT 'action'
          CHECK (item_type IN ('action', 'decision', 'initiative', 'idea', 'maintenance')),
        due_date TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      INSERT INTO tasks_new SELECT
        id, title, description,
        CASE status
          WHEN 'pending' THEN 'ready'
          WHEN 'in_progress' THEN 'active'
          WHEN 'completed' THEN 'done'
          ELSE status
        END,
        priority,
        COALESCE(item_type, 'action'),
        due_date, created_at, updated_at
      FROM tasks;

      DROP TABLE tasks;
      ALTER TABLE tasks_new RENAME TO tasks;

      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
      CREATE INDEX IF NOT EXISTS idx_tasks_item_type ON tasks(item_type);
      CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
    `);
    db.pragma('foreign_keys = ON');
  }

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
