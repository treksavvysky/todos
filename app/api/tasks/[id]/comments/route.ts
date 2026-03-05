import { NextRequest, NextResponse } from 'next/server';
import { TaskRepository } from '@/app/lib/repositories';
import { CommentRepository } from '@/app/lib/repositories';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = TaskRepository.getById(id);
  if (!existing) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  const comments = CommentRepository.listForTask(id);
  return NextResponse.json({ comments });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const existing = TaskRepository.getById(id);
  if (!existing) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  if (!body.content || typeof body.content !== 'string' || body.content.trim() === '') {
    return NextResponse.json({ error: 'content is required' }, { status: 400 });
  }

  const comment = CommentRepository.create(id, body.content.trim());
  return NextResponse.json(comment, { status: 201 });
}
