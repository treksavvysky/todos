import { createGateHandlers } from '@plugins/agent-gate-next';
import { gate } from '@/app/lib/gate';

export const { GET, POST, PATCH, DELETE } = createGateHandlers(gate);
