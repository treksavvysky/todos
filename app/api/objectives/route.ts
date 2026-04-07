import { NextRequest, NextResponse } from 'next/server';
import { ObjectiveRepository } from '@/app/lib/repositories';

export async function GET() {
  const objectives = ObjectiveRepository.list();
  return NextResponse.json({ objectives });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.title || typeof body.title !== 'string' || body.title.trim() === '') {
    return NextResponse.json({ error: 'title is required' }, { status: 400 });
  }

  if (!body.objectiveType || !['mission', 'parking_lot'].includes(body.objectiveType)) {
    return NextResponse.json({ error: 'objectiveType must be mission or parking_lot' }, { status: 400 });
  }

  const objective = ObjectiveRepository.create({
    title: body.title.trim(),
    objectiveType: body.objectiveType,
    description: body.description,
  });

  return NextResponse.json(objective, { status: 201 });
}
