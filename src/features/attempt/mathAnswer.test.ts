import { describe, expect, it } from 'vitest';
import { isAnswered } from './answers';
import { makeMathAnswer, mathLines, visibleMathLines } from './mathAnswer';

const item = { id: 'q1', type: 'math', marks: 2, text: 'x' } as const;

describe('multi-line maths answers', () => {
  it('stores every line and a joined LaTeX version', () => {
    const a = makeMathAnswer(['F = BIL', 'F = 0.5 \\times 2 \\times 0.1', '', 'F = 0.1\\,\\text{N}']);
    expect(a.lines).toEqual(['F = BIL', 'F = 0.5 \\times 2 \\times 0.1', '', 'F = 0.1\\,\\text{N}']);
    expect(a.latex).toBe('F = BIL \\\\ F = 0.5 \\times 2 \\times 0.1 \\\\ F = 0.1\\,\\text{N}');
    expect(isAnswered(item, a)).toBe(true);
  });

  it('counts an answer with only blank lines as unanswered', () => {
    expect(isAnswered(item, makeMathAnswer(['', '  ']))).toBe(false);
  });

  it('loads legacy single-line answers as one line', () => {
    const legacy = { type: 'math' as const, latex: 'x=12' };
    expect(mathLines(legacy)).toEqual(['x=12']);
    expect(visibleMathLines(legacy)).toEqual(['x=12']);
    expect(isAnswered(item, legacy)).toBe(true);
  });

  it('trims leading and trailing blank lines for display but keeps inner gaps', () => {
    expect(visibleMathLines(makeMathAnswer(['', 'a', '', 'b', '', '']))).toEqual(['a', '', 'b']);
  });

  it('starts with one empty line when there is no answer', () => {
    expect(mathLines(undefined)).toEqual(['']);
  });
});
