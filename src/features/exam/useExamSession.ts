import { useCallback, useEffect, useRef, useState } from 'react';
import { saveAttempt } from '../../lib/db';
import { submitted } from '../attempt/attempts';
import type { Answer, Attempt } from '../attempt/types';

/**
 * Holds the live attempt and autosaves it. Writes are serialised so an older
 * snapshot can never land after a newer one.
 */
export function useExamSession(initial: Attempt) {
  const [attempt, setAttempt] = useState(initial);
  const ref = useRef(initial);
  const elapsedSource = useRef<() => number>(() => initial.elapsedMs);
  const chain = useRef<Promise<void>>(Promise.resolve());
  const debounce = useRef<number | undefined>(undefined);

  const write = useCallback((a: Attempt) => {
    chain.current = chain.current.then(() => saveAttempt(a)).catch((e) => console.error('Autosave failed', e));
    return chain.current;
  }, []);

  /** Save the latest state right now, with the current timer reading. */
  const flush = useCallback(() => {
    clearTimeout(debounce.current);
    const a = ref.current;
    if (a.status !== 'in_progress') return chain.current;
    const next = { ...a, elapsedMs: elapsedSource.current(), updatedAt: Date.now() };
    ref.current = next;
    return write(next);
  }, [write]);

  const update = useCallback(
    (fn: (a: Attempt) => Attempt) => {
      if (ref.current.status !== 'in_progress') return;
      ref.current = fn(ref.current);
      setAttempt(ref.current);
      clearTimeout(debounce.current);
      debounce.current = window.setTimeout(flush, 300);
    },
    [flush],
  );

  const setAnswer = useCallback(
    (key: string, answer: Answer) => update((a) => ({ ...a, answers: { ...a.answers, [key]: answer } })),
    [update],
  );
  const toggleFlag = useCallback(
    (questionId: string) => update((a) => ({ ...a, flags: { ...a.flags, [questionId]: !a.flags[questionId] } })),
    [update],
  );
  const setSection = useCallback((i: number) => update((a) => ({ ...a, currentSection: i })), [update]);

  const submit = useCallback(
    async (auto: boolean) => {
      clearTimeout(debounce.current);
      const done = submitted({ ...ref.current, elapsedMs: auto ? ref.current.durationMs : elapsedSource.current() }, auto);
      ref.current = done;
      setAttempt(done);
      await write(done);
    },
    [write],
  );

  // Save anything pending when leaving the screen.
  useEffect(() => () => void flush(), [flush]);

  return { attempt, setAnswer, toggleFlag, setSection, submit, flush, elapsedSource };
}
