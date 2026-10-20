import { AgentGate } from '@plugins/agent-gate';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { agentOpenApi } from './agent-openapi';

/**
 * Singleton AgentGate — the boundary external agents (Custom GPTs, …) cross
 * to reach the todos API. Keys are issued in the admin UI at
 * /api/agent-gate/admin (unlocked with AGENT_GATE_ADMIN_TOKEN); each agent
 * gets a filtered OpenAPI spec at an unguessable URL to paste into the GPT
 * builder.
 *
 * Agent/key data lives in data/agent-gate.data.json (gitignored, sits next
 * to the SQLite db so the Docker volume covers it).
 */
const globalForGate = globalThis as unknown as { todosAgentGate?: AgentGate };

// Fail closed: with no AGENT_GATE_ADMIN_TOKEN, use a random per-process
// token nobody knows instead of a guessable default (SEC-2026-10-20-TODOS).
function adminToken(): string {
  const token = process.env.AGENT_GATE_ADMIN_TOKEN;
  if (token) return token;
  console.warn('AGENT_GATE_ADMIN_TOKEN is not set; agent-gate admin is locked for this process');
  return randomBytes(32).toString('hex');
}

export const gate = (globalForGate.todosAgentGate ??= new AgentGate({
  spec: agentOpenApi,
  adminToken: adminToken(),
  storage: {
    file: process.env.AGENT_GATE_DATA ?? path.join(process.cwd(), 'data', 'agent-gate.data.json'),
  },
  server: {
    url: process.env.AGENT_GATE_PUBLIC_URL ?? 'http://localhost:8153',
    name: process.env.AGENT_GATE_PUBLIC_NAME ?? 'Todos',
  },
}));
