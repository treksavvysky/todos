import { NextRequest, NextResponse } from 'next/server';
import { requireAgent } from '@plugins/agent-gate-next';
import { gate } from '@/app/lib/gate';
import { ObjectiveRepository, TaskRepository } from '@/app/lib/repositories';
import { recommendNextMove } from '@/app/lib/recommendation-engine';

export async function GET(request: NextRequest) {
  const access = await requireAgent(gate, request);
  if (access instanceof Response) return access;

  const tasks = TaskRepository.list({ status: 'all' });
  const recommendation = recommendNextMove(tasks, ObjectiveRepository.list());
  return NextResponse.json({ recommendation });
}
