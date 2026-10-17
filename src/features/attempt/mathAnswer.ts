import type { Answer } from './types';

type MathAnswer = Extract<Answer, { type: 'math' }>;

/** The lines of a maths answer; answers saved before multi-line support become one line. */
export function mathLines(a: MathAnswer | undefined): string[] {
  if (!a) return [''];
  if (a.lines?.length) return a.lines;
  return [a.latex];
}

/** Lines worth showing or exporting: inner blank lines are kept, trailing ones dropped. */
export function visibleMathLines(a: MathAnswer | undefined): string[] {
  const lines = mathLines(a).map((l) => l.trim());
  while (lines.length && !lines[lines.length - 1]) lines.pop();
  while (lines.length && !lines[0]) lines.shift();
  return lines;
}

export function makeMathAnswer(lines: string[]): MathAnswer {
  const filled = lines.map((l) => l.trim()).filter(Boolean);
  return { type: 'math', latex: filled.join(' \\\\ '), lines: [...lines] };
}
