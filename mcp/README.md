# Task Manager MCP Server

This directory contains a Model Context Protocol (MCP) server that allows AI agents (like Claude Desktop or Gemini) to interact directly with your local task database.

## 🚀 Capabilities

The server exposes the following tools to the AI:
- `list_tasks`: Search and filter the backlog.
- `get_task`: Read full details and comments for a task.
- `create_task`: Add new items to the list.
- `update_task`: Change status, priority, title, etc.
- `delete_task`: Remove items.
- `list_labels`: List all Scopes and Projects.

## 🛠️ Configuration

To use this with Claude Desktop, add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "todos": {
      "command": "npx",
      "args": [
        "-y",
        "tsx",
        "/Users/YOUR_USER/Projects/todos/mcp/server.ts"
      ],
      "env": {
        "NODE_ENV": "development"
      }
    }
  }
}
```

*Replace `/Users/YOUR_USER/Projects/todos` with the actual absolute path to this repository.*

## 🧪 Testing

You can test the server locally using the MCP Inspector:

```bash
npx @modelcontextprotocol/inspector npx tsx mcp/server.ts
```
