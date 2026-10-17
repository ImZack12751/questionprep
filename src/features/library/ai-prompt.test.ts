import { describe, expect, it } from 'vitest';
import prompt from './ai-prompt.md?raw';
import { parsePaperJson } from '../paper/validate';

describe('AI prompt template', () => {
  const examples = [...prompt.matchAll(/SHORT EXAMPLE[^\n]*\n(\{[\s\S]*?\n\})/g)].map((m) => m[1]!);

  it('contains both examples, and each is a valid paper with no warnings', () => {
    expect(examples).toHaveLength(2);
    for (const ex of examples) expect(parsePaperJson(ex)).toMatchObject({ ok: true, warnings: [] });
  });

  it('documents contexts', () => {
    expect(prompt).toContain('"contextIds"');
    expect(prompt).toContain('Omit "contexts" entirely if there is no shared background.');
  });
});
