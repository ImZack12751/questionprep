/** Word-shaped runs of letters (with inner apostrophes or hyphens). */
export const WORD_RE = /[A-Za-zÀ-ÖØ-öø-ÿ]+(?:['’-][A-Za-zÀ-ÖØ-öø-ÿ]+)*/g;

/** Words worth checking: skips single letters, acronyms (all caps) and anything odd. */
export function shouldCheck(word: string): boolean {
  if (word.length < 2) return false;
  if (word.length <= 6 && word === word.toUpperCase()) return false;
  // Mixed case after the first letter is a formula or unit (NaCl, pH, mRNA), not a word.
  if (/[A-Z]/.test(word.slice(1)) && word !== word.toUpperCase()) return false;
  return true;
}

export const normalise = (w: string) => w.replace(/’/g, "'");
