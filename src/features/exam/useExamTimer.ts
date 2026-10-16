import { useCallback, useEffect, useRef, useState } from 'react';

interface Options {
  initialElapsedMs: number;
  durationMs: number;
  running: boolean;
  onExpire: () => void;
  /** Called periodically (and on pause/hide) with the current elapsed time. */
  onCheckpoint: (elapsedMs: number) => void;
  checkpointEveryMs?: number;
}

/**
 * Counts active exam time. Elapsed time accumulates only while `running`, so
 * time spent paused or with the tab closed never counts; the caller persists
 * the checkpointed value and resumes from it.
 */
export function useExamTimer({ initialElapsedMs, durationMs, running, onExpire, onCheckpoint, checkpointEveryMs = 5000 }: Options) {
  const base = useRef(initialElapsedMs);
  const segmentStart = useRef<number | null>(null);
  const [elapsed, setElapsed] = useState(initialElapsedMs);
  const cbs = useRef({ onExpire, onCheckpoint });
  cbs.current = { onExpire, onCheckpoint };
  const expired = useRef(false);

  const getElapsed = useCallback(
    () => Math.min(durationMs, base.current + (segmentStart.current === null ? 0 : performance.now() - segmentStart.current)),
    [durationMs],
  );

  useEffect(() => {
    if (!running) return;
    segmentStart.current = performance.now();

    const tick = () => {
      const e = getElapsed();
      setElapsed(e);
      if (e >= durationMs && !expired.current) {
        expired.current = true;
        cbs.current.onExpire();
      }
    };
    tick();
    const tickId = setInterval(tick, 250);
    const saveId = setInterval(() => cbs.current.onCheckpoint(getElapsed()), checkpointEveryMs);
    const onHide = () => {
      if (document.visibilityState === 'hidden') cbs.current.onCheckpoint(getElapsed());
    };
    const onPageHide = () => cbs.current.onCheckpoint(getElapsed());
    document.addEventListener('visibilitychange', onHide);
    addEventListener('pagehide', onPageHide);

    return () => {
      // Fold the running segment into the base before stopping.
      base.current = getElapsed();
      segmentStart.current = null;
      clearInterval(tickId);
      clearInterval(saveId);
      document.removeEventListener('visibilitychange', onHide);
      removeEventListener('pagehide', onPageHide);
      setElapsed(base.current);
      cbs.current.onCheckpoint(base.current);
    };
  }, [running, durationMs, checkpointEveryMs, getElapsed]);

  return { elapsedMs: elapsed, remainingMs: Math.max(0, durationMs - elapsed), getElapsed };
}
