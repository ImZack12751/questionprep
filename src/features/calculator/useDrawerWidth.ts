import { useCallback, useState } from 'react';

const KEY = 'qp-calc-width';
export const MIN_WIDTH = 320;
const DEFAULT_WIDTH = 420;

const maxWidth = () => Math.max(MIN_WIDTH, Math.round(window.innerWidth * 0.6));
const clamp = (w: number) => Math.min(maxWidth(), Math.max(MIN_WIDTH, Math.round(w)));

function saved(): number {
  try {
    const n = Number(localStorage.getItem(KEY));
    return n ? clamp(n) : DEFAULT_WIDTH;
  } catch {
    return DEFAULT_WIDTH;
  }
}

export function useDrawerWidth() {
  const [width, setWidth] = useState(saved);
  const set = useCallback((w: number) => {
    const c = clamp(w);
    setWidth(c);
    try {
      localStorage.setItem(KEY, String(c));
    } catch {
      /* not persisted */
    }
  }, []);
  return [width, set] as const;
}
