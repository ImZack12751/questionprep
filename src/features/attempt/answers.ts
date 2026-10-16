import type { Answerable, Paper, Question } from '../paper/schema';
import type { Answer, Attempt } from './types';

/** Storage key for an answer: the question id, plus the part label for multipart parts. */
export function answerKey(questionId: string, partLabel?: string): string {
  return partLabel === undefined ? questionId : `${questionId}::${partLabel}`;
}

export function isAnswered(item: Answerable, answer: Answer | undefined): boolean {
  if (!answer) return false;
  switch (answer.type) {
    case 'mcq':
      return answer.selected.length > 0;
    case 'typed':
      return answer.text.trim() !== '';
    case 'math':
      return answer.latex.trim() !== '';
    case 'fill_blank': {
      const n = item.type === 'fill_blank' ? item.blanks : answer.values.length;
      for (let i = 0; i < n; i++) if (!answer.values[i]?.trim()) return false;
      return true;
    }
  }
}

export type QuestionStatus = 'empty' | 'partial' | 'complete';

export function questionStatus(q: Question, answers: Attempt['answers']): QuestionStatus {
  if (q.type !== 'multipart') {
    const a = answers[q.id];
    if (isAnswered(q, a)) return 'complete';
    if (a?.type === 'fill_blank' && a.values.some((v) => v.trim())) return 'partial';
    return 'empty';
  }
  const done = q.parts.filter((p) => isAnswered(p, answers[answerKey(q.id, p.label)])).length;
  return done === 0 ? 'empty' : done === q.parts.length ? 'complete' : 'partial';
}

export function allQuestions(paper: Paper) {
  return paper.sections.flatMap((s, si) => s.questions.map((q, qi) => ({ q, sectionIndex: si, number: qi + 1 })));
}

export function totalMarks(paper: Paper): number {
  return paper.sections.reduce((t, s) => t + s.questions.reduce((u, q) => u + q.marks, 0), 0);
}

export function attemptSummary(attempt: Attempt) {
  const qs = allQuestions(attempt.paper);
  let answered = 0;
  let partial = 0;
  for (const { q } of qs) {
    const s = questionStatus(q, attempt.answers);
    if (s === 'complete') answered++;
    else if (s === 'partial') partial++;
  }
  const flagged = qs.filter(({ q }) => attempt.flags[q.id]).length;
  return { total: qs.length, answered, partial, flagged };
}

export const optionLetter = (i: number) => String.fromCharCode(65 + i);
