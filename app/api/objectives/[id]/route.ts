import { NextRequest, NextResponse } from 'next/server';
import { ObjectiveRepository } from '@/app/lib/repositories';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const objective = ObjectiveRepository.getById(id);

  if (!objective) {
    return NextResponse.json({ error: 'Objective not found' }, { status: 404 });
  }

  return NextResponse.json(objective);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const objective = ObjectiveRepository.update(id, {
    title: body.title,
    description: body.description,
  });

  if (!objective) {
    return NextResponse.json({ error: 'Objective not found' }, { status: 404 });
  }

  return NextResponse.json(objective);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = ObjectiveRepository.remove(id);

  if (!deleted) {
    return NextResponse.json({ error: 'Objective not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
