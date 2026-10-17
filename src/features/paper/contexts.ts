import type { Context, Paper, Section } from './schema';

/** A context card as it appears above one question. */
export interface PlacedContext {
  context: Context;
  /** Unique DOM id for this card instance. */
  domId: string;
  /** True for the first question in a run of consecutive questions sharing this context. */
  firstInRun: boolean;
  /** Question number where the current run started (the card is shown in full there). */
  runStartNumber: number;
}

export function contextMap(paper: Paper): Map<string, Context> {
  return new Map((paper.contexts ?? []).map((c) => [c.id, c]));
}

/**
 * Works out the context cards to show above each question of a section, in
 * the order listed in contextIds. A context shared by consecutive questions
 * starts a run; later questions in the run show it collapsed.
 */
export function placeContexts(paper: Paper, section: Section, firstNumber: number): Map<string, PlacedContext[]> {
  const byId = contextMap(paper);
  const out = new Map<string, PlacedContext[]>();
  const runStart = new Map<string, number>();
  let previous = new Set<string>();

  section.questions.forEach((q, i) => {
    const number = firstNumber + i;
    const ids = q.contextIds ?? [];
    const placed: PlacedContext[] = [];
    for (const id of ids) {
      const context = byId.get(id);
      if (!context) continue;
      const continues = previous.has(id);
      if (!continues) runStart.set(id, number);
      placed.push({ context, domId: `ctx-${q.id}-${id}`, firstInRun: !continues, runStartNumber: runStart.get(id)! });
    }
    out.set(q.id, placed);
    previous = new Set(ids);
  });
  return out;
}

/** Numbers of the first question of each section, in order. */
export function sectionFirstNumbers(paper: Paper): number[] {
  let n = 1;
  return paper.sections.map((s) => {
    const first = n;
    n += s.questions.length;
    return first;
  });
}
