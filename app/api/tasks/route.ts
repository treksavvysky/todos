import { NextRequest, NextResponse } from 'next/server';
import { TaskRepository } from '@/app/lib/repositories';
import type { TaskFilters } from '@/app/lib/types';

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;

  const filters: TaskFilters = {};
  const status = sp.get('status');
  const priority = sp.get('priority');
  const scopeId = sp.get('scopeId');
  const projectId = sp.get('projectId');
  const generalOnly = sp.get('generalOnly') === 'true';
  const search = sp.get('search');
  const sortBy = sp.get('sortBy');
  const sortOrder = sp.get('sortOrder');

  const itemType = sp.get('itemType');
  const objectiveId = sp.get('objectiveId');
  const parentItemId = sp.get('parentItemId');
  const orphanedOnly = sp.get('orphanedOnly') === 'true';

  if (status) filters.status = status as TaskFilters['status'];
  if (priority) filters.priority = priority as TaskFilters['priority'];
  if (itemType) filters.itemType = itemType as TaskFilters['itemType'];
  if (objectiveId) filters.objectiveId = objectiveId;
  if (parentItemId) filters.parentItemId = parentItemId;
  if (orphanedOnly) filters.orphanedOnly = true;
  if (scopeId) filters.scopeId = scopeId;
  if (projectId) filters.projectId = projectId;
  if (generalOnly) filters.generalOnly = true;
  if (search) filters.search = search;
  if (sortBy) filters.sortBy = sortBy as TaskFilters['sortBy'];
  if (sortOrder) filters.sortOrder = sortOrder as TaskFilters['sortOrder'];

  const tasks = TaskRepository.list(filters);
  return NextResponse.json({ tasks });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.title || typeof body.title !== 'string' || body.title.trim() === '') {
    return NextResponse.json({ error: 'title is required' }, { status: 400 });
  }

  const task = TaskRepository.create({
    title: body.title.trim(),
    description: body.description,
    status: body.status,
    priority: body.priority,
    itemType: body.itemType,
    objectiveId: body.objectiveId,
    parentItemId: body.parentItemId,
    dueDate: body.dueDate,
    labelIds: body.labelIds,
  });

  return NextResponse.json(task, { status: 201 });
}
