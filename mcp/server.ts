import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { TaskRepository, LabelRepository } from "../app/lib/repositories.js";
import type { TaskFilters, TaskUpdateInput, TaskCreateInput } from "../app/lib/types.js";

const server = new Server(
  {
    name: "task-manager-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * List all available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_tasks",
        description: "Fetch a list of tasks from the database with optional filters.",
        inputSchema: {
          type: "object",
          properties: {
            status: { type: "string", enum: ["pending", "in_progress", "completed", "all"] },
            priority: { type: "string", enum: ["low", "medium", "high", "urgent", "all"] },
            search: { type: "string", description: "Search term for task titles" },
            scopeId: { type: "string" },
            projectId: { type: "string" },
          },
        },
      },
      {
        name: "get_task",
        description: "Get detailed information about a specific task by ID.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
      },
      {
        name: "create_task",
        description: "Create a new task in the database.",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
            dueDate: { type: "string", description: "ISO date string (YYYY-MM-DD)" },
            labelIds: { type: "array", items: { type: "string" } },
          },
          required: ["title"],
        },
      },
      {
        name: "update_task",
        description: "Update an existing task's fields.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            status: { type: "string", enum: ["pending", "in_progress", "completed"] },
            priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
            dueDate: { type: "string" },
          },
          required: ["id"],
        },
      },
      {
        name: "delete_task",
        description: "Permanently delete a task.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
      },
      {
        name: "list_labels",
        description: "Fetch all available scopes and projects (labels).",
        inputSchema: {
          type: "object",
          properties: {
            kind: { type: "string", enum: ["scope", "project"] },
          },
        },
      },
    ],
  };
});

/**
 * Handle tool execution
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "list_tasks": {
        const tasks = TaskRepository.list(args as TaskFilters);
        return { content: [{ type: "text", text: JSON.stringify(tasks, null, 2) }] };
      }

      case "get_task": {
        const { id } = args as { id: string };
        const task = TaskRepository.getById(id);
        return { 
          content: [{ type: "text", text: task ? JSON.stringify(task, null, 2) : "Task not found" }],
          isError: !task
        };
      }

      case "create_task": {
        const task = TaskRepository.create(args as TaskCreateInput);
        return { content: [{ type: "text", text: `Task created: ${task.id}` }] };
      }

      case "update_task": {
        const { id, ...updates } = args as { id: string } & TaskUpdateInput;
        const task = TaskRepository.update(id, updates);
        return { 
          content: [{ type: "text", text: task ? `Task ${id} updated` : "Task not found" }],
          isError: !task
        };
      }

      case "delete_task": {
        const { id } = args as { id: string };
        const success = TaskRepository.remove(id);
        return { 
          content: [{ type: "text", text: success ? `Task ${id} deleted` : "Task not found" }],
          isError: !success
        };
      }

      case "list_labels": {
        const { kind } = args as { kind?: string };
        const labels = LabelRepository.list(kind);
        return { content: [{ type: "text", text: JSON.stringify(labels, null, 2) }] };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [{ type: "text", text: error instanceof Error ? error.message : String(error) }],
      isError: true,
    };
  }
});

/**
 * Start the server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Task Manager MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
