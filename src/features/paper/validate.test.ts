import { describe, expect, it } from 'vitest';
import { parsePaperJson, validatePaper } from './validate';
import maths from '../../../samples/maths-calculus-algebra.json';
import mixed from '../../../samples/mixed-science-english.json';

const base = () => ({
  title: 'T',
  durationMinutes: 10,
  sections: [
    { title: 'S1', questions: [{ id: 'q1', type: 'typed', marks: 1, text: 'hi' }] },
    {
      title: 'S2',
      questions: [
        { id: 'q2', type: 'typed', marks: 1, text: 'a' },
        { id: 'q3', type: 'typed', marks: 1, text: 'b' },
        { id: 'q4', type: 'mcq', marks: 1, text: 'c', options: ['only one'] },
      ],
    },
  ],
});

describe('validatePaper', () => {
  it('accepts both samples', () => {
    expect(validatePaper(maths).ok).toBe(true);
    expect(validatePaper(mixed).ok).toBe(true);
  });

  it('computes multipart marks from parts', () => {
    const r = validatePaper(maths);
    if (!r.ok) throw new Error(r.errors.join('\n'));
    const a4 = r.paper.sections[0]!.questions[3]!;
    expect(a4.type).toBe('multipart');
    expect(a4.marks).toBe(5);
  });

  it('defaults allowMultiple to false', () => {
    const r = validatePaper(mixed);
    if (!r.ok) throw new Error();
    const s1 = r.paper.sections[0]!.questions[0]!;
    expect(s1.type === 'mcq' && s1.allowMultiple).toBe(false);
  });

  it('gives a located message for too few mcq options', () => {
    const r = validatePaper(base());
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors).toEqual(['Section 2, question 3 ("q4"): mcq needs at least 2 options']);
  });

  it('reports unknown and missing types', () => {
    const p = base();
    (p.sections[0]!.questions[0] as { type: string }).type = 'essay';
    delete (p.sections[1]!.questions[0] as { type?: string }).type;
    const r = validatePaper(p);
    if (r.ok) throw new Error();
    expect(r.errors[0]).toMatch(/^Section 1, question 1 \("q1"\): type "essay" isn't supported/);
    expect(r.errors[1]).toMatch(/^Section 2, question 1 \("q2"\): "type" is missing/);
  });

  it('reports missing fields and duplicate ids', () => {
    const p = base() as Record<string, unknown> & ReturnType<typeof base>;
    delete (p as { title?: string }).title;
    p.sections[1]!.questions[1]!.id = 'q1';
    const r = validatePaper(p);
    if (r.ok) throw new Error();
    expect(r.errors).toContain('Paper: "title" is missing');
    const fixed = validatePaper({ ...p, title: 'T' });
    if (fixed.ok) throw new Error();
    expect(fixed.errors.some((e) => e.includes('id "q1" is already used by section 1, question 1'))).toBe(true);
  });

  it('checks fill_blank placeholders', () => {
    const p = base();
    p.sections[0]!.questions[0] = { id: 'q1', type: 'fill_blank', marks: 1, text: 'x {{1}} y {{3}}', blanks: 2 } as never;
    const r = validatePaper(p);
    if (r.ok) throw new Error();
    expect(r.errors).toContain('Section 1, question 1 ("q1"): fill_blank has blanks: 2 but the text has no {{2}} placeholder');
    expect(r.errors).toContain('Section 1, question 1 ("q1"): the text uses {{3}} but blanks is 2');
  });

  it('labels multipart part errors', () => {
    const p = base();
    p.sections[0]!.questions[0] = {
      id: 'q1', type: 'multipart', text: 'x',
      parts: [{ label: 'b', type: 'multipart', marks: 1, text: 'y' }],
    } as never;
    const r = validatePaper(p);
    if (r.ok) throw new Error();
    expect(r.errors[0]).toMatch(/^Section 1, question 1 \("q1"\), part \(b\): type "multipart" isn't supported — use one of "mcq", "typed", "math", "fill_blank"/);
  });
});

describe('parsePaperJson', () => {
  it('explains invalid JSON', () => {
    const r = parsePaperJson('{ "title": ');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]).toMatch(/isn't valid JSON/);
  });
  it('strips markdown code fences', () => {
    expect(parsePaperJson('```json\n' + JSON.stringify(mixed) + '\n```').ok).toBe(true);
  });
});
