import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { TaskRepository, LabelRepository, ObjectiveRepository, CommentRepository } from "../app/lib/repositories.js";
import { recommendNextMove } from "../app/lib/recommendation-engine.js";
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
        description: "Update an existing task's fields. If status transitions to/from 'done', completedAt is auto-managed unless an explicit completedAt is provided (backdating supported).",
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
            completedAt: { type: "string", description: "ISO timestamp of when the task was actually completed. Use for backdating. If omitted, the repository auto-manages based on status transitions." },
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
        name: "recommend_next_move",
        description: "Returns the single highest-scoring ready task as a deterministic recommendation, with a narrative explanation and per-factor score breakdown. Pure query, no side effects. Returns { recommendation: null } when nothing is ready.",
        inputSchema: { type: "object", properties: {} },
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
      {
        name: "add_comment",
        description: "Append a comment to a task. Comments are append-only notes attached to a task — useful for recording outcomes, residual notes, or context that doesn't fit in the description.",
        inputSchema: {
          type: "object",
          properties: {
            taskId: { type: "string", description: "ID of the task to comment on." },
            content: { type: "string", description: "The comment body (markdown supported in the UI)." },
          },
          required: ["taskId", "content"],
        },
      },
      {
        name: "list_comments",
        description: "Fetch all comments for a given task, oldest first. Note: get_task already returns the embedded comments array; use this when you only need comments and want to avoid the full task payload.",
        inputSchema: {
          type: "object",
          properties: {
            taskId: { type: "string" },
          },
          required: ["taskId"],
        },
      },
      {
        name: "delete_comment",
        description: "Permanently delete a comment by id.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
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

      case "recommend_next_move": {
        const tasks = TaskRepository.list({ status: 'all' });
        const recommendation = recommendNextMove(tasks);
        const payload = recommendation
          ? {
              recommendation: {
                task: {
                  id: recommendation.task.id,
                  title: recommendation.task.title,
                  status: recommendation.task.status,
                  priority: recommendation.task.priority,
                  itemType: recommendation.task.itemType,
                  objectiveId: recommendation.task.objectiveId,
                  parentItemId: recommendation.task.parentItemId,
                  createdAt: recommendation.task.createdAt,
                },
                score: recommendation.score,
                factors: recommendation.factors,
                narrative: recommendation.narrative,
              },
            }
          : { recommendation: null };
        return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }] };
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

      case "add_comment": {
        const { taskId, content } = args as { taskId: string; content: string };
        // Verify the task exists before creating a comment attached to it.
        // Prevents orphan comments from client typos.
        const task = TaskRepository.getById(taskId);
        if (!task) {
          return {
            content: [{ type: "text", text: `Task not found: ${taskId}` }],
            isError: true,
          };
        }
        const comment = CommentRepository.create(taskId, content);
        return { content: [{ type: "text", text: JSON.stringify(comment, null, 2) }] };
      }

      case "list_comments": {
        const { taskId } = args as { taskId: string };
        const comments = CommentRepository.listForTask(taskId);
        return { content: [{ type: "text", text: JSON.stringify(comments, null, 2) }] };
      }

      case "delete_comment": {
        const { id } = args as { id: string };
        const success = CommentRepository.remove(id);
        return {
          content: [{ type: "text", text: success ? `Comment ${id} deleted` : "Comment not found" }],
          isError: !success,
        };
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
