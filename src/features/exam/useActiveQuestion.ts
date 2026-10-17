import { useCallback, useEffect, useRef, useState } from 'react';

/** Distance from the top of the viewport (below the top bar and section tabs) that marks the current question. */
const THRESHOLD = 200;

/** The id of the question currently being read in the visible section. */
export function useActiveQuestion(sectionKey: number) {
  const [active, setActive] = useState<string | null>(null);
  const pinnedUntil = useRef(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      if (performance.now() < pinnedUntil.current) return;
      const els = document.querySelectorAll<HTMLElement>('#section-panel .question-group');
      let current: HTMLElement | undefined = els[0];
      for (const el of els) {
        if (el.getBoundingClientRect().top <= THRESHOLD) current = el;
        else break;
      }
      // At the very bottom of the page the last questions can't reach the threshold.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        const last = els[els.length - 1];
        if (last && last.getBoundingClientRect().top < window.innerHeight / 2) current = last;
      }
      if (current) setActive(current.id.replace(/^question-/, ''));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    // Any manual scrolling ends a pin straight away.
    const unpin = () => {
      pinnedUntil.current = 0;
    };
    update();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('wheel', unpin, { passive: true });
    addEventListener('touchmove', unpin, { passive: true });
    addEventListener('keydown', unpin);
    return () => {
      removeEventListener('scroll', onScroll);
      removeEventListener('wheel', unpin);
      removeEventListener('touchmove', unpin);
      removeEventListener('keydown', unpin);
      cancelAnimationFrame(frame);
    };
  }, [sectionKey]);

  /** Mark a question as current after jumping to it, ignoring the scroll that follows. */
  const pin = useCallback((id: string) => {
    pinnedUntil.current = performance.now() + 1000;
    setActive(id);
  }, []);

  return [active, pin] as const;
}
