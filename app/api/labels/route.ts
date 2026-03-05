import { NextRequest, NextResponse } from 'next/server';
import { LabelRepository } from '@/app/lib/repositories';

export async function GET(request: NextRequest) {
  const kind = request.nextUrl.searchParams.get('kind') || undefined;
  const labels = LabelRepository.list(kind);
  return NextResponse.json({ labels });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.name || !body.kind) {
    return NextResponse.json({ error: 'name and kind are required' }, { status: 400 });
  }
  if (!['scope', 'project'].includes(body.kind)) {
    return NextResponse.json({ error: 'kind must be "scope" or "project"' }, { status: 400 });
  }

  try {
    const label = LabelRepository.create({
      name: body.name,
      kind: body.kind,
      color: body.color,
    });
    return NextResponse.json(label, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('UNIQUE constraint')) {
      return NextResponse.json({ error: 'A label with that name and kind already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
