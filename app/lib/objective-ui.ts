// Client-safe presentation helpers for objectives. Kept out of utils.ts,
// which imports node:crypto and is server-only.
import type { ObjectiveType } from './types';

const OBJECTIVE_ICONS: Record<ObjectiveType, string> = {
  mission: '🎯',
  campaign: '🚩',
  parking_lot: '🅿️',
};

export function objectiveIcon(type: ObjectiveType): string {
  return OBJECTIVE_ICONS[type];
}

/** Human countdown to a campaign target date, e.g. "12d left", "due today", "3d past". */
export function campaignCountdown(targetDate: string): string {
  const days = Math.ceil((new Date(targetDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  if (days < 0) return `${-days}d past`;
  if (days === 0) return 'due today';
  return `${days}d left`;
}
