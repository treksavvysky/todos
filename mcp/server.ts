import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { TaskRepository, LabelRepository, ObjectiveRepository } from "../app/lib/repositories.js";
import type { TaskFilters, TaskUpdateInput, TaskCreateInput, ObjectiveCreateInput, ObjectiveUpdateInput } from "../app/lib/types.js";

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
            status: { type: "string", enum: ["ready", "active", "blocked", "waiting", "parked", "done", "all"] },
            priority: { type: "string", enum: ["low", "medium", "high", "urgent", "all"] },
            itemType: { type: "string", enum: ["action", "decision", "initiative", "idea", "maintenance", "all"], description: "Filter by item type" },
            objectiveId: { type: "string", description: "Filter by objective ID" },
            parentItemId: { type: "string", description: "Filter by parent item ID" },
            orphanedOnly: { type: "boolean", description: "Only show unbound items" },
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
            itemType: { type: "string", enum: ["action", "decision", "initiative", "idea", "maintenance"], description: "The kind of work this item represents. Defaults to 'action'." },
            objectiveId: { type: "string", description: "ID of the parent objective (mission or parking lot)" },
            parentItemId: { type: "string", description: "ID of the parent item (initiative or maintenance)" },
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
            status: { type: "string", enum: ["ready", "active", "blocked", "waiting", "parked", "done"] },
            priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
            itemType: { type: "string", enum: ["action", "decision", "initiative", "idea", "maintenance"] },
            objectiveId: { type: "string", description: "ID of the parent objective. Pass null to unbind." },
            parentItemId: { type: "string", description: "ID of the parent item. Pass null to unbind." },
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
        name: "list_objectives",
        description: "Fetch all objectives (missions and parking lots) with item counts.",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "create_objective",
        description: "Create a new objective (mission or parking lot).",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string" },
            objectiveType: { type: "string", enum: ["mission", "parking_lot"] },
            description: { type: "string" },
          },
          required: ["title", "objectiveType"],
        },
      },
      {
        name: "update_objective",
        description: "Update an existing objective.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
          },
          required: ["id"],
        },
      },
      {
        name: "delete_objective",
        description: "Delete an objective. Items bound to it will become unbound.",
        inputSchema: {
          type: "object",
          properties: { id: { type: "string" } },
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
        const task = TaskRepository.create(args as unknown as TaskCreateInput);
        return { content: [{ type: "text", text: `Task created: ${task.id}` }] };
      }

      case "update_task": {
        const { id, ...updates } = args as unknown as { id: string } & TaskUpdateInput;
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

      case "list_objectives": {
        const objectives = ObjectiveRepository.list();
        return { content: [{ type: "text", text: JSON.stringify(objectives, null, 2) }] };
      }

      case "create_objective": {
        const objective = ObjectiveRepository.create(args as unknown as ObjectiveCreateInput);
        return { content: [{ type: "text", text: `Objective created: ${objective.id}` }] };
      }

      case "update_objective": {
        const { id, ...updates } = args as unknown as { id: string } & ObjectiveUpdateInput;
        const objective = ObjectiveRepository.update(id, updates);
        return {
          content: [{ type: "text", text: objective ? `Objective ${id} updated` : "Objective not found" }],
          isError: !objective
        };
      }

      case "delete_objective": {
        const { id } = args as { id: string };
        const success = ObjectiveRepository.remove(id);
        return {
          content: [{ type: "text", text: success ? `Objective ${id} deleted` : "Objective not found" }],
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
