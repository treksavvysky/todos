import { NextRequest, NextResponse } from 'next/server';
import { requireAgent } from '@plugins/agent-gate-next';
import { gate } from '@/app/lib/gate';
import { ObjectiveRepository } from '@/app/lib/repositories';

export async function GET(request: NextRequest) {
  const access = await requireAgent(gate, request);
  if (access instanceof Response) return access;

  return NextResponse.json({ objectives: ObjectiveRepository.list() });
}

export async function POST(request: NextRequest) {
  const access = await requireAgent(gate, request);
  if (access instanceof Response) return access;

  const body = await request.json();
  if (!body.title || typeof body.title !== 'string' || body.title.trim() === '') {
    return NextResponse.json({ error: 'title is required' }, { status: 400 });
  }
  if (!body.objectiveType || !['mission', 'campaign', 'parking_lot'].includes(body.objectiveType)) {
    return NextResponse.json({ error: 'objectiveType must be mission, campaign, or parking_lot' }, { status: 400 });
  }

  const objective = ObjectiveRepository.create({
    title: body.title.trim(),
    objectiveType: body.objectiveType,
    description: body.description,
    targetDate: body.targetDate,
  });

  return NextResponse.json(objective, { status: 201 });
}
