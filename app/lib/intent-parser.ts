import type { TaskPriority, TaskCreateInput, Label } from './types';

interface ParseResult {
  task: TaskCreateInput;
  confidence: number;
}

const PRIORITY_KEYWORDS: Record<string, TaskPriority> = {
  'urgent': 'urgent',
  'high': 'high',
  'asap': 'high',
  'medium': 'medium',
  'important': 'medium',
  'low': 'low',
  'minor': 'low',
};

/**
 * Heuristic-based parser for "Brain-Dump" intent extraction.
 * This is Phase 1 (Local-First).
 */
export function parseTaskIntent(input: string, allLabels: Label[]): ParseResult {
  const normalized = input.toLowerCase();
  let title = input;
  let priority: TaskPriority = 'medium';
  let dueDate: string | null = null;
  const labelIds: string[] = [];
  let confidence = 0.5; // Base confidence for simple heuristic

  // 1. Priority Detection
  for (const [kw, p] of Object.entries(PRIORITY_KEYWORDS)) {
    if (new RegExp(`\\b${kw}\\b`, 'i').test(normalized)) {
      priority = p;
      confidence += 0.1;
      // Optionally strip the keyword from title?
      // title = title.replace(new RegExp(`\\s*${kw}\\s*`, 'gi'), ' ');
    }
  }

  // 2. Label Detection (Scopes & Projects)
  for (const label of allLabels) {
    if (normalized.includes(label.name.toLowerCase())) {
      labelIds.push(label.id);
      confidence += 0.2;
    }
  }

  // 3. Basic Date Detection (Simple relative dates)
  // Note: For a real app, use chrono-node here.
  const today = new Date();
  if (/\btomorrow\b/i.test(normalized)) {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    dueDate = d.toISOString().split('T')[0];
    confidence += 0.2;
  } else if (/\bnext week\b/i.test(normalized)) {
    const d = new Date(today);
    d.setDate(d.getDate() + 7);
    dueDate = d.toISOString().split('T')[0];
    confidence += 0.2;
  } else if (/\btoday\b/i.test(normalized)) {
    dueDate = today.toISOString().split('T')[0];
    confidence += 0.2;
  }

  // 4. Title Refinement
  // In a real LLM implementation, the title would be "cleaned up" (e.g., removing date/priority markers)
  // For now, we keep the original string but trim it.
  title = title.trim();

  return {
    task: {
      title,
      priority,
      dueDate,
      labelIds,
      status: 'pending',
    },
    confidence: Math.min(confidence, 1.0),
  };
}

/**
 * AI-Enhanced parser (Phase 2 - Optional fallback)
 * This would call an LLM (Gemini) for complex parsing.
 */
export async function parseTaskIntentAI(input: string, allLabels: Label[]): Promise<ParseResult> {
  // TODO: Call Gemini API to parse the string into JSON
  // For now, it just falls back to heuristic
  return parseTaskIntent(input, allLabels);
}
