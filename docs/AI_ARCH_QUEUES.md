# AI Architecture: Local Background Workers & Queues (Approach B)

This document outlines the strategy for implementing asynchronous, UI-triggered AI tasks (e.g., Auto-Decomposition, Summarization) within the Task Manager without blocking the main thread or requiring complex external infrastructure like Redis.

## 🏗️ The Architecture: SQLite as a Message Broker

Since we are a **Local-First** application, we can leverage our existing `tasks.db` to act as a reliable work queue.

### 1. The Schema (`ai_jobs` table)
We add a dedicated table to track background work:

```sql
CREATE TABLE IF NOT EXISTS ai_jobs (
  id TEXT PRIMARY KEY,
  task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL, -- 'decompose', 'summarize', 'garden'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  payload TEXT,           -- Input data (if needed)
  result TEXT,            -- Output data (e.g., generated subtasks JSON)
  error TEXT,             -- Error message if failed
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### 2. The Workflow

1.  **Trigger (UI):** User clicks the "Magic Wand" button on a task. 
    - The Next.js API route inserts a record into `ai_jobs` with status `pending`.
    - The UI immediately shows a "✨ AI is thinking..." loading state for that task.

2.  **Worker (Background Process):** A lightweight, long-running Node.js process (separate from the Next.js server) polls the `ai_jobs` table:
    - `SELECT * FROM ai_jobs WHERE status = 'pending' ORDER BY created_at LIMIT 1;`
    - It marks the job as `processing`.
    - It calls the **Gemini API** with the task context.
    - On success: It parses the AI response, updates the relevant `tasks` (e.g., appends subtasks to description), and marks the job `completed`.
    - On failure: It marks the job `failed` and records the error.

3.  **UI Feedback (Polling/SSE):** The Next.js frontend polls the job status (e.g., every 2 seconds) or uses a Server-Sent Events (SSE) stream to listen for the `completed` state.

## 🛠️ Implementation Details

### The "Watcher" Script
We can run this as a sidecar process:
```bash
# Example command to run the worker
npx tsx scripts/ai-worker.ts
```

### Handling Concurrency
By using SQLite's **WAL (Write-Ahead Logging)** mode, the background worker can write to the database while the user is still browsing and editing tasks without locking the file.

### Error Handling & Retries
- Jobs that stay in `processing` for too long (timeouts) can be reset to `pending`.
- We can implement a `retry_count` column to prevent infinite loops on "poison pill" tasks.

## 🌈 Why this works for our Vision
- **No Extra Dependencies:** No need for RabbitMQ, Redis, or BullMQ.
- **Persistence:** If the user closes the app, the "work" isn't lost. The worker resumes when the app/system restarts.
- **Privacy:** All task context and results remain in the local `tasks.db`.
