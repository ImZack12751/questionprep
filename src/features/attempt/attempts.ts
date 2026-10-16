import { newId, saveAttempt } from '../../lib/db';
import type { Attempt, PaperRecord } from './types';

export async function createAttempt(rec: PaperRecord): Promise<Attempt> {
  const now = Date.now();
  const attempt: Attempt = {
    id: newId(),
    paperId: rec.id,
    paper: rec.paper,
    status: 'in_progress',
    startedAt: now,
    updatedAt: now,
    durationMs: Math.round(rec.paper.durationMinutes * 60_000),
    elapsedMs: 0,
    answers: {},
    flags: {},
    currentSection: 0,
  };
  await saveAttempt(attempt);
  return attempt;
}

export function submitted(a: Attempt, auto = false): Attempt {
  const now = Date.now();
  return { ...a, status: 'submitted', submittedAt: now, updatedAt: now, autoSubmitted: auto, elapsedMs: Math.min(a.elapsedMs, a.durationMs) };
}
