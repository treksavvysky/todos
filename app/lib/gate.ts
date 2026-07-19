import { AgentGate } from '@plugins/agent-gate';
import path from 'node:path';
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

export const gate = (globalForGate.todosAgentGate ??= new AgentGate({
  spec: agentOpenApi,
  adminToken: process.env.AGENT_GATE_ADMIN_TOKEN ?? 'set-AGENT_GATE_ADMIN_TOKEN-in-env-local',
  storage: {
    file: process.env.AGENT_GATE_DATA ?? path.join(process.cwd(), 'data', 'agent-gate.data.json'),
  },
  server: {
    url: process.env.AGENT_GATE_PUBLIC_URL ?? 'http://localhost:8153',
    name: process.env.AGENT_GATE_PUBLIC_NAME ?? 'Todos',
  },
}));
