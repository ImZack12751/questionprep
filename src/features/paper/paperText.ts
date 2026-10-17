import type { Paper } from './schema';

/** All human-readable text in a paper, joined with spaces. */
export function paperText(paper: Paper): string {
  const out: string[] = [paper.title, paper.subject ?? '', paper.instructions ?? ''];
  for (const c of paper.contexts ?? []) out.push(c.label, c.title ?? '', c.text);
  for (const s of paper.sections) {
    out.push(s.title, s.instructions ?? '');
    for (const q of s.questions) {
      out.push(q.text);
      const items = q.type === 'multipart' ? q.parts : [q];
      for (const it of items) {
        out.push(it.text);
        if (it.type === 'mcq') out.push(...it.options);
      }
    }
  }
  return out.join(' ');
}
