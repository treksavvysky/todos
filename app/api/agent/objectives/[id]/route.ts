import { NextRequest, NextResponse } from 'next/server';
import { requireAgent } from '@plugins/agent-gate-next';
import { gate } from '@/app/lib/gate';
import { ObjectiveRepository } from '@/app/lib/repositories';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireAgent(gate, request);
  if (access instanceof Response) return access;

  const { id } = await params;
  const body = await request.json();

  if (body.campaignStatus !== undefined && !['active', 'parked', 'complete', 'abandoned'].includes(body.campaignStatus)) {
    return NextResponse.json({ error: 'campaignStatus must be active, parked, complete, or abandoned' }, { status: 400 });
  }

  const objective = ObjectiveRepository.update(id, {
    title: body.title,
    description: body.description,
    targetDate: body.targetDate,
    campaignStatus: body.campaignStatus,
  });
  if (!objective) return NextResponse.json({ error: 'Objective not found' }, { status: 404 });
  return NextResponse.json(objective);
}
