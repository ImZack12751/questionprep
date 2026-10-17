import { answerKey, attemptSummary, optionLetter, totalMarks } from '../attempt/answers';
import type { Answer, Attempt } from '../attempt/types';

import type { Answerable, Question } from '../paper/schema';
import { formatDuration } from '../../lib/format';

export type ExportedAnswer = string | string[] | null;

interface ExportedItem {
  type: Answerable['type'];
  marks: number;
  text: string;
  options?: string[];
  allowMultiple?: boolean;
  blanks?: number;
  /** null when unanswered. mcq: chosen option(s) as "B. text"; math: LaTeX; fill_blank: one entry per blank. */
  answer: ExportedAnswer;
}

export interface ExportedQuestion extends Partial<Omit<ExportedItem, 'type'>> {
  id: string;
  number: number;
  type: Question['type'];
  marks: number;
  text: string;
  flagged: boolean;
  /** Ids of the contexts (sources) this question uses; see AttemptExport.contexts. */
  contextIds?: string[];
  parts?: (ExportedItem & { label: string })[];
}

export interface AttemptExport {
  format: 'questionprep-attempt';
  version: 1;
  markingNote: string;
  paper: { title: string; subject?: string; durationMinutes: number; totalMarks: number; instructions?: string };
  attempt: {
    startedAt: string;
    submittedAt: string | null;
    timeTakenSeconds: number;
    timeTaken: string;
    autoSubmittedWhenTimeRanOut: boolean;
    questionsAnswered: number;
    questionsPartlyAnswered: number;
    totalQuestions: number;
    flaggedCount: number;
  };
  /** Shared background material (sources, case studies, data) referenced by questions' contextIds. */
  contexts?: { id: string; label: string; title?: string; text: string }[];
  sections: { title: string; instructions?: string; questions: ExportedQuestion[] }[];
}

export const MARKING_NOTE =
  'Student answers from a timed practice exam taken in Questionprep. Please mark each answer against the question and its marks, ' +
  'give the marks awarded with brief feedback, and a total out of paper.totalMarks. Maths answers are LaTeX. ' +
  'Flagged questions were ones the student marked for review. Questions with contextIds refer to the sources in "contexts".';

export function exportAnswer(item: Answerable, a: Answer | undefined): ExportedAnswer {
  if (!a) return null;
  switch (a.type) {
    case 'mcq': {
      if (item.type !== 'mcq' || !a.selected.length) return null;
      const chosen = a.selected.map((i) => `${optionLetter(i)}. ${item.options[i] ?? ''}`);
      return item.allowMultiple ? chosen : chosen[0]!;
    }
    case 'typed':
      return a.text.trim() ? a.text : null;
    case 'math':
      return a.latex.trim() ? a.latex : null;
    case 'fill_blank': {
      const n = item.type === 'fill_blank' ? item.blanks : a.values.length;
      const vals = Array.from({ length: n }, (_, i) => a.values[i] ?? '');
      return vals.some((v) => v.trim()) ? vals : null;
    }
  }
}

function exportItem(item: Answerable, a: Answer | undefined): ExportedItem {
  return {
    type: item.type,
    marks: item.marks,
    text: item.text,
    ...(item.type === 'mcq' ? { options: item.options, allowMultiple: item.allowMultiple } : {}),
    ...(item.type === 'fill_blank' ? { blanks: item.blanks } : {}),
    answer: exportAnswer(item, a),
  };
}

export function buildExport(attempt: Attempt): AttemptExport {
  const { paper } = attempt;
  const s = attemptSummary(attempt);
  let number = 0;
  return {
    format: 'questionprep-attempt',
    version: 1,
    markingNote: MARKING_NOTE,
    paper: {
      title: paper.title,
      ...(paper.subject ? { subject: paper.subject } : {}),
      durationMinutes: paper.durationMinutes,
      totalMarks: totalMarks(paper),
      ...(paper.instructions ? { instructions: paper.instructions } : {}),
    },
    attempt: {
      startedAt: new Date(attempt.startedAt).toISOString(),
      submittedAt: attempt.submittedAt ? new Date(attempt.submittedAt).toISOString() : null,
      timeTakenSeconds: Math.round(attempt.elapsedMs / 1000),
      timeTaken: formatDuration(attempt.elapsedMs),
      autoSubmittedWhenTimeRanOut: !!attempt.autoSubmitted,
      questionsAnswered: s.answered,
      questionsPartlyAnswered: s.partial,
      totalQuestions: s.total,
      flaggedCount: s.flagged,
    },
    ...(paper.contexts?.length ? { contexts: paper.contexts } : {}),
    sections: paper.sections.map((sec) => ({
      title: sec.title,
      ...(sec.instructions ? { instructions: sec.instructions } : {}),
      questions: sec.questions.map((q): ExportedQuestion => {
        number++;
        const flagged = !!attempt.flags[q.id];
        const ctx = q.contextIds?.length ? { contextIds: q.contextIds } : {};
        if (q.type === 'multipart') {
          return {
            id: q.id,
            number,
            type: q.type,
            marks: q.marks,
            text: q.text,
            ...ctx,
            flagged,
            parts: q.parts.map((p) => ({ label: p.label, ...exportItem(p, attempt.answers[answerKey(q.id, p.label)]) })),
          };
        }
        return { id: q.id, number, ...ctx, ...exportItem(q, attempt.answers[q.id]), flagged };
      }),
    })),
  };
}

export function toJson(attempt: Attempt): string {
  return JSON.stringify(buildExport(attempt), null, 2);
}
