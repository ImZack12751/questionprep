// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import maths from '../../../samples/maths-calculus-algebra.json';
import mixed from '../../../samples/mixed-science-english.json';
import sources from '../../../samples/individuals-societies-sources.json';
import { validatePaper } from '../paper/validate';
import type { Attempt } from '../attempt/types';
import { buildExport } from './exportData';
import { toMarkdown } from './markdown';

function attemptFor(raw: unknown, answers: Attempt['answers'], flags: Attempt['flags'] = {}): Attempt {
  const r = validatePaper(raw);
  if (!r.ok) throw new Error(r.errors.join());
  return {
    id: 'a', paperId: 'p', paper: r.paper, status: 'submitted', startedAt: 0, updatedAt: 0, submittedAt: 60_000,
    durationMs: r.paper.durationMinutes * 60_000, elapsedMs: 754_000, answers, flags, currentSection: 0,
  };
}

describe('JSON export', () => {
  const a = attemptFor(mixed, {
    S1: { type: 'mcq', selected: [2] },
    S2: { type: 'mcq', selected: [0, 2] },
    S3: { type: 'fill_blank', values: ['water', '', 'light'] },
    'E4::b': { type: 'mcq', selected: [1] },
  }, { S3: true });
  const x = buildExport(a);

  it('includes paper and timing info', () => {
    expect(x.paper.title).toBe('General Knowledge Mock — Science & English');
    expect(x.paper.totalMarks).toBe(23);
    expect(x.attempt.timeTakenSeconds).toBe(754);
    expect(x.attempt.flaggedCount).toBe(1);
  });

  it('formats answers by type', () => {
    const qs = x.sections[0]!.questions;
    expect(qs[0]!.answer).toBe('C. Nitrogen');
    expect(qs[1]!.answer).toEqual(['A. Helium', 'C. Neon']);
    expect(qs[2]!.answer).toEqual(['water', '', 'light']);
    expect(qs[2]!.flagged).toBe(true);
    expect(qs[3]!.answer).toBeNull();
    const e4 = x.sections[1]!.questions[3]!;
    expect(e4.parts?.map((p) => p.answer)).toEqual([null, 'B. Preposition']);
    expect(e4.number).toBe(9);
  });
});

describe('Markdown export', () => {
  it('puts answers next to questions with LaTeX intact', () => {
    const a = attemptFor(maths, { A1: { type: 'math', latex: 'x=12' }, 'A4::c': { type: 'typed', text: 'Minimum,\nsince a > 0' } }, { A2: true });
    const md = toMarkdown(a);
    expect(md).toContain('# Pure Mathematics — Practice Paper 1');
    expect(md).toContain('**Answer:** $x=12$');
    expect(md).toContain('### Question 2 (id: A2) — 3 marks 🚩 Flagged');
    expect(md).toContain('> Minimum,\n> since a > 0');
    expect(md).toContain('#### (b) — 1 mark');
    expect(md).toContain('{{1}}'.replace('{{1}}', '**[ ____ ]**'));
  });
});

describe('formatted written answers', () => {
  const a = attemptFor(mixed, {
    S4: { type: 'typed', text: 'Particles collide\n- faster when hot', html: '<div>Particles <b>collide</b></div><ul><li>faster when <i>hot</i></li></ul>' },
  });
  it('JSON export gets plain text', () => {
    expect(buildExport(a).sections[0]!.questions[3]!.answer).toBe('Particles collide\n- faster when hot');
  });
  it('Markdown export keeps formatting', () => {
    expect(toMarkdown(a)).toContain('> Particles **collide**\n> - faster when *hot*');
  });
});

describe('contexts in exports', () => {
  const a = attemptFor(sources, { '2': { type: 'typed', text: 'Flooding and no piped water.' } });

  it('JSON includes the sources and each question\'s contextIds', () => {
    const x = buildExport(a);
    expect(x.contexts?.map((c) => c.label)).toEqual(['Source A', 'Source B']);
    expect(x.sections[0]!.questions.map((q) => q.contextIds)).toEqual([['sourceA'], ['sourceA'], ['sourceA']]);
    expect(x.sections[1]!.questions[0]!.contextIds).toEqual(['sourceB']);
    expect(x.sections[1]!.questions[0]!.parts![0]).not.toHaveProperty('contextIds');
  });

  it('JSON for papers without contexts is unchanged', () => {
    const x = buildExport(attemptFor(mixed, {}));
    expect(x).not.toHaveProperty('contexts');
    expect(x.sections[0]!.questions[0]).not.toHaveProperty('contextIds');
  });

  it('Markdown shows a source in full once per run, then refers back', () => {
    const md = toMarkdown(a);
    expect(md.match(/> \*\*Source A\*\* — Extract from a city planning report \(fictional\), 2024\n>/g)).toHaveLength(2); // Q1 and Q5
    expect(md.match(/> \*\*Source A\*\* — .*_\(as above\)_/g)).toHaveLength(2); // Q2 and Q3
    expect(md).toContain('> | Year | Population (millions) |');
  });
});

describe('multi-line maths answers in exports', () => {
  const lines = ['\\frac{2.1-1.2}{1.2}\\times100', '=75\\%'];
  const a = attemptFor(sources, { '4::a': { type: 'math', latex: lines.join(' \\\\ '), lines } });
  it('JSON puts one line of working per line', () => {
    expect(buildExport(a).sections[1]!.questions[0]!.parts![0]!.answer).toBe('\\frac{2.1-1.2}{1.2}\\times100\n=75\\%');
  });
  it('Markdown shows each line as its own maths', () => {
    expect(toMarkdown(a)).toContain('**Answer:**\n\n$\\frac{2.1-1.2}{1.2}\\times100$  \n$=75\\%$');
  });
  it('legacy single-line maths answers export as before', () => {
    const legacy = attemptFor(maths, { A1: { type: 'math', latex: 'x=12' } });
    expect(buildExport(legacy).sections[0]!.questions[0]!.answer).toBe('x=12');
    expect(toMarkdown(legacy)).toContain('**Answer:** $x=12$');
  });
});
