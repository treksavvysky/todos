import { NextRequest, NextResponse } from 'next/server';
import { requireAgent } from '@plugins/agent-gate-next';
import { gate } from '@/app/lib/gate';
import { TaskRepository } from '@/app/lib/repositories';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireAgent(gate, request);
  if (access instanceof Response) return access;

  const { id } = await params;
  const task = TaskRepository.getById(id);
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  return NextResponse.json(task);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireAgent(gate, request);
  if (access instanceof Response) return access;

  const { id } = await params;
  const body = await request.json();
  const task = TaskRepository.update(id, {
    title: body.title,
    description: body.description,
    status: body.status,
    priority: body.priority,
    itemType: body.itemType,
    objectiveId: body.objectiveId,
    parentItemId: body.parentItemId,
    dueDate: body.dueDate,
  });
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  return NextResponse.json(task);
}
