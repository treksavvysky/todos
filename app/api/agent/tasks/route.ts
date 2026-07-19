import { NextRequest, NextResponse } from 'next/server';
import { requireAgent } from '@plugins/agent-gate-next';
import { gate } from '@/app/lib/gate';
import { TaskRepository } from '@/app/lib/repositories';
import type { TaskFilters } from '@/app/lib/types';

export async function GET(request: NextRequest) {
  const access = await requireAgent(gate, request);
  if (access instanceof Response) return access;

  const sp = request.nextUrl.searchParams;
  const filters: TaskFilters = {};
  const status = sp.get('status');
  const objectiveId = sp.get('objectiveId');
  const itemType = sp.get('itemType');
  const search = sp.get('search');

  if (status) filters.status = status as TaskFilters['status'];
  if (objectiveId) filters.objectiveId = objectiveId;
  if (itemType) filters.itemType = itemType as TaskFilters['itemType'];
  if (search) filters.search = search;

  const tasks = TaskRepository.list(filters);
  return NextResponse.json({ tasks });
}

export async function POST(request: NextRequest) {
  const access = await requireAgent(gate, request);
  if (access instanceof Response) return access;

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
  });

  return NextResponse.json(task, { status: 201 });
}
