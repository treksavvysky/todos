import { NextRequest, NextResponse } from 'next/server';
import { LabelRepository } from '@/app/lib/repositories';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const label = LabelRepository.update(id, {
    name: body.name,
    color: body.color,
  });

  if (!label) {
    return NextResponse.json({ error: 'Label not found' }, { status: 404 });
  }

  return NextResponse.json(label);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = LabelRepository.remove(id);

  if (!deleted) {
    return NextResponse.json({ error: 'Label not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
