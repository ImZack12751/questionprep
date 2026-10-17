import { describe, expect, it } from 'vitest';
import { WORD_RE, shouldCheck } from './words';

describe('spelling word filter', () => {
  it('skips acronyms, formulas and single letters', () => {
    expect(['DNA', 'NaCl', 'pH', 'mRNA', 'a', 'I'].filter(shouldCheck)).toEqual([]);
  });
  it('checks ordinary and capitalised words', () => {
    expect(['colour', 'Colour', 'recieve', 'Particles'].every(shouldCheck)).toBe(true);
  });
  it('keeps apostrophes and hyphens inside words', () => {
    expect("It's a well-known student’s idea".match(WORD_RE)).toEqual(["It's", 'a', 'well-known', 'student’s', 'idea']);
  });
});
