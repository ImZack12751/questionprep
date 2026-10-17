/// <reference lib="webworker" />
import nspell from 'nspell';

type Request = { type: 'check'; id: number; words: string[] } | { type: 'add'; words: string[] };

const base = new URL(import.meta.env.BASE_URL, self.location.origin).href;

async function load(lang: string) {
  const [aff, dic] = await Promise.all(
    ['aff', 'dic'].map((ext) =>
      fetch(`${base}dictionaries/${lang}.${ext}`).then((r) => {
        if (!r.ok) throw new Error(`Failed to load ${lang}.${ext}`);
        return r.text();
      }),
    ),
  );
  return nspell(aff!, dic!);
}

// A word is fine if it's correct in either US or UK English.
const ready = Promise.all([load('en-US'), load('en-GB')]);
const extra = new Set<string>();

function correct(checkers: ReturnType<typeof nspell>[], word: string): boolean {
  const variants = [word, word.toLowerCase()];
  // Possessives: "student's", "students'".
  if (/'s$/i.test(word)) variants.push(word.slice(0, -2));
  if (/s'$/i.test(word)) variants.push(word.slice(0, -1));
  // Hyphenated compounds are fine when every part is.
  if (word.includes('-')) return word.split('-').every((part) => !part || correct(checkers, part));
  return variants.some((v) => extra.has(v.toLowerCase()) || checkers.some((c) => c.correct(v)));
}

self.onmessage = async (e: MessageEvent<Request>) => {
  const msg = e.data;
  if (msg.type === 'add') {
    msg.words.forEach((w) => extra.add(w.toLowerCase()));
    return;
  }
  try {
    const checkers = await ready;
    const wrong = msg.words.filter((w) => !correct(checkers, w));
    self.postMessage({ id: msg.id, wrong });
  } catch {
    self.postMessage({ id: msg.id, wrong: [], failed: true });
  }
};
