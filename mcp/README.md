# Task Manager MCP Server

A stdio Model Context Protocol server that lets AI agents (Claude Code, Antigravity, Gemini CLI) work with the todos app.

## Modes

| Mode | When | Data |
|---|---|---|
| **remote** (normal) | `TODOS_API_URL` and `TODOS_AGENT_KEY` or `TODOS_AGENT_KEY_FILE` are set | The production agent API (`/api/agent/*`). Every call is authenticated with that agent's agent-gate key and limited to its permissions. |
| **local** (development only) | `TODOS_MCP_LOCAL=1` | A local SQLite file (`TODOS_DB_PATH`, default `data/tasks.db`). Never production data. |

With neither set, the server exits with an error instead of silently using a stale local database.

The production app is Tailscale-only, so remote mode works only from a tailnet machine.

## Tools

Remote mode: `list_tasks`, `get_task`, `create_task`, `update_task`, `add_comment`, `list_comments`, `list_objectives`, `create_objective`, `update_objective`, `recommend_next_move`.

Local mode adds `delete_task`, `delete_objective`, `delete_comment` and `list_labels`. Deletes and labels are deliberately not exposed through the agent API. In remote mode, `create_task` rejects `labelIds`, and `update_task` rejects `completedAt` (backdating).

## Configuration

Issue one key per agent in the agent-gate admin UI (`/api/agent-gate/admin` on the app, unlocked with `AGENT_GATE_ADMIN_TOKEN`). Store it in a mode-600 file and point `TODOS_AGENT_KEY_FILE` at it, so the key stays out of MCP config files.

Claude Code (this repo's `.mcp.json`):

```json
{
  "mcpServers": {
    "todos": {
      "type": "stdio",
      "command": "node_modules/.bin/tsx",
      "args": ["mcp/server.ts"],
      "env": {
        "TODOS_API_URL": "http://<todos-host>:8153",
        "TODOS_AGENT_KEY_FILE": "${HOME}/.config/todos-mcp/Claude.key"
      }
    }
  }
}
```

Other clients take the same `command`, `args` and `env`, using absolute paths.

For local development, use `"env": { "TODOS_MCP_LOCAL": "1" }` (and optionally `TODOS_DB_PATH`).

## Testing

```bash
TODOS_MCP_LOCAL=1 npx @modelcontextprotocol/inspector npx tsx mcp/server.ts
```
