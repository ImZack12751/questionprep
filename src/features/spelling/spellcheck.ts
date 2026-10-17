import { WORD_RE, normalise, shouldCheck } from './words';

/** True when the browser can draw our own underlines (CSS Custom Highlight API). */
export const customSpellcheckSupported = typeof CSS !== 'undefined' && 'highlights' in CSS && typeof Highlight !== 'undefined';

let worker: Worker | null = null;
let nextId = 0;
const pending = new Map<number, (wrong: string[]) => void>();
/** word → is it spelled correctly */
const cache = new Map<string, boolean>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./spell.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<{ id: number; wrong: string[] }>) => {
      pending.get(e.data.id)?.(e.data.wrong);
      pending.delete(e.data.id);
    };
  }
  return worker;
}

/** Returns the subset of words that are misspelled in both US and UK English. */
export async function findMisspelled(words: Iterable<string>): Promise<Set<string>> {
  const unknown = [...new Set(words)].filter((w) => !cache.has(w));
  if (unknown.length) {
    const id = nextId++;
    const wrong = await new Promise<string[]>((resolve) => {
      pending.set(id, resolve);
      getWorker().postMessage({ type: 'check', id, words: unknown });
    });
    const wrongSet = new Set(wrong);
    unknown.forEach((w) => cache.set(w, !wrongSet.has(w)));
  }
  return new Set([...words].filter((w) => cache.get(w) === false));
}

/** Treat every word in the paper itself (technical terms, names) as correct. */
export function addVocabulary(text: string) {
  const words = [...new Set(text.match(WORD_RE) ?? [])].map(normalise);
  words.forEach((w) => cache.set(w, true));
  getWorker().postMessage({ type: 'add', words });
}

// One shared highlight holds the misspelled ranges of every answer box.
const rangesByEditor = new Map<Element, Range[]>();

function paint() {
  const all = [...rangesByEditor.values()].flat();
  if (all.length) CSS.highlights.set('qp-spelling', new Highlight(...all));
  else CSS.highlights.delete('qp-spelling');
}

export function clearSpelling(editor: Element) {
  if (!customSpellcheckSupported) return;
  rangesByEditor.delete(editor);
  paint();
}

/** Check the text in an editable element and underline misspelled words. */
export async function checkEditor(editor: HTMLElement) {
  if (!customSpellcheckSupported) return;
  const found: { node: Text; start: number; end: number; word: string }[] = [];
  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
    for (const m of node.data.matchAll(WORD_RE)) {
      const word = normalise(m[0]);
      if (shouldCheck(word)) found.push({ node, start: m.index!, end: m.index! + m[0].length, word });
    }
  }

  const wrong = await findMisspelled(found.map((f) => f.word));

  // Don't flag the word still being typed (caret right at its end).
  const sel = document.getSelection();
  const typing = document.activeElement === editor && sel?.isCollapsed ? { node: sel.anchorNode, offset: sel.anchorOffset } : null;

  const ranges: Range[] = [];
  for (const f of found) {
    if (!wrong.has(f.word) || !f.node.isConnected) continue;
    if (typing && typing.node === f.node && typing.offset === f.end) continue;
    // Text changed while we were checking; the next pass will catch it.
    if (normalise(f.node.data.slice(f.start, f.end)) !== f.word) continue;
    const r = new Range();
    r.setStart(f.node, f.start);
    r.setEnd(f.node, f.end);
    ranges.push(r);
  }
  rangesByEditor.set(editor, ranges);
  paint();
}
