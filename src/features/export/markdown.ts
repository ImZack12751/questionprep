import { plural } from '../../lib/format';
import { htmlToMarkdown } from '../../lib/richAnswer';
import { answerKey } from '../attempt/answers';
import { buildExport, type ExportedAnswer, type ExportedQuestion } from './exportData';
import type { Attempt } from '../attempt/types';
import { optionLetter } from '../attempt/answers';


type Item = Pick<ExportedQuestion, 'type' | 'text' | 'options' | 'blanks' | 'allowMultiple'> & { answer?: ExportedAnswer };

const quote = (s: string) =>
  s
    .split('\n')
    .map((l) => `> ${l}`)
    .join('\n');

function answerMd(item: Item): string {
  const a = item.answer ?? null;
  if (item.type === 'fill_blank') {
    const vals = Array.isArray(a) ? a : [];
    const filled = item.text.replace(/\{\{\s*(\d+)\s*\}\}/g, (_, n: string) => {
      const v = vals[Number(n) - 1]?.trim();
      return v ? `**[${v}]**` : '**[ ____ ]**';
    });
    const list = Array.from({ length: item.blanks ?? vals.length }, (_, i) => `${i + 1}. ${vals[i]?.trim() || '_(blank)_'}`).join('\n');
    return `${filled}\n\n**Answer${a ? '' : ' (not answered)'}:**\n\n${list}`;
  }
  if (item.type === 'mcq') {
    const chosen = new Set((Array.isArray(a) ? a : a ? [a] : []).map((x) => x.split('.')[0]));
    const opts = (item.options ?? []).map((o, i) => `- ${chosen.has(optionLetter(i)) ? '**[x]**' : '[ ]'} ${optionLetter(i)}. ${o}`).join('\n');
    return `${item.text}\n\n${opts}\n\n**Answer:** ${a ? (Array.isArray(a) ? a.join('; ') : a) : '_Not answered_'}`;
  }
  if (item.type === 'math') {
    if (typeof a !== 'string') return `${item.text}\n\n**Answer:** _Not answered_`;
    const lines = a.split('\n');
    if (lines.length === 1) return `${item.text}\n\n**Answer:** $${a}$`;
    return `${item.text}\n\n**Answer:**\n\n${lines.map((l) => (l.trim() ? `$${l}$` : '')).join('  \n')}`;
  }
  return `${item.text}\n\n**Answer:**\n\n${typeof a === 'string' ? quote(a) : '_Not answered_'}`;
}

export function toMarkdown(attempt: Attempt): string {
  const x = buildExport(attempt);
  /** Typed answers keep the student's formatting in the Markdown export. */
  const formatted = (item: Item, key: string): Item => {
    const a = attempt.answers[key];
    return a?.type === 'typed' && a.html && item.answer ? { ...item, answer: htmlToMarkdown(a.html) } : item;
  };
  const out: string[] = [];
  out.push(`# ${x.paper.title}`, '');
  const meta = [
    x.paper.subject && `**Subject:** ${x.paper.subject}`,
    `**Total marks:** ${x.paper.totalMarks}`,
    `**Time allowed:** ${x.paper.durationMinutes} min`,
    `**Time taken:** ${x.attempt.timeTaken}${x.attempt.autoSubmittedWhenTimeRanOut ? ' (time ran out)' : ''}`,
    `**Answered:** ${x.attempt.questionsAnswered}/${x.attempt.totalQuestions}`,
    `**Flagged:** ${x.attempt.flaggedCount}`,
  ].filter(Boolean);
  out.push(meta.join('  \n'), '');
  if (x.attempt.submittedAt) out.push(`_Submitted ${new Date(x.attempt.submittedAt).toLocaleString()}_`, '');

  const contexts = new Map((x.contexts ?? []).map((c) => [c.id, c]));
  x.sections.forEach((s, si) => {
    out.push('---', '', `## Section ${si + 1}: ${s.title}`, '');
    if (s.instructions) out.push(`_${s.instructions}_`, '');
    let previous = new Set<string>();
    for (const q of s.questions) {
      // Sources go above the question: in full at the start of a run, as a reference after that.
      for (const id of q.contextIds ?? []) {
        const c = contexts.get(id);
        if (!c) continue;
        const heading = `**${c.label}**${c.title ? ` — ${c.title}` : ''}`;
        out.push(previous.has(id) ? `> ${heading} _(as above)_` : quote(`${heading}\n\n${c.text}`), '');
      }
      previous = new Set(q.contextIds ?? []);
      out.push(`### Question ${q.number} (id: ${q.id}) — ${plural(q.marks, 'mark')}${q.flagged ? ' 🚩 Flagged' : ''}`, '');
      if (q.parts) {
        if (q.text) out.push(q.text, '');
        for (const p of q.parts) {
          out.push(`#### (${p.label}) — ${plural(p.marks, 'mark')}`, '', answerMd(formatted(p, answerKey(q.id, p.label))), '');
        }
      } else {
        out.push(answerMd(formatted(q, q.id)), '');
      }
    }
  });
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}
