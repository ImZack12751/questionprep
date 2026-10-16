import { plural } from '../../lib/format';
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
    return `${item.text}\n\n**Answer:** ${typeof a === 'string' ? `$${a}$` : '_Not answered_'}`;
  }
  return `${item.text}\n\n**Answer:**\n\n${typeof a === 'string' ? quote(a) : '_Not answered_'}`;
}

export function toMarkdown(attempt: Attempt): string {
  const x = buildExport(attempt);
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

  x.sections.forEach((s, si) => {
    out.push('---', '', `## Section ${si + 1}: ${s.title}`, '');
    if (s.instructions) out.push(`_${s.instructions}_`, '');
    for (const q of s.questions) {
      out.push(`### Question ${q.number} (id: ${q.id}) — ${plural(q.marks, 'mark')}${q.flagged ? ' 🚩 Flagged' : ''}`, '');
      if (q.parts) {
        if (q.text) out.push(q.text, '');
        for (const p of q.parts) {
          out.push(`#### (${p.label}) — ${plural(p.marks, 'mark')}`, '', answerMd(p), '');
        }
      } else {
        out.push(answerMd(q), '');
      }
    }
  });
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}
