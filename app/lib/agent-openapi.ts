import type { OpenApiDocument } from '@plugins/agent-gate';

/**
 * The agent-facing surface of the todos app. Everything an external agent
 * (Custom GPTs, etc.) may touch lives under /api/agent/*; agent-gate filters
 * this document per agent and enforces the same permissions at runtime.
 *
 * The UI's own routes (/api/tasks, /api/objectives, …) are NOT part of this
 * boundary — they stay unauthenticated for the frontend.
 */

const taskStatus = { type: 'string', enum: ['ready', 'active', 'blocked', 'waiting', 'parked', 'done'] };
const taskPriority = { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] };
const itemType = { type: 'string', enum: ['action', 'decision', 'initiative', 'idea', 'maintenance'] };

export const agentOpenApi: OpenApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'Todos — Agent API',
    version: '0.1.0',
    description:
      'Agent boundary of the todos app. Objectives model the doctrine: missions govern ' +
      '(perpetual), campaigns execute (bounded, target-dated), parking lots hold. ' +
      'Tasks bind to objectives; the recommendation engine scores ready work.',
  },
  paths: {
    '/api/agent/tasks': {
      get: {
        operationId: 'listTasks',
        tags: ['tasks'],
        summary: 'List tasks, optionally filtered by status, objective, item type, or free-text search',
        parameters: [
          { name: 'status', in: 'query', schema: { ...taskStatus, enum: [...taskStatus.enum, 'all'] } },
          { name: 'objectiveId', in: 'query', schema: { type: 'string' } },
          { name: 'itemType', in: 'query', schema: itemType },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Matching tasks',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { tasks: { type: 'array', items: { $ref: '#/components/schemas/Task' } } },
                },
              },
            },
          },
        },
      },
      post: {
        operationId: 'createTask',
        tags: ['tasks'],
        summary: 'Create a task, optionally bound to an objective and/or nested under a parent item',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/TaskCreate' } } },
        },
        responses: {
          '201': {
            description: 'The created task',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Task' } } },
          },
        },
      },
    },
    '/api/agent/tasks/{id}': {
      get: {
        operationId: 'getTask',
        tags: ['tasks'],
        summary: 'Fetch one task with its labels and comments',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'The task',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Task' } } },
          },
          '404': { description: 'Task not found' },
        },
      },
      patch: {
        operationId: 'updateTask',
        tags: ['tasks'],
        summary: 'Update a task (status transitions, rebinding, due dates, …)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/TaskUpdate' } } },
        },
        responses: {
          '200': {
            description: 'The updated task',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Task' } } },
          },
          '404': { description: 'Task not found' },
        },
      },
    },
    '/api/agent/tasks/{id}/comments': {
      post: {
        operationId: 'addComment',
        tags: ['tasks'],
        summary: 'Append a comment to a task (outcomes, residual notes, context)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['content'],
                properties: { content: { type: 'string', description: 'The comment body' } },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'The stored comment',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Comment' } } },
          },
          '404': { description: 'Task not found' },
        },
      },
    },
    '/api/agent/objectives': {
      get: {
        operationId: 'listObjectives',
        tags: ['objectives'],
        summary: 'List all objectives (missions, campaigns, parking lots) with item counts',
        responses: {
          '200': {
            description: 'All objectives',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    objectives: { type: 'array', items: { $ref: '#/components/schemas/Objective' } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        operationId: 'createObjective',
        tags: ['objectives'],
        summary: 'Create an objective. Campaigns accept a targetDate and start active.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ObjectiveCreate' } } },
        },
        responses: {
          '201': {
            description: 'The created objective',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Objective' } } },
          },
        },
      },
    },
    '/api/agent/objectives/{id}': {
      patch: {
        operationId: 'updateObjective',
        tags: ['objectives'],
        summary:
          'Update an objective. For campaigns, set campaignStatus to parked/complete/abandoned to hold or close them.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ObjectiveUpdate' } } },
        },
        responses: {
          '200': {
            description: 'The updated objective',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Objective' } } },
          },
          '404': { description: 'Objective not found' },
        },
      },
    },
    '/api/agent/recommendation': {
      get: {
        operationId: 'recommendNextMove',
        tags: ['recommendation'],
        summary:
          'The single highest-scoring ready task, with narrative and per-factor score breakdown. Campaign deadline pressure included.',
        responses: {
          '200': {
            description: 'The recommendation, or null when nothing is ready',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    recommendation: { $ref: '#/components/schemas/Recommendation' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Task: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          status: taskStatus,
          priority: taskPriority,
          itemType: itemType,
          objectiveId: { type: 'string', description: 'Bound objective, or null' },
          parentItemId: { type: 'string', description: 'Parent initiative/maintenance item, or null' },
          dueDate: { type: 'string', description: 'YYYY-MM-DD or null' },
          completedAt: { type: 'string', description: 'Set when status becomes done' },
          comments: { type: 'array', items: { $ref: '#/components/schemas/Comment' } },
        },
      },
      TaskCreate: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          status: taskStatus,
          priority: taskPriority,
          itemType: itemType,
          objectiveId: { type: 'string' },
          parentItemId: { type: 'string' },
          dueDate: { type: 'string', description: 'YYYY-MM-DD' },
        },
      },
      TaskUpdate: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          status: taskStatus,
          priority: taskPriority,
          itemType: itemType,
          objectiveId: { type: 'string', description: 'Pass null to unbind' },
          parentItemId: { type: 'string', description: 'Pass null to detach' },
          dueDate: { type: 'string', description: 'YYYY-MM-DD, or null to clear' },
        },
      },
      Comment: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          taskId: { type: 'string' },
          content: { type: 'string' },
          createdAt: { type: 'string' },
        },
      },
      Objective: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          objectiveType: { type: 'string', enum: ['mission', 'campaign', 'parking_lot'] },
          description: { type: 'string' },
          targetDate: { type: 'string', description: 'Campaign only: YYYY-MM-DD or null' },
          campaignStatus: {
            type: 'string',
            enum: ['active', 'parked', 'complete', 'abandoned'],
            description: 'Campaign only; null for other types',
          },
          itemCount: { type: 'integer' },
        },
      },
      ObjectiveCreate: {
        type: 'object',
        required: ['title', 'objectiveType'],
        properties: {
          title: { type: 'string' },
          objectiveType: { type: 'string', enum: ['mission', 'campaign', 'parking_lot'] },
          description: { type: 'string' },
          targetDate: { type: 'string', description: 'Campaign only: YYYY-MM-DD' },
        },
      },
      ObjectiveUpdate: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          targetDate: { type: 'string', description: 'Campaign only: YYYY-MM-DD' },
          campaignStatus: { type: 'string', enum: ['active', 'parked', 'complete', 'abandoned'] },
        },
      },
      Recommendation: {
        type: 'object',
        properties: {
          task: { $ref: '#/components/schemas/Task' },
          score: { type: 'number' },
          narrative: { type: 'string' },
          factors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                key: { type: 'string' },
                label: { type: 'string' },
                points: { type: 'number' },
              },
            },
          },
        },
      },
    },
  },
};
