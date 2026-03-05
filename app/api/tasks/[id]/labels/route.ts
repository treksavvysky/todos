import { NextRequest, NextResponse } from 'next/server';
import { TaskRepository } from '@/app/lib/repositories';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const existing = TaskRepository.getById(id);
  if (!existing) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  if (!Array.isArray(body.labelIds)) {
    return NextResponse.json({ error: 'labelIds must be an array' }, { status: 400 });
  }

  const labels = TaskRepository.setLabels(id, body.labelIds);
  return NextResponse.json({ labels });
}
