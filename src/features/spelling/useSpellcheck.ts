import { useEffect, type RefObject } from 'react';
import { checkEditor, clearSpelling, customSpellcheckSupported } from './spellcheck';

/**
 * Underlines misspelled words in an editable element, accepting both US and
 * UK spellings. Returns whether the browser's own spellchecker should be used
 * instead (only when custom underlines aren't supported).
 */
export function useSpellcheck(ref: RefObject<HTMLElement | null>, enabled: boolean): boolean {
  useEffect(() => {
    const el = ref.current;
    if (!el || !customSpellcheckSupported) return;
    if (!enabled) {
      clearSpelling(el);
      return;
    }
    let timer: number | undefined;
    const schedule = (delay: number) => {
      clearTimeout(timer);
      timer = window.setTimeout(() => void checkEditor(el), delay);
    };
    const onInput = () => schedule(400);
    const onBlur = () => schedule(0);
    // Moving the caret off a word (arrows, space, click) lets it be checked.
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key.startsWith('Arrow') || e.key === ' ' || e.key === 'Enter') schedule(150);
    };
    el.addEventListener('input', onInput);
    el.addEventListener('blur', onBlur);
    el.addEventListener('keyup', onKeyUp);
    el.addEventListener('mouseup', onBlur);
    schedule(0);
    return () => {
      clearTimeout(timer);
      el.removeEventListener('input', onInput);
      el.removeEventListener('blur', onBlur);
      el.removeEventListener('keyup', onKeyUp);
      el.removeEventListener('mouseup', onBlur);
      clearSpelling(el);
    };
  }, [ref, enabled]);

  return !customSpellcheckSupported;
}
