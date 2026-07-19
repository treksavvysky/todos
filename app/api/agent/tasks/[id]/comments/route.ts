import { NextRequest, NextResponse } from 'next/server';
import { requireAgent } from '@plugins/agent-gate-next';
import { gate } from '@/app/lib/gate';
import { CommentRepository, TaskRepository } from '@/app/lib/repositories';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireAgent(gate, request);
  if (access instanceof Response) return access;

  const { id } = await params;
  if (!TaskRepository.getById(id)) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  const body = await request.json();
  if (!body.content || typeof body.content !== 'string' || body.content.trim() === '') {
    return NextResponse.json({ error: 'content is required' }, { status: 400 });
  }

  const comment = CommentRepository.create(id, body.content.trim());
  return NextResponse.json(comment, { status: 201 });
}
