import { describe, expect, it } from 'vitest';
import { validatePaper } from './validate';
import maths from '../../../samples/maths-calculus-algebra.json';
import mixed from '../../../samples/mixed-science-english.json';
import sources from '../../../samples/individuals-societies-sources.json';

const contexts = [
  { id: 'srcA', label: 'Source A', title: 'Rainfall, 2020–2024', text: '| Year | mm |\n|---|---|\n| 2020 | 812 |' },
  { id: 'srcB', label: 'Source B', text: 'A short extract.' },
];

function paper(overrides: Record<string, unknown> = {}, questions?: unknown[]) {
  return {
    title: 'Contexts',
    durationMinutes: 20,
    contexts,
    sections: [
      {
        title: 'S1',
        questions: questions ?? [
          { id: '1', type: 'typed', marks: 2, text: 'Using Source A, describe the trend.', contextIds: ['srcA'] },
          { id: '2', type: 'mcq', marks: 1, text: 'Using Source A, which year was wettest?', options: ['2020', '2024'], contextIds: ['srcA'] },
          { id: '3', type: 'typed', marks: 4, text: 'Using Sources A and B, compare.', contextIds: ['srcA', 'srcB'] },
        ],
      },
    ],
    ...overrides,
  };
}

const errorsOf = (p: unknown) => {
  const r = validatePaper(p);
  if (r.ok) throw new Error('expected validation to fail');
  return r.errors;
};

describe('paper contexts', () => {
  it('accepts a context shared by several questions', () => {
    const r = validatePaper(paper());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.warnings).toEqual([]);
    expect(r.paper.contexts).toHaveLength(2);
    expect(r.paper.sections[0]!.questions[1]!.contextIds).toEqual(['srcA']);
  });

  it('keeps multiple contextIds in the listed order', () => {
    const r = validatePaper(paper());
    if (!r.ok) throw new Error(r.errors.join());
    expect(r.paper.sections[0]!.questions[2]!.contextIds).toEqual(['srcA', 'srcB']);
  });

  it('accepts contextIds on a multipart question', () => {
    const r = validatePaper(
      paper({}, [
        {
          id: '1',
          type: 'multipart',
          text: 'Study Source A.',
          contextIds: ['srcA'],
          parts: [
            { label: 'a', type: 'typed', marks: 1, text: 'Identify one trend.' },
            { label: 'b', type: 'math', marks: 2, text: 'Find the mean.' },
          ],
        },
        { id: '2', type: 'typed', marks: 1, text: 'Using Source B…', contextIds: ['srcB'] },
      ]),
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.paper.sections[0]!.questions[0]!.contextIds).toEqual(['srcA']);
  });

  it('rejects a dangling contextId, naming it', () => {
    const p = paper();
    (p.sections[0]!.questions[1] as { contextIds: string[] }).contextIds = ['srcZ'];
    expect(errorsOf(p)).toEqual([
      'Section 1, question 2 ("2"): contextIds refers to "srcZ", which is not a context id. Known context ids: "srcA", "srcB".',
    ]);
  });

  it('rejects duplicate context ids', () => {
    const p = paper({ contexts: [contexts[0], { ...contexts[1], id: 'srcA' }] });
    expect(errorsOf(p)).toContain('Context 2 ("Source B"): context id "srcA" is used more than once; context ids must be unique');
  });

  it('rejects duplicate labels', () => {
    const p = paper({ contexts: [contexts[0], { ...contexts[1], label: 'Source A' }] });
    expect(errorsOf(p)).toContain('Context 2 ("Source A"): context label "Source A" is used more than once; labels must be unique');
  });

  it('warns about (but accepts) an unused context', () => {
    const p = paper({ contexts: [...contexts, { id: 'srcC', label: 'Source C', text: 'Never used.' }] });
    const r = validatePaper(p);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.warnings).toEqual(['Context "Source C" (id "srcC") isn\'t used by any question, so it won\'t be shown.']);
  });

  it('rejects contextIds on a part', () => {
    const p = paper({}, [
      {
        id: '1',
        type: 'multipart',
        text: 'Stem',
        parts: [{ label: 'a', type: 'typed', marks: 1, text: 'x', contextIds: ['srcA'] }],
      },
      { id: '2', type: 'typed', marks: 1, text: 'y', contextIds: ['srcA', 'srcB'] },
    ]);
    expect(errorsOf(p)).toEqual([
      'Section 1, question 1 ("1"), part (a): parts cannot have contextIds; put contextIds on the multipart question instead',
    ]);
  });

  it('checks the shape of contexts and contextIds', () => {
    expect(errorsOf(paper({ contexts: 'Source A' }))).toEqual(['Paper: "contexts" should be a list']);
    expect(errorsOf(paper({ contexts: [{ id: 'srcA', label: 'Source A' }, contexts[1]] }))).toEqual(['Context 1 ("Source A"): "text" is missing']);
    const p = paper();
    (p.sections[0]!.questions[0] as { contextIds: unknown }).contextIds = 'srcA';
    expect(errorsOf(p)).toEqual(['Section 1, question 1 ("1"): "contextIds" should be a list']);
  });

  it('still accepts legacy papers with neither field', () => {
    for (const legacy of [maths, mixed]) {
      const r = validatePaper(legacy);
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.paper.contexts).toBeUndefined();
        expect(r.warnings).toEqual([]);
      }
    }
  });

  it('accepts the Individuals & Societies sample', () => {
    const r = validatePaper(sources);
    if (!r.ok) throw new Error(r.errors.join('\n'));
    expect(r.warnings).toEqual([]);
  });
});
